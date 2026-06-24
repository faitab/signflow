/// <reference types="node" />
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
)

const BUCKET = process.env.SUPABASE_BUCKET || 'documents'

export const uploadFile = async (path: string, buffer: Buffer, contentType = 'application/pdf') => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return data
}

export const downloadFile = async (path: string): Promise<Buffer> => {
  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error) throw new Error(`Storage download failed: ${error.message}`)
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export const getSignedUrl = async (path: string, expiresIn = 60 * 60) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn)
  if (error) throw new Error(`Failed to create signed URL: ${error.message}`)
  return data.signedUrl
}

export const deleteFile = async (path: string) => {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`Storage delete failed: ${error.message}`)
}

export default supabase