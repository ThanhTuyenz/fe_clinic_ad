'use client'

import { useRef, useState, useId } from 'react'
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { resolveMediaUrl, uploadMediaFile } from '../services/media'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  aspectRatio?: 'square' | 'wide'
  className?: string
  disabled?: boolean
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Hình ảnh',
  placeholder = 'Kéo thả hoặc nhấp để chọn ảnh (JPG, PNG, WebP)',
  aspectRatio = 'square',
  className = '',
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()

  const handleFile = async (file: File) => {
    if (!file) return
    if (!file.type.match(/^image\//i)) {
      setError('Vui lòng chọn tệp hình ảnh (.jpg, .png, .webp, .svg)!')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng hình ảnh không được vượt quá 5MB!')
      return
    }

    setError('')
    setUploading(true)
    try {
      const res = await uploadMediaFile(file)
      if (res?.url) {
        onChange(res.url)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Tải ảnh lên thất bại.')
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled || uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const previewUrl = resolveMediaUrl(value)

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-semibold text-slate-700">{label}</label>}

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`relative group border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center p-3 text-center overflow-hidden ${
          value ? 'border-slate-300 bg-slate-50' : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20'
        } ${aspectRatio === 'wide' ? 'min-h-[140px]' : 'min-h-[130px]'}`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
          onChange={onInputChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            <p className="text-xs text-slate-600 font-medium">Đang tải ảnh lên...</p>
          </div>
        ) : previewUrl ? (
          <div className="relative w-full flex items-center justify-center group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className={`object-cover rounded-lg shadow-xs max-h-40 ${
                aspectRatio === 'square' ? 'w-28 h-28' : 'w-full h-32'
              }`}
            />
            <div className="absolute inset-0 bg-slate-900/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 text-xs font-medium rounded-md shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Thay đổi
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-md shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">{placeholder}</p>
            <p className="text-[11px] text-slate-600">Định dạng JPG, PNG, WebP (Tối đa 5MB)</p>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  )
}
