import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentAPI } from '../services/api'
import type { Document } from '../types'
import { ArrowLeft, Send, UserPlus, CheckCircle2 } from 'lucide-react'
import PDFFieldPlacer from '../components/ui/PDFFieldPlacer'

const statusColor: Record<string, string> = {
  DRAFT: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  COMPLETED: 'text-green-400 bg-green-400/10 border-green-400/20',
  CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const signerStatusColor: Record<string, string> = {
  PENDING: 'text-gray-400',
  VIEWED: 'text-yellow-400',
  SIGNED: 'text-green-400',
  DECLINED: 'text-red-400',
}

const DocumentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState<Document | null>(null)
  const [documentUrl, setDocumentUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSignerForm, setShowSignerForm] = useState(false)
  const [newSigner, setNewSigner] = useState({ name: '', email: '' })
  const [savingFields, setSavingFields] = useState(false)
  const [activeTab, setActiveTab] = useState<'fields' | 'signers' | 'audit'>('fields')

  useEffect(() => {
    fetchDocument()
  }, [id])

  const fetchDocument = async () => {
    if (!id) return
    try {
      const res = await documentAPI.getById(id)
      setDocument(res.data.data)
      setDocumentUrl(res.data.data.signedUrl || '')
      console.log('Document URL:', res.data.data.signedUrl)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch document')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSigner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await documentAPI.addSigners(id, [newSigner])
      setNewSigner({ name: '', email: '' })
      setShowSignerForm(false)
      setSuccess('Signer added!')
      fetchDocument()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add signer')
    }
  }

  const handleSaveFields = async (fields: any[]) => {
    if (!id) return
    setSavingFields(true)
    try {
      await documentAPI.addFields(id, fields)
      setSuccess(`${fields.length} field${fields.length !== 1 ? 's' : ''} saved!`)
      fetchDocument()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fields')
    } finally {
      setSavingFields(false)
    }
  }

  const handleSend = async () => {
    if (!id) return
    try {
      await documentAPI.send(id)
      setSuccess('Document sent to all signers!')
      fetchDocument()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send document')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-accent-400">Loading...</div></div>
  if (!document) return <div className="text-center text-gray-400">Document not found</div>

  const acceptedSigners = document.signers || []

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-base-900 rounded-2xl p-6 border border-base-700">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{document.title}</h1>
            <p className="text-gray-400 text-sm mt-1">Created {new Date(document.createdAt).toLocaleDateString()}</p>
            {document.fileHash && (
              <p className="text-gray-600 text-xs font-mono mt-1">SHA-256: {document.fileHash.slice(0, 32)}...</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-full border font-mono ${statusColor[document.status]}`}>
              {document.status}
            </span>
            {document.status === 'DRAFT' && (
              <button
                onClick={handleSend}
                disabled={!document.signers?.length || !document.fields?.length}
                className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                title={!document.signers?.length ? 'Add signers first' : !document.fields?.length ? 'Add fields first' : ''}
              >
                <Send className="w-4 h-4" />
                Send for Signing
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-base-700 pb-0">
        {(['fields', 'signers', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-accent-500 text-accent-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'fields' ? 'Place Fields' : tab === 'signers' ? `Signers (${document.signers?.length || 0})` : 'Audit Trail'}
          </button>
        ))}
      </div>

      {activeTab === 'fields' && (
  <div className="space-y-4">
    {document.status === 'DRAFT' ? (
      acceptedSigners.length === 0 ? (
        <div className="bg-base-900 rounded-2xl p-8 border border-base-700 text-center">
          <p className="text-gray-400">Add at least one signer before placing fields.</p>
          <button
            onClick={() => setActiveTab('signers')}
            className="text-accent-400 hover:text-accent-300 text-sm mt-2 inline-block"
          >
            Go to Signers →
          </button>
        </div>
      ) : documentUrl.length > 0 ? (
        <PDFFieldPlacer
          pdfUrl={documentUrl}
          signers={acceptedSigners}
          onSave={handleSaveFields}
          saving={savingFields}
        />
      ) : (
        <div className="text-center py-8 text-gray-400">Loading PDF...</div>
      )
    ) : (
      <div className="bg-base-900 rounded-2xl p-6 border border-base-700">
        <h2 className="text-lg font-semibold text-white mb-3">Placed Fields</h2>
        <div className="space-y-2">
          {document.fields?.map((field) => (
            <div key={field.id} className="flex items-center justify-between p-3 bg-base-800 rounded-xl border border-base-600">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-accent-400 bg-accent-600/10 px-2 py-1 rounded border border-accent-600/20">{field.type}</span>
                <span className="text-gray-400 text-xs">Page {field.page}</span>
              </div>
              {field.completed && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

      {activeTab === 'signers' && (
        <div className="bg-base-900 rounded-2xl p-6 border border-base-700 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Signers</h2>
            {document.status === 'DRAFT' && (
              <button
                onClick={() => setShowSignerForm(!showSignerForm)}
                className="flex items-center gap-2 text-accent-400 hover:text-accent-300 text-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Signer
              </button>
            )}
          </div>

          {showSignerForm && (
            <form onSubmit={handleAddSigner} className="bg-base-800 rounded-xl p-4 border border-base-600 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Name</label>
                  <input
                    type="text"
                    value={newSigner.name}
                    onChange={(e) => setNewSigner({ ...newSigner, name: e.target.value })}
                    className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Email</label>
                  <input
                    type="email"
                    value={newSigner.email}
                    onChange={(e) => setNewSigner({ ...newSigner, email: e.target.value })}
                    className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-accent-600 hover:bg-accent-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">Add</button>
                <button type="button" onClick={() => setShowSignerForm(false)} className="bg-base-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          )}

          {document.signers?.length === 0 ? (
            <p className="text-gray-500 text-sm">No signers added yet.</p>
          ) : (
            <div className="space-y-2">
              {document.signers?.map((signer) => (
                <div key={signer.id} className="flex items-center justify-between p-3 bg-base-800 rounded-xl border border-base-600">
                  <div>
                    <p className="text-white text-sm font-medium">{signer.name}</p>
                    <p className="text-gray-400 text-xs">{signer.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono ${signerStatusColor[signer.status]}`}>{signer.status}</span>
                    {signer.signedAt && <p className="text-gray-500 text-xs">{new Date(signer.signedAt).toLocaleDateString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-base-900 rounded-2xl p-6 border border-base-700">
          <h2 className="text-lg font-semibold text-white mb-4">Audit Trail</h2>
          {document.auditLogs?.length === 0 ? (
            <p className="text-gray-500 text-sm">No audit logs yet.</p>
          ) : (
            <div className="space-y-2">
              {document.auditLogs?.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-base-800 rounded-xl border border-base-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-mono">{log.action}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {log.actor} • {new Date(log.timestamp).toLocaleString()}
                      {log.ipAddress ? ` • ${log.ipAddress}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DocumentDetail