export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Document {
  id: string
  title: string
  ownerId: string
  originalUrl: string
  signedUrl?: string
  status: 'DRAFT' | 'PENDING' | 'COMPLETED' | 'CANCELLED'
  fileHash?: string
  createdAt: string
  completedAt?: string
  signers?: Signer[]
  fields?: Field[]
  auditLogs?: AuditLog[]
  _count?: { fields: number }
}

export interface Signer {
  id: string
  documentId: string
  name: string
  email: string
  order: number
  status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'DECLINED'
  accessToken: string
  viewedAt?: string
  signedAt?: string
}

export interface Field {
  id: string
  documentId: string
  signerId: string
  type: 'SIGNATURE' | 'INITIALS' | 'DATE' | 'TEXT' | 'CHECKBOX'
  page: number
  x: number
  y: number
  width: number
  height: number
  value?: string
  completed: boolean
}

export interface AuditLog {
  id: string
  documentId: string
  action: string
  actor: string
  ipAddress?: string
  metadata?: string
  timestamp: string
}

export interface SigningData {
  signer: {
    id: string
    name: string
    email: string
    status: string
  }
  document: {
    id: string
    title: string
    status: string
  }
  fields: Field[]
  documentUrl: string
}