import React, { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: string
  description?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
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
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
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
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      onClick={() => {
        if (!loading) onClose()
      }}
    >
      <div
        className={`my-auto w-full ${MAX_WIDTH_CLASSES[maxWidth]} rounded bg-white shadow-2xl overflow-hidden border border-slate-100 transition-all flex flex-col max-h-[92vh] sm:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-3.5 shrink-0">
          <div className="min-w-0 pr-2 flex-1">
            {eyebrow && (
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
                {eyebrow}
              </p>
            )}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer disabled:opacity-40 shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-5 md:px-6 md:py-5 overflow-y-auto flex-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-50/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
