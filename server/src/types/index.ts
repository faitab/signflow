/// <reference types="node" />

export interface JwtPayload {
  userId: string
  email: string
  name: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}