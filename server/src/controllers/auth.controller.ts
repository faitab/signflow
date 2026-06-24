/// <reference types="node" />
import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { AuthRequest } from '../middleware/auth'

const authService = new AuthService()

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body

      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Name, email and password are required' })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.status(400).json({ success: false, message: 'Please enter a valid email address' })
        return
      }

      if (password.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
        return
      }

      const result = await authService.register({ name, email, password })
      res.status(201).json({ success: true, message: 'Account created successfully', data: result })
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Registration failed' })
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' })
        return
      }
      const result = await authService.login(email, password)
      res.status(200).json({ success: true, message: 'Login successful', data: result })
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Login failed' })
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token is required' })
        return
      }
      const result = await authService.refreshToken(refreshToken)
      res.status(200).json({ success: true, message: 'Token refreshed successfully', data: result })
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Token refresh failed' })
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' })
        return
      }
      const user = await authService.getProfile(userId)
      res.status(200).json({ success: true, message: 'Profile fetched successfully', data: user })
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'Profile not found' })
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  }
}