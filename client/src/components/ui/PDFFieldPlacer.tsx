import React, { useState, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import type { Signer } from '../../types'
import { Trash2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
}
const FIELD_TYPES = ['SIGNATURE', 'INITIALS', 'DATE', 'TEXT', 'CHECKBOX'] as const
type FieldType = typeof FIELD_TYPES[number]

const fieldColors: Record<FieldType, string> = {
  SIGNATURE: 'border-accent-500 bg-accent-500/20 text-accent-300',
  INITIALS: 'border-blue-500 bg-blue-500/20 text-blue-300',
  DATE: 'border-green-500 bg-green-500/20 text-green-300',
  TEXT: 'border-yellow-500 bg-yellow-500/20 text-yellow-300',
  CHECKBOX: 'border-pink-500 bg-pink-500/20 text-pink-300',
}

interface PlacedField {
  id: string
  signerId: string
  type: FieldType
  page: number
  x: number
  y: number
  width: number
  height: number
}

interface PDFFieldPlacerProps {
  pdfUrl: string
  signers: Signer[]
  onSave: (fields: Omit<PlacedField, 'id'>[]) => void
  saving?: boolean
}

const PDFFieldPlacer = ({ pdfUrl, signers, onSave, saving }: PDFFieldPlacerProps) => {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.2)
  const [fields, setFields] = useState<PlacedField[]>([])
  const [selectedType, setSelectedType] = useState<FieldType>('SIGNATURE')
  const [selectedSigner, setSelectedSigner] = useState(signers[0]?.id || '')
  const pageRef = useRef<HTMLDivElement>(null)

  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current) return
    const rect = pageRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    if (!selectedSigner) return

    const newField: PlacedField = {
      id: `field-${Date.now()}`,
      signerId: selectedSigner,
      type: selectedType,
      page: currentPage,
      x: Math.round(x),
      y: Math.round(y),
      width: selectedType === 'CHECKBOX' ? 20 : 200,
      height: selectedType === 'CHECKBOX' ? 20 : selectedType === 'SIGNATURE' ? 60 : 40,
    }

    setFields((prev) => [...prev, newField])
  }, [selectedSigner, selectedType, currentPage, scale])

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSave = () => {
    const toSave = fields.map(({ id, ...rest }) => rest)
    onSave(toSave)
  }

  const getSignerName = (signerId: string) => {
    return signers.find((s) => s.id === signerId)?.name || 'Unknown'
  }

  const pageFields = fields.filter((f) => f.page === currentPage)

  return (
    <div className="space-y-4">
      <div className="bg-base-800 rounded-xl p-4 border border-base-600">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Signer</label>
            <select
              value={selectedSigner}
              onChange={(e) => setSelectedSigner(e.target.value)}
              className="bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-500"
            >
              {signers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Field Type</label>
            <div className="flex gap-1.5">
              {FIELD_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    selectedType === type
                      ? fieldColors[type]
                      : 'border-base-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setScale((s) => Math.max(0.6, s - 0.2))} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-base-700 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-gray-400 text-xs">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2, s + 0.2))} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-base-700 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-gray-500 text-xs mt-3">
          👆 Click anywhere on the PDF to place a <span className={`font-mono text-xs px-1 rounded ${fieldColors[selectedType]}`}>{selectedType}</span> field for <span className="text-white">{getSignerName(selectedSigner)}</span>
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 overflow-auto">
          <div className="relative inline-block">
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="border border-base-700 rounded-xl overflow-hidden"
            >
              <div ref={pageRef} className="relative cursor-crosshair" onClick={handlePageClick}>
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
                {pageFields.map((field) => (
                  <div
                    key={field.id}
                    className={`absolute border-2 rounded flex items-center justify-center text-xs font-mono ${fieldColors[field.type]}`}
                    style={{
                      left: field.x * scale,
                      top: field.y * scale,
                      width: field.width * scale,
                      height: field.height * scale,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="truncate px-1">{field.type}</span>
                    <button
                      onClick={() => removeField(field.id)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </Document>
          </div>

          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-400 text-sm">Page {currentPage} of {numPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage === numPages}
                className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {fields.length > 0 && (
          <div className="w-56 flex-shrink-0">
            <h3 className="text-white text-sm font-medium mb-2">Placed Fields ({fields.length})</h3>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {fields.map((field) => (
                <div key={field.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${fieldColors[field.type]}`}>
                  <div>
                    <p className="font-mono font-medium">{field.type}</p>
                    <p className="opacity-70">p{field.page} • {getSignerName(field.signerId)}</p>
                  </div>
                  <button onClick={() => removeField(field.id)} className="hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || fields.length === 0}
              className="w-full mt-3 bg-accent-600 hover:bg-accent-700 text-white text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : `Save ${fields.length} Field${fields.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PDFFieldPlacer