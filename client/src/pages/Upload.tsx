import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentAPI } from '../services/api'
import { Upload, FileText, X, ArrowLeft, ArrowRight } from 'lucide-react'

const UploadPage = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') {
      setFile(dropped)
      if (!title) setTitle(dropped.name.replace('.pdf', ''))
    } else {
      setError('Only PDF files are allowed')
    }
  }, [title])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected?.type === 'application/pdf') {
      setFile(selected)
      if (!title) setTitle(selected.name.replace('.pdf', ''))
    } else {
      setError('Only PDF files are allowed')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please select a PDF file'); return }
    if (!title.trim()) { setError('Please enter a document title'); return }

    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title.trim())
      const res = await documentAPI.upload(formData)
      navigate(`/documents/${res.data.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Upload Document</h1>
        <p className="text-gray-400 text-sm mt-1 font-mono">// upload a PDF to get started</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            dragging
              ? 'border-accent-500 bg-accent-600/10'
              : file
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-base-600 hover:border-accent-600/50 bg-base-900'
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-green-400" />
              <div className="text-left">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="ml-4 text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-1">Drop your PDF here</p>
              <p className="text-gray-400 text-sm mb-4">or click to browse</p>
              <label className="bg-base-800 hover:bg-base-700 border border-base-600 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors">
                Browse Files
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </>
          )}
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-1.5 block">Document Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-base-900 border border-base-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-500 transition-colors"
            placeholder="e.g. Rental Agreement - 123 Main St"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="group w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Uploading...' : 'Upload & Continue'}
          {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </form>
    </div>
  )
}

export default UploadPage