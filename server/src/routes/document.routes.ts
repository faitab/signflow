/// <reference types="node" />
import { Router } from 'express'
import multer from 'multer'
import { DocumentController } from '../controllers/document.controller'
import { authenticate } from '../middleware/auth'

const router = Router()
const documentController = new DocumentController()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/', authenticate, upload.single('file'), (req, res) => documentController.uploadDocument(req as any, res))
router.get('/', authenticate, (req, res) => documentController.getDocuments(req as any, res))
router.get('/:id', authenticate, (req, res) => documentController.getDocumentById(req as any, res))
router.post('/:id/signers', authenticate, (req, res) => documentController.addSigners(req as any, res))
router.post('/:id/fields', authenticate, (req, res) => documentController.addFields(req as any, res))
router.post('/:id/send', authenticate, (req, res) => documentController.sendDocument(req as any, res))
router.delete('/:id', authenticate, (req, res) => documentController.deleteDocument(req as any, res))

export default router