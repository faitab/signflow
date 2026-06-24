/// <reference types="multer" />
/// <reference types="node" />
import { prisma } from '../prisma/client'
import { uploadFile, getSignedUrl, downloadFile } from '../utils/storage'
import { createHash } from 'crypto'
import { type Multer } from 'multer'

export class DocumentService {
 async uploadDocument(userId: string, file: Express.Multer.File, title: string) {
    const fileHash = createHash('sha256').update(file.buffer).digest('hex')
    const path = `${userId}/${Date.now()}-${file.originalname}`

    await uploadFile(path, file.buffer, 'application/pdf')

    const document = await prisma.document.create({
      data: {
        title,
        ownerId: userId,
        originalUrl: path,
        fileHash,
        status: 'DRAFT',
      },
    })

    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        action: 'DOCUMENT_UPLOADED',
        actor: userId,
      },
    })

    return document
  }

  async getDocuments(userId: string) {
    return prisma.document.findMany({
      where: { ownerId: userId },
      include: {
        signers: true,
        _count: { select: { fields: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getDocumentById(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        signers: true,
        fields: true,
        auditLogs: { orderBy: { timestamp: 'desc' } },
      },
    })

    if (!document) throw new Error('Document not found')
    if (document.ownerId !== userId) throw new Error('Unauthorized')

    const signedUrl = await getSignedUrl(document.originalUrl)
    return { ...document, signedUrl }
  }

  async getDocumentUrl(documentId: string) {
    const document = await prisma.document.findUnique({ where: { id: documentId } })
    if (!document) throw new Error('Document not found')
    return getSignedUrl(document.originalUrl)
  }

  async addSigners(documentId: string, userId: string, signers: { name: string; email: string; order?: number }[]) {
    const document = await prisma.document.findUnique({ where: { id: documentId } })
    if (!document) throw new Error('Document not found')
    if (document.ownerId !== userId) throw new Error('Unauthorized')

    const created = await Promise.all(
      signers.map((signer, index) =>
        prisma.signer.create({
          data: {
            documentId,
            name: signer.name,
            email: signer.email,
            order: signer.order ?? index,
          },
        })
      )
    )

    return created
  }

  async addFields(documentId: string, userId: string, fields: {
    signerId: string
    type: 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX'
    page: number
    x: number
    y: number
    width: number
    height: number
  }[]) {
    const document = await prisma.document.findUnique({ where: { id: documentId } })
    if (!document) throw new Error('Document not found')
    if (document.ownerId !== userId) throw new Error('Unauthorized')

    return prisma.field.createMany({
      data: fields.map((f) => ({ ...f, documentId })),
    })
  }

  async sendDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { signers: true },
    })

    if (!document) throw new Error('Document not found')
    if (document.ownerId !== userId) throw new Error('Unauthorized')
    if (document.signers.length === 0) throw new Error('Add at least one signer before sending')

    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PENDING' },
    })

    for (const signer of document.signers) {
      const signingLink = `${process.env.CLIENT_URL}/sign/${signer.accessToken}`
      await this.sendSigningEmail(signer.name, signer.email, document.title, signingLink)
    }

    await prisma.auditLog.create({
      data: {
        documentId,
        action: 'DOCUMENT_SENT',
        actor: userId,
      },
    })

    return { message: 'Document sent to all signers' }
  }

  async deleteDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({ where: { id: documentId } })
    if (!document) throw new Error('Document not found')
    if (document.ownerId !== userId) throw new Error('Unauthorized')
    if (document.status !== 'DRAFT') throw new Error('Only draft documents can be deleted')

    await prisma.document.delete({ where: { id: documentId } })
    return { message: 'Document deleted' }
  }

  private async sendSigningEmail(name: string, email: string, documentTitle: string, signingLink: string) {
    console.log('📧 ========================')
    console.log(`📧 TO: ${email}`)
    console.log(`📧 SUBJECT: You've been requested to sign: ${documentTitle}`)
    console.log(`📧 BODY:`)
    console.log(`   Hi ${name},`)
    console.log(`   You have been requested to sign the document: "${documentTitle}"`)
    console.log(`   Click the link below to review and sign:`)
    console.log(`   ${signingLink}`)
    console.log(`   This link is unique to you. Do not share it.`)
    console.log('📧 ========================')
  }
}