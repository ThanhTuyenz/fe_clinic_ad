import React, { ButtonHTMLAttributes } from 'react'
import { Loader2, LucideIcon } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-700 text-white hover:bg-emerald-800 border-transparent shadow-xs',
  secondary: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 border-transparent shadow-xs',
  outline: 'bg-transparent text-emerald-700 border-emerald-300 hover:bg-emerald-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs font-semibold rounded-lg',
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'px-4 py-2 text-xs font-bold rounded-lg',
  lg: 'px-5 py-2.5 text-sm font-bold rounded-xl',
}

export function AdminButton({
  variant = 'primary',
  size = 'sm',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  disabled,
  children,
  className = '',
  ...props
}: AdminButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={props.type || 'button'}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-1.5 border transition-all cursor-pointer select-none
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}

      {children && <span>{children}</span>}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      )}
    </button>
  )
}

export interface AdminIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  title: string
  tone?: 'emerald' | 'rose' | 'blue' | 'amber' | 'slate'
  size?: 'sm' | 'md'
}

const TONE_CLASSES = {
  emerald: 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50',
  rose: 'text-slate-400 hover:text-rose-600 hover:bg-rose-50',
  blue: 'text-slate-400 hover:text-blue-700 hover:bg-blue-50',
  amber: 'text-slate-400 hover:text-amber-700 hover:bg-amber-50',
  slate: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
}

export function AdminIconButton({
  icon: Icon,
  title,
  tone = 'slate',
  size = 'md',
  disabled,
  className = '',
  ...props
}: AdminIconButtonProps) {
  const sz = size === 'sm' ? 'p-1' : 'p-1.5'
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className={`${sz} rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
