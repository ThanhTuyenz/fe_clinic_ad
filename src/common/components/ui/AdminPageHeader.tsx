import React, { ReactNode } from 'react'

export interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  children,
  className = '',
}: AdminPageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b border-slate-200/80 pb-4 ${className}`}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-0.5 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

