'use client'

import { useRef, useState, useId } from 'react'
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { resolveMediaUrl, uploadMediaFile } from '@/modules/admin/services/media'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  aspectRatio?: 'square' | 'wide' | 'avatar' | 'icon'
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
      setError('Dung lượng ảnh tối đa là 5MB!')
      return
    }

    setUploading(true)
    setError('')
    try {
      const res = await uploadMediaFile(file)
      if (res?.url) {
        onChange(res.url)
      } else {
        throw new Error('Không nhận được URL từ máy chủ.')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Tải ảnh lên thất bại.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled || uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const fullUrl = resolveMediaUrl(value)

  return (
    <div className={label ? `space-y-1.5 ${className}` : className}>
      {label && <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">{label}</label>}

      {fullUrl ? (
        <div
          className={`relative overflow-hidden rounded border border-slate-200 bg-slate-50 group ${
            aspectRatio === 'icon'
              ? 'h-[30px] w-[30px] shrink-0'
              : aspectRatio === 'avatar'
              ? 'h-20 w-20'
              : aspectRatio === 'square'
              ? 'h-28 w-28'
              : 'h-28 w-full'
          }`}
        >
          <img
            src={fullUrl}
            alt="Preview"
            className={`h-full w-full ${aspectRatio === 'icon' ? 'object-contain p-1' : 'object-cover'} transition duration-200 group-hover:scale-105`}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              className="p-1 bg-white/90 hover:bg-white text-slate-700 rounded shadow-xs text-xs font-semibold flex items-center justify-center cursor-pointer"
              title="Thay đổi ảnh"
            >
              <Upload className="w-3 h-3" />
            </button>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => onChange('')}
              className="p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded shadow-xs text-xs font-semibold flex items-center justify-center cursor-pointer"
              title="Xóa ảnh"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`relative border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded transition flex flex-col items-center justify-center p-1.5 cursor-pointer text-center ${
            aspectRatio === 'icon'
              ? 'h-[30px] w-[30px] shrink-0'
              : aspectRatio === 'avatar'
              ? 'h-20 w-20'
              : aspectRatio === 'square'
              ? 'h-28 w-28'
              : 'h-28 w-full'
          }`}
          title={aspectRatio === 'icon' ? 'Tải icon lên' : undefined}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              {aspectRatio !== 'icon' && <span className="text-[10px] text-slate-500">Đang tải…</span>}
            </div>
          ) : aspectRatio === 'icon' ? (
            <div className="flex flex-col items-center justify-center text-slate-400 hover:text-emerald-700">
              <span className="text-sm font-bold leading-none text-slate-400">+</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 pointer-events-none">
              <div className="p-1.5 rounded-full bg-slate-100 text-slate-400">
                <ImageIcon className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-medium text-slate-600">
                <span className="text-emerald-700 font-semibold">{aspectRatio === 'avatar' ? 'Tải ảnh' : 'Tải ảnh lên'}</span>
              </p>
              {aspectRatio === 'wide' && (
                <p className="text-[10px] text-slate-400 max-w-[240px] leading-tight">
                  {placeholder}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  )
}
