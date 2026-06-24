import  { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { documentAPI } from '../services/api'
import type { Document } from '../types'
import { FileText, FilePlus,  ArrowRight } from 'lucide-react'

const statusColor: Record<string, string> = {
  DRAFT: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  PENDING: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  COMPLETED: 'text-green-400 bg-green-400/10 border-green-400/20',
  CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/20',
}



const Dashboard = () => {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    documentAPI.getAll()
      .then((res) => setDocuments(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: documents.length,
    pending: documents.filter((d) => d.status === 'PENDING').length,
    completed: documents.filter((d) => d.status === 'COMPLETED').length,
    draft: documents.filter((d) => d.status === 'DRAFT').length,
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
          
        </div>
        <Link
          to="/documents/upload"
          className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          New Document
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-accent-400', bg: 'bg-accent-600/10' },
          { label: 'Draft', value: stats.draft, color: 'text-gray-400', bg: 'bg-gray-400/10' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Completed', value: stats.completed, color: 'text-green-400', bg: 'bg-green-400/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-base-900 rounded-2xl p-5 border border-base-700">
            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-base-900 rounded-2xl border border-base-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-700">
          <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
          <Link to="/documents" className="text-accent-400 text-sm hover:text-accent-300 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-accent-400">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No documents yet</p>
            <Link to="/documents/upload" className="text-accent-400 hover:text-accent-300 text-sm font-medium">
              Upload your first document →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-base-700">
            {documents.slice(0, 8).map((doc) => {
             
              return (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-base-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-base-800 p-2 rounded-lg border border-base-600">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{doc.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {doc.signers?.length || 0} signer{(doc.signers?.length || 0) !== 1 ? 's' : ''} •{' '}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${statusColor[doc.status]}`}>
                    {doc.status}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard