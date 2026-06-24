/// <reference types="node" />
import { prisma } from '../prisma/client'
import { uploadFile, downloadFile, getSignedUrl } from '../utils/storage'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createHash } from 'crypto'

export class SigningService {
  async getDocumentByToken(accessToken: string, ipAddress?: string) {
    const signer = await prisma.signer.findUnique({
      where: { accessToken },
      include: {
        document: {
          include: {
            fields: { where: { signerId: undefined } },
          },
        },
      },
    })

    if (!signer) throw new Error('Invalid or expired signing link')
    if (signer.status === 'SIGNED') throw new Error('You have already signed this document')
    if (signer.status === 'DECLINED') throw new Error('You have declined to sign this document')
    if (signer.document.status === 'CANCELLED') throw new Error('This document has been cancelled')

    const fields = await prisma.field.findMany({
      where: { documentId: signer.documentId, signerId: signer.id },
    })

    const documentUrl = await getSignedUrl(signer.document.originalUrl)

    if (signer.status === 'PENDING') {
      await prisma.signer.update({
        where: { id: signer.id },
        data: { status: 'VIEWED', viewedAt: new Date() },
      })

      await prisma.auditLog.create({
        data: {
          documentId: signer.documentId,
          action: 'DOCUMENT_VIEWED',
          actor: signer.email,
          ipAddress,
        },
      })
    }

    return {
      signer: {
        id: signer.id,
        name: signer.name,
        email: signer.email,
        status: signer.status,
      },
      document: {
        id: signer.document.id,
        title: signer.document.title,
        status: signer.document.status,
      },
      fields,
      documentUrl,
    }
  }

  async signDocument(accessToken: string, signatures: { fieldId: string; value: string }[], ipAddress?: string) {
    const signer = await prisma.signer.findUnique({
      where: { accessToken },
      include: { document: true },
    })

    if (!signer) throw new Error('Invalid signing link')
    if (signer.status === 'SIGNED') throw new Error('Already signed')
    if (signer.document.status === 'CANCELLED') throw new Error('Document has been cancelled')

    for (const sig of signatures) {
      await prisma.field.update({
        where: { id: sig.fieldId },
        data: { value: sig.value, completed: true },
      })
    }

    await prisma.signer.update({
      where: { id: signer.id },
      data: { status: 'SIGNED', signedAt: new Date(), ipAddress },
    })

    await prisma.auditLog.create({
      data: {
        documentId: signer.documentId,
        action: 'DOCUMENT_SIGNED',
        actor: signer.email,
        ipAddress,
        metadata: JSON.stringify({ fieldsCount: signatures.length }),
      },
    })

    await this.checkAndFinalizeDocument(signer.documentId)

    return { message: 'Document signed successfully' }
  }

  async declineDocument(accessToken: string, reason?: string, ipAddress?: string) {
    const signer = await prisma.signer.findUnique({
      where: { accessToken },
      include: { document: true },
    })

    if (!signer) throw new Error('Invalid signing link')
    if (signer.status === 'SIGNED') throw new Error('Already signed')

    await prisma.signer.update({
      where: { id: signer.id },
      data: { status: 'DECLINED' },
    })

    await prisma.document.update({
      where: { id: signer.documentId },
      data: { status: 'CANCELLED' },
    })

    await prisma.auditLog.create({
      data: {
        documentId: signer.documentId,
        action: 'DOCUMENT_DECLINED',
        actor: signer.email,
        ipAddress,
        metadata: reason ? JSON.stringify({ reason }) : undefined,
      },
    })

    return { message: 'Document declined' }
  }

  private async checkAndFinalizeDocument(documentId: string) {
    const signers = await prisma.signer.findMany({ where: { documentId } })
    const allSigned = signers.every((s) => s.status === 'SIGNED')

    if (!allSigned) return

    await this.finalizeDocument(documentId)
  }

  private async finalizeDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        signers: true,
        fields: { where: { completed: true } },
      },
    })

    if (!document) return

    try {
      const pdfBuffer = await downloadFile(document.originalUrl)
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const pages = pdfDoc.getPages()

      for (const field of document.fields) {
        const page = pages[field.page - 1]
        if (!page) continue
        const { height } = page.getSize()
        const y = height - field.y - field.height

        if (field.type === 'SIGNATURE' || field.type === 'INITIALS' || field.type === 'TEXT') {
          page.drawText(field.value || '', {
            x: field.x,
            y,
            size: field.type === 'SIGNATURE' ? 14 : 10,
            font: helvetica,
            color: rgb(0, 0, 0.8),
          })
        } else if (field.type === 'DATE') {
          page.drawText(new Date().toLocaleDateString(), {
            x: field.x,
            y,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          })
        } else if (field.type === 'CHECKBOX' && field.value === 'true') {
          page.drawText('✓', {
            x: field.x,
            y,
            size: 12,
            font: helvetica,
            color: rgb(0, 0.5, 0),
          })
        }
      }

      const signedPdfBytes = await pdfDoc.save()
      const signedBuffer = Buffer.from(signedPdfBytes)
      const signedPath = `signed/${documentId}/signed-${Date.now()}.pdf`
      const fileHash = createHash('sha256').update(signedBuffer).digest('hex')

      await uploadFile(signedPath, signedBuffer)

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'COMPLETED',
          signedUrl: signedPath,
          fileHash,
          completedAt: new Date(),
        },
      })

      await prisma.auditLog.create({
        data: {
          documentId,
          action: 'DOCUMENT_COMPLETED',
          actor: 'system',
          metadata: JSON.stringify({ fileHash }),
        },
      })

      console.log(`✅ Document ${documentId} finalized with hash: ${fileHash}`)
    } catch (error) {
      console.error('Failed to finalize document:', error)
    }
  }
}