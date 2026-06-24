/// <reference types="node" />
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma/client'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingUser) throw new Error('Email already in use')

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword },
    })

    const payload = { userId: user.id, email: user.email, name: user.name }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    }
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('Invalid email or password')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('Invalid email or password')

    const payload = { userId: user.id, email: user.email, name: user.name }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    }
  }

  async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token)
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) throw new Error('User not found')

    const payload = { userId: user.id, email: user.email, name: user.name }
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    if (!user) throw new Error('User not found')
    return user
  }
}