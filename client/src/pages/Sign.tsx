import  { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { signingAPI } from '../services/api'
import type { SigningData, Field } from '../types'
import { FileSignature, CheckCircle2, XCircle, PenLine } from 'lucide-react'

const Sign = () => {
  const { token } = useParams()
  const [data, setData] = useState<SigningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  useEffect(() => {
    if (!token) return
    signingAPI.getByToken(token)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Invalid signing link'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSign = async () => {
    if (!token) return
    const sigs = Object.entries(signatures).map(([fieldId, value]) => ({ fieldId, value }))
    if (sigs.length === 0) { setError('Please fill in all required fields'); return }

    setSubmitting(true)
    try {
      await signingAPI.sign(token, sigs)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sign')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      await signingAPI.decline(token, declineReason)
      setError('You have declined to sign this document.')
      setShowDecline(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to decline')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center">
      <div className="text-accent-400 text-lg">Loading document...</div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Document Signed!</h1>
        <p className="text-gray-400">You have successfully signed <span className="text-white font-medium">"{data?.document.title}"</span>. A copy will be sent to you once all parties have signed.</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Unable to Sign</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    </div>
  )

  if (!data) return null

  const renderField = (field: Field) => {
    switch (field.type) {
      case 'SIGNATURE':
      case 'INITIALS':
        return (
          <div key={field.id} className="space-y-1">
            <label className="text-gray-400 text-sm flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              {field.type === 'SIGNATURE' ? 'Your Signature' : 'Your Initials'}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={signatures[field.id] || ''}
              onChange={(e) => setSignatures({ ...signatures, [field.id]: e.target.value })}
              className="w-full bg-base-800 border border-base-600 rounded-xl px-4 py-3 text-white text-xl italic focus:outline-none focus:border-accent-500 transition-colors"
              placeholder={field.type === 'SIGNATURE' ? 'Type your full name' : 'Type your initials'}
              style={{ fontFamily: 'cursive' }}
            />
            <p className="text-gray-500 text-xs">Page {field.page} • Position ({field.x}, {field.y})</p>
          </div>
        )
      case 'DATE':
        return (
          <div key={field.id} className="space-y-1">
            <label className="text-gray-400 text-sm">Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={signatures[field.id] || new Date().toISOString().split('T')[0]}
              onChange={(e) => setSignatures({ ...signatures, [field.id]: e.target.value })}
              className="w-full bg-base-800 border border-base-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-500 transition-colors"
            />
            <p className="text-gray-500 text-xs">Page {field.page}</p>
          </div>
        )
      case 'TEXT':
        return (
          <div key={field.id} className="space-y-1">
            <label className="text-gray-400 text-sm">Text Field <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={signatures[field.id] || ''}
              onChange={(e) => setSignatures({ ...signatures, [field.id]: e.target.value })}
              className="w-full bg-base-800 border border-base-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-500 transition-colors"
              placeholder="Enter text"
            />
            <p className="text-gray-500 text-xs">Page {field.page}</p>
          </div>
        )
      case 'CHECKBOX':
        return (
          <div key={field.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={signatures[field.id] === 'true'}
              onChange={(e) => setSignatures({ ...signatures, [field.id]: e.target.checked ? 'true' : 'false' })}
              className="w-5 h-5 accent-accent-600"
            />
            <label className="text-gray-300 text-sm">I agree (Page {field.page})</label>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-base-950 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-gradient-to-br from-accent-500 to-accent-700 p-1.5 rounded-lg">
            <FileSignature className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">SignFlow</span>
        </div>

        <div className="bg-base-900 rounded-2xl p-6 border border-base-700">
          <h1 className="text-2xl font-bold text-white mb-1">{data.document.title}</h1>
          <p className="text-gray-400 text-sm">
            Hi <span className="text-white font-medium">{data.signer.name}</span>, you've been asked to sign this document.
          </p>
        </div>

        <div className="bg-base-900 rounded-2xl p-6 border border-base-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">Required Fields</h2>
          {data.fields.length === 0 ? (
            <p className="text-gray-400 text-sm">No fields assigned to you.</p>
          ) : (
            <div className="space-y-4">
              {data.fields.map((field) => renderField(field))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSign}
            disabled={submitting}
            className="flex-1 bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Signing...' : 'Sign Document'}
          </button>
          <button
            onClick={() => setShowDecline(!showDecline)}
            className="bg-base-800 hover:bg-base-700 border border-base-600 text-gray-400 hover:text-red-400 px-4 py-3 rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {showDecline && (
          <div className="bg-base-900 rounded-2xl p-6 border border-red-500/20 space-y-3">
            <h3 className="text-white font-medium">Decline to Sign</h3>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full bg-base-800 border border-base-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
              placeholder="Reason for declining (optional)"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={handleDecline} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                Confirm Decline
              </button>
              <button onClick={() => setShowDecline(false)} className="bg-base-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sign