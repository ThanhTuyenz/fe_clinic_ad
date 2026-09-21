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
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
