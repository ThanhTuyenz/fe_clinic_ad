import React, { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: string
  description?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: ReactNode
  footer?: ReactNode
  loading?: boolean
}

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  eyebrow,
  description,
  maxWidth = 'lg',
  children,
  footer,
  loading = false,
}: AdminModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className={`my-6 w-full ${MAX_WIDTH_CLASSES[maxWidth]} rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            {eyebrow && (
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {eyebrow}
              </p>
            )}
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3.5 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
