/// <reference types="node" />
import { Router } from 'express'
import { SigningController } from '../controllers/signing.controller'

const router = Router()
const signingController = new SigningController()

router.get('/:token', (req, res) => signingController.getDocumentByToken(req, res))
router.post('/:token/sign', (req, res) => signingController.signDocument(req, res))
router.post('/:token/decline', (req, res) => signingController.declineDocument(req, res))

export default router