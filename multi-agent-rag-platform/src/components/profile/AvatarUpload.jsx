'use client'

import { useState, useRef } from 'react'
import { Camera, Loader } from 'lucide-react'
import { toast } from 'sonner'

export function AvatarUpload({ currentUrl, userName, onUpload }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(currentUrl)
  const inputRef = useRef(null)

  const initials = userName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Upload failed')
        setPreview(currentUrl)
        return
      }

      setPreview(data.avatarUrl)
      onUpload?.(data.avatarUrl)
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error('Upload failed')
      setPreview(currentUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative group w-fit">
      {/* Avatar display */}
      <div
        className="w-20 h-20 rounded-full overflow-hidden cursor-pointer border-4 border-white shadow-md relative"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xl font-bold text-indigo-700">{initials}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {loading
            ? <Loader className="w-5 h-5 text-white animate-spin" />
            : <Camera className="w-5 h-5 text-white" />
          }
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />

      <p className="text-xs text-gray-400 mt-2 text-center">Click to change</p>
    </div>
  )
}