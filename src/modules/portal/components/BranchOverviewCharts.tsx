'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DonutChart, SectionCard } from '@/modules/analytics'

export default function BranchOverviewCharts({ stats, loading, onViewAll }: {
  stats: any; loading: boolean; onViewAll: () => void
}) {
  const today = stats?.appointments?.today || {}
  const segments = [
    { label: 'Chờ thanh toán', value: today.hold ?? today.pending ?? 0, color: '#f59e0b' },
    { label: 'Đã xác nhận', value: Math.max(0, (today.confirmed ?? 0) - (today.checkedIn ?? 0)), color: '#6366f1' },
    { label: 'Đã tiếp nhận', value: today.checkedIn ?? 0, color: '#0284c7' },
    { label: 'Đang khám / tư vấn', value: today.inExamination ?? 0, color: '#a855f7' },
    { label: 'Hoàn thành', value: today.examined ?? 0, color: '#059669' },
    { label: 'Đã hủy', value: today.cancelled ?? 0, color: '#f43f5e' },
    { label: 'Không đến', value: today.noShow ?? 0, color: '#94a3b8' },
  ]
  const hours = stats?.appointmentHoursToday || []
  const occupiedHours = hours.map((item: any, index: number) => item.count > 0 ? index : -1).filter((index: number) => index >= 0)
  const firstHour = Math.min(7, ...occupiedHours)
  const lastHour = Math.max(20, ...occupiedHours)
  const chartData = hours.slice(firstHour, lastHour + 1)
  const viewAll = <button type="button" onClick={onViewAll} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Xem tất cả →</button>

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      <SectionCard title="Trạng thái lịch hẹn hôm nay" action={viewAll}>
        {loading ? <p className="flex h-64 items-center justify-center text-sm text-slate-400">Đang tải biểu đồ…</p> : (
          <div className="flex min-h-72 items-center justify-center">
            <DonutChart segments={segments} size={130} thickness={22} layout="horizontal" centerLabel="Lịch hẹn" centerValue={String(today.total ?? 0)} />
          </div>
        )}
      </SectionCard>
      <SectionCard title="Lịch hẹn theo giờ" subtitle="Số lịch theo giờ bắt đầu khám, bao gồm tất cả trạng thái">
        {loading ? <p className="flex h-64 items-center justify-center text-sm text-slate-400">Đang tải biểu đồ…</p>
          : !chartData.some((item: any) => item.count > 0) ? <p className="flex h-64 items-center justify-center text-sm text-slate-400">Chưa có lịch hẹn hôm nay.</p>
          : <div className="h-72 min-w-0" role="img" aria-label={`Phân bố ${today.total ?? 0} lịch hẹn hôm nay theo giờ`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} lịch hẹn`, 'Số lượng']} labelFormatter={(label) => `Khung giờ ${label}`} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>}
      </SectionCard>
    </div>
  )
}
