/// <reference types="node" />
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import documentRoutes from './routes/document.routes'
import signingRoutes from './routes/signing.routes'

dotenv.config()

import authRoutes from './routes/auth.routes'

const app = express()
const httpServer = createServer(app)

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5175',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'SignFlow API is running!' })
})

app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/sign', signingRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

const PORT = process.env.PORT || 5002

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 SignFlow API ready!`)
})

export default app