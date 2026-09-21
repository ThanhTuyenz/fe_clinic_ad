import React, { TextareaHTMLAttributes } from 'react'

export interface AdminTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
}

export function AdminTextarea({
  label,
  error,
  helperText,
  required,
  rows = 2,
  className = '',
  containerClassName = '',
  id,
  ...props
}: AdminTextareaProps) {
  const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '_') : undefined)

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={areaId} className="block text-xs font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        required={required}
        className={`w-full p-2.5 text-xs rounded-lg border bg-white transition-colors focus:outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-400 ${
          error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-[11px] text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-[11px] text-slate-400">{helperText}</p>}
    </div>
  )
}
