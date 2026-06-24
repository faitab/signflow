/// <reference types="node" />
import { Request, Response } from 'express'
import { SigningService } from '../services/signing.service'

const signingService = new SigningService()

export class SigningController {
  async getDocumentByToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string
      const ipAddress = req.ip
      const result = await signingService.getDocumentByToken(token, ipAddress)
      res.status(200).json({ success: true, message: 'Document fetched', data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Invalid signing link' })
    }
  }

  async signDocument(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string
      const { signatures } = req.body
      const ipAddress = req.ip

      if (!signatures || !Array.isArray(signatures) || signatures.length === 0) {
        res.status(400).json({ success: false, message: 'Signatures are required' })
        return
      }

      const result = await signingService.signDocument(token, signatures, ipAddress)
      res.status(200).json({ success: true, message: result.message })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to sign document' })
    }
  }

  async declineDocument(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string
      const { reason } = req.body
      const ipAddress = req.ip
      const result = await signingService.declineDocument(token, reason, ipAddress)
      res.status(200).json({ success: true, message: result.message })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to decline document' })
    }
  }
}