import React, { SelectHTMLAttributes, ReactNode } from 'react'

export interface AdminSelectOption {
  value: string | number
  label: string
}

export interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
  options?: AdminSelectOption[] | readonly (readonly [string, string])[]
  placeholder?: string
  children?: ReactNode
}

export function AdminSelect({
  label,
  error,
  helperText,
  required,
  options,
  placeholder,
  children,
  className = '',
  containerClassName = '',
  id,
  ...props
}: AdminSelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '_') : undefined)

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white transition-colors focus:outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-400 ${
          error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options
          ? options.map((opt) => {
              const val = Array.isArray(opt) ? opt[0] : opt.value
              const text = Array.isArray(opt) ? opt[1] : opt.label
              return (
                <option key={val} value={val}>
                  {text}
                </option>
              )
            })
          : children}
      </select>
      {error && <p className="mt-1 text-[11px] text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-[11px] text-slate-400">{helperText}</p>}
    </div>
  )
}
