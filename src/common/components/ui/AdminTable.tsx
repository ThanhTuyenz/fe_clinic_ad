import React, { ReactNode, TableHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

export interface AdminTableCardProps {
  children: ReactNode
  className?: string
}

export function AdminTableCard({ children, className = '' }: AdminTableCardProps) {
  return (
    <section className={`rounded border border-slate-200/90 bg-white shadow-xs overflow-hidden ${className}`}>
      {children}
    </section>
  )
}

export interface AdminTableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode
  className?: string
  minWidth?: string
}

export function AdminTable({ children, className = '', minWidth = 'min-w-[650px]', ...props }: AdminTableProps) {
  return (
    <div className="w-full overflow-x-auto [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
      <table className={`w-full text-left text-xs sm:text-sm ${minWidth} ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

export interface AdminTableHeadProps {
  columns: (string | { label: string; align?: 'left' | 'center' | 'right'; width?: string })[]
  className?: string
}

export function AdminTableHead({ columns, className = '' }: AdminTableHeadProps) {
  return (
    <thead className={`bg-slate-50 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 select-none ${className}`}>
      <tr>
        {columns.map((col, idx) => {
          const isObj = typeof col === 'object'
          const label = isObj ? col.label : col
          const align = isObj && col.align ? `text-${col.align}` : ''
          const width = isObj && col.width ? col.width : ''
          return (
            <th key={idx} className={`px-3.5 sm:px-5 py-2.5 sm:py-3.5 ${align} ${width}`}>
              {label}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}

export function AdminTableLoading({ colSpan, message = 'Đang tải dữ liệu…' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
        <span className="text-xs font-medium">{message}</span>
      </td>
    </tr>
  )
}

export function AdminTableEmpty({
  colSpan,
  message = 'Không có dữ liệu phù hợp.',
  icon: Icon,
}: {
  colSpan: number
  message?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-slate-400">
        {Icon && <Icon className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />}
        <p className="text-xs font-medium">{message}</p>
      </td>
    </tr>
  )
}

export function AdminTableFooter({
  total,
  label = 'kết quả',
  children,
  className = '',
}: {
  total?: number
  label?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <footer className={`border-t border-slate-100 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white ${className}`}>
      <div>
        {total !== undefined && (
          <span>
            Tổng cộng <strong className="font-semibold text-slate-700">{total}</strong> {label}
          </span>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </footer>
  )
}
