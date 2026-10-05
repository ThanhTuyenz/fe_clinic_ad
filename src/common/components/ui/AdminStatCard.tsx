import React, { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

export interface AdminStatCardProps {
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate'
  icon?: LucideIcon
  loading?: boolean
  className?: string
}

const TONE_VALUE_CLASSES = {
  emerald: 'text-emerald-700',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  blue: 'text-blue-700',
  slate: 'text-slate-900',
}

const TONE_ICON_CLASSES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
}

export function AdminStatCard({
  label,
  value,
  detail,
  tone = 'slate',
  icon: Icon,
  loading = false,
  className = '',
}: AdminStatCardProps) {
  return (
    <div className={`rounded border border-slate-200 bg-white p-4 shadow-xs flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
        <p className={`mt-1 text-2xl font-bold tracking-tight ${TONE_VALUE_CLASSES[tone]}`}>
          {loading ? '—' : value}
        </p>
        {detail && (
          <p className="mt-1 text-xs text-slate-400 font-normal">
            {detail}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded border shrink-0 ${TONE_ICON_CLASSES[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  )
}
