/// <reference types="node" />
/// <reference types="multer" />
import { Response } from 'express'
import { DocumentService } from '../services/document.service'
import { AuthRequest } from '../middleware/auth'

const documentService = new DocumentService()

export class DocumentController {
  async uploadDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }

      const file = req.file
      if (!file) {
        res.status(400).json({ success: false, message: 'PDF file is required' })
        return
      }

      if (file.mimetype !== 'application/pdf') {
        res.status(400).json({ success: false, message: 'Only PDF files are allowed' })
        return
      }

      const { title } = req.body
      if (!title) {
        res.status(400).json({ success: false, message: 'Document title is required' })
        return
      }

      const document = await documentService.uploadDocument(userId, file, title)
      res.status(201).json({ success: true, message: 'Document uploaded successfully', data: document })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Upload failed' })
    }
  }

  async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }
      const documents = await documentService.getDocuments(userId)
      res.status(200).json({ success: true, message: 'Documents fetched', data: documents })
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch documents' })
    }
  }

  async getDocumentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }
      const id = req.params.id as string
      const document = await documentService.getDocumentById(id, userId)
      res.status(200).json({ success: true, message: 'Document fetched', data: document })
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Document not found' })
    }
  }

  async addSigners(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }
      const id = req.params.id as string
      const { signers } = req.body
      if (!signers || !Array.isArray(signers) || signers.length === 0) {
        res.status(400).json({ success: false, message: 'At least one signer is required' })
        return
      }
      const result = await documentService.addSigners(id, userId, signers)
      res.status(201).json({ success: true, message: 'Signers added successfully', data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to add signers' })
    }
  }

  async addFields(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }
      const id = req.params.id as string
      const { fields } = req.body
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        res.status(400).json({ success: false, message: 'At least one field is required' })
        return
      }
      const result = await documentService.addFields(id, userId, fields)
      res.status(201).json({ success: true, message: 'Fields saved successfully', data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to save fields' })
    }
  }

  async sendDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }
      const id = req.params.id as string
      const result = await documentService.sendDocument(id, userId)
      res.status(200).json({ success: true, message: result.message })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to send document' })
    }
  }

  async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }
      const id = req.params.id as string
      const result = await documentService.deleteDocument(id, userId)
      res.status(200).json({ success: true, message: result.message })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to delete document' })
    }
  }
}