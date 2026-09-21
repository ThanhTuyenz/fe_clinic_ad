import React, { ReactNode } from 'react'

export type StatusTone = 'emerald' | 'amber' | 'rose' | 'blue' | 'slate'

export interface StatusBadgeProps {
  tone?: StatusTone
  status?: string
  children?: ReactNode
  className?: string
}

const TONE_CLASSES: Record<StatusTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
}

const AUTO_TONE_MAP: Record<string, StatusTone> = {
  // Positive
  active: 'emerald',
  paid: 'emerald',
  examined: 'emerald',
  completed: 'emerald',
  confirmed: 'emerald',
  success: 'emerald',
  enabled: 'emerald',
  // Pending / Warning
  pending: 'amber',
  unpaid: 'amber',
  waiting: 'amber',
  in_progress: 'amber',
  // Danger / Negative
  blocked: 'rose',
  cancelled: 'rose',
  danger: 'rose',
  failed: 'rose',
  disabled: 'rose',
  // Info
  calling: 'blue',
  checked_in: 'blue',
  processing: 'blue',
}

export function StatusBadge({
  tone,
  status,
  children,
  className = '',
}: StatusBadgeProps) {
  const resolvedTone: StatusTone =
    tone || (status ? AUTO_TONE_MAP[status.toLowerCase()] : 'slate') || 'slate'

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${TONE_CLASSES[resolvedTone]} ${className}`}
    >
      {children || status}
    </span>
  )
}
