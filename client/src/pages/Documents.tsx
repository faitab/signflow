import  { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { documentAPI } from '../services/api'
import type { Document } from '../types'
import { FileText, FilePlus, Trash2, Send, Eye } from 'lucide-react'

const statusColor: Record<string, string> = {
  DRAFT: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  COMPLETED: 'text-green-400 bg-green-400/10 border-green-400/20',
  CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await documentAPI.getAll()
      setDocuments(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try {
      await documentAPI.delete(id)
      fetchDocuments()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleSend = async (id: string) => {
    try {
      await documentAPI.send(id)
      fetchDocuments()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          
        </div>
        <Link
          to="/documents/upload"
          className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          Upload Document
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-base-900 rounded-2xl border border-base-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-base-700">
              <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Document</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Signers</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Status</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Created</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-accent-400">Loading...</td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No documents yet</p>
                  <Link to="/documents/upload" className="text-accent-400 text-sm mt-2 inline-block hover:text-accent-300">
                    Upload your first document →
                  </Link>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b border-base-700/50 hover:bg-base-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-base-800 p-1.5 rounded-lg border border-base-600">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-white text-sm font-medium">{doc.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {doc.signers?.length || 0} signer{(doc.signers?.length || 0) !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${statusColor[doc.status]}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="text-gray-400 hover:text-accent-400 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {doc.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleSend(doc.id)}
                            className="text-gray-400 hover:text-green-400 transition-colors"
                            title="Send for signing"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Documents