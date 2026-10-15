'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchBranchComparison } from '@/modules/admin/services/stats'

interface BranchComparison {
  id: string; code: string; name: string; isActive: boolean
  revenue: number; appointments: number; completed: number; paidInvoices: number
  completionRate: number | null; cancellationRate: number | null; noShowRate: number | null
  occupancyRate: number | null; averageRevenue: number | null
}
const money = (value: number | null) => value == null ? '—' : `${value.toLocaleString('vi-VN')} đ`
const rate = (value: number | null) => value == null ? '—' : `${value.toLocaleString('vi-VN')}%`

export default function AnalyticsBranchComparisonTab({ timeFilter, startDate, endDate }: {
  timeFilter: string; startDate: string; endDate: string
}) {
  const [data, setData] = useState<{ from: string; to: string; branches: BranchComparison[] } | null>(null)
  const [selected, setSelected] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [metric, setMetric] = useState<'revenue' | 'appointments' | 'completionRate' | 'occupancyRate'>('revenue')
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    fetchBranchComparison({ timeFilter, startDate: startDate || undefined, endDate: endDate || undefined })
      .then(result => { if (!cancelled) setData(result) })
      .catch(cause => { if (!cancelled) setError(cause.message || 'Không tải được dữ liệu.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [timeFilter, startDate, endDate, refresh])
  const branches = data?.branches || []
  const rows = useMemo(() => branches.filter(branch => selected === null || selected.includes(branch.id))
    .sort((a, b) => (b[metric] ?? -1) - (a[metric] ?? -1)), [data, selected, metric])
  const toggleBranch = (id: string) => setSelected(current => {
    const ids = current ?? branches.map(branch => branch.id)
    return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]
  })
  const metrics = { revenue: 'Doanh thu', appointments: 'Lịch hẹn', completionRate: 'Tỷ lệ hoàn thành', occupancyRate: 'Sử dụng công suất' }
  const chartRows = rows.map(row => ({ ...row, value: row[metric] }))
  const dateLabel = (key: string) => key.split('-').reverse().join('/')
  return <div className="space-y-3">
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">So sánh chi nhánh</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{data ? `${dateLabel(data.from)} – ${dateLabel(data.to)}` : 'Cùng khoảng thời gian cho các chi nhánh'}</p>
        </div>
        <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-50">Làm mới</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Chi nhánh:</span>
        {branches.map(branch => <label key={branch.id} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700">
          <input type="checkbox" checked={selected === null || selected.includes(branch.id)} onChange={() => toggleBranch(branch.id)} className="accent-blue-600" />
          {branch.name}{!branch.isActive ? ' (ngừng hoạt động)' : ''}
        </label>)}
        {branches.length > 0 && <button type="button" onClick={() => setSelected(null)} className="text-[11px] text-blue-600">Chọn tất cả</button>}
      </div>
    </section>
    {error ? <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{error}</div>
      : loading ? <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">Đang tải dữ liệu so sánh…</div>
      : !rows.length ? <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">{branches.length ? 'Chọn ít nhất một chi nhánh để xem số liệu.' : 'Chưa có chi nhánh để so sánh.'}</div>
      : <>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-800">{metrics[metric]} theo chi nhánh</h3>
            <select aria-label="Chỉ số so sánh" value={metric} onChange={event => setMetric(event.target.value as typeof metric)} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600">
              {Object.entries(metrics).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div className="mt-3" style={{ height: Math.max(150, rows.length * 44 + 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartRows} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={metric !== 'appointments'} domain={metric.endsWith('Rate') ? [0, 100] : [0, 'auto']} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={value => metric === 'revenue' ? `${(value / 1000000).toLocaleString('vi-VN')}tr` : metric.endsWith('Rate') ? `${value}%` : String(value)} />
                <YAxis type="category" dataKey="code" width={88} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''} formatter={value => [metric === 'revenue' ? money(Number(value)) : metric.endsWith('Rate') ? rate(Number(value)) : `${value} lịch`, metrics[metric]]} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500"><tr>
                {['Chi nhánh', 'Doanh thu', 'Lịch hẹn', 'Hoàn thành', 'Tỷ lệ hoàn thành', 'Hủy', 'Không đến', 'Công suất', 'Thu TB/hóa đơn'].map(label => <th key={label} className="whitespace-nowrap px-3 py-2.5 font-medium">{label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 font-medium text-slate-800">{row.name}<div className="text-[10px] font-normal text-slate-400">{row.code}</div></td>
                {[money(row.revenue), row.appointments, row.completed, rate(row.completionRate), rate(row.cancellationRate), rate(row.noShowRate), rate(row.occupancyRate), money(row.averageRevenue)].map((value, index) => <td key={index} className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-600">{value}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-4 py-3 text-[11px] leading-5 text-slate-400">Lịch hẹn tính theo ngày khám. Doanh thu tính từ hóa đơn đã thanh toán trong kỳ (giờ Việt Nam). Tỷ lệ hoàn thành, hủy và không đến tính trên tổng lịch hẹn; công suất = chỗ đã đặt / tổng chỗ trong lịch làm việc đang mở. Thu trung bình tính trên hóa đơn đã thanh toán; “—” là chưa có mẫu số.</p>
        </section>
      </>}
  </div>
}
