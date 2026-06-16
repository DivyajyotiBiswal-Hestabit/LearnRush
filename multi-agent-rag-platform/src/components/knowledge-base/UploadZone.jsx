'use client'

import { useState, useRef } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

const STATUS_ICONS = {
  pending: <Loader className="w-4 h-4 text-gray-400 animate-spin" />,
  uploading: <Loader className="w-4 h-4 text-indigo-500 animate-spin" />,
  processing: <Loader className="w-4 h-4 text-yellow-500 animate-spin" />,
  ready: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
}

const STATUS_LABELS = {
  pending: 'Queued',
  uploading: 'Uploading...',
  processing: 'Embedding...',
  ready: 'Ready',
  failed: 'Failed',
}

export function UploadZone({ knowledgeBaseId, onUploadComplete }) {
  const [dragging, setDragging] = useState(false)
  const [uploads, setUploads] = useState([])
  const inputRef = useRef(null)

  function updateUpload(id, updates) {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }

  async function processFile(file) {
    const id = `${Date.now()}-${Math.random()}`

    // Add to upload list
    setUploads(prev => [...prev, {
      id,
      name: file.name,
      size: file.size,
      status: 'uploading',
      error: null,
    }])

    try {
      // Step 1: Upload file to storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('knowledgeBaseId', knowledgeBaseId)

      const uploadRes = await fetch('/api/knowledge-base/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        updateUpload(id, { status: 'failed', error: uploadData.error })
        return
      }

      const documentId = uploadData.document.id
      updateUpload(id, { status: 'processing', documentId })

      // Step 2: Trigger processing (chunking + embedding)
      const processRes = await fetch('/api/knowledge-base/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, knowledgeBaseId }),
      })

      const processData = await processRes.json()

      if (!processRes.ok) {
        updateUpload(id, { status: 'failed', error: processData.error })
        return
      }

      updateUpload(id, {
        status: 'ready',
        chunksCreated: processData.chunksCreated,
      })

      if (onUploadComplete) onUploadComplete()
    } catch (err) {
      updateUpload(id, { status: 'failed', error: err.message })
    }
  }

  function handleFiles(files) {
    const allowed = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp']
    const validFiles = Array.from(files).filter(f => allowed.includes(f.type))

    if (validFiles.length === 0) {
      alert('Please upload PDF, TXT, or image files only.')
      return
    }

    validFiles.forEach(processFile)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <Upload className={cn(
          'w-8 h-8 mx-auto mb-3',
          dragging ? 'text-indigo-500' : 'text-gray-400'
        )} />
        <p className="text-sm font-medium text-gray-700">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PDF, TXT, PNG, JPG, WEBP — max 20MB each
        </p>
      </div>

      {/* Upload Progress List */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploads.map(upload => (
            <div
              key={upload.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {upload.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatSize(upload.size)}
                  {upload.chunksCreated && ` · ${upload.chunksCreated} chunks`}
                </p>
                {upload.error && (
                  <p className="text-xs text-red-500 mt-0.5">{upload.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {STATUS_LABELS[upload.status]}
                </span>
                {STATUS_ICONS[upload.status]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}