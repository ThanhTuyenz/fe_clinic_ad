import React, { useMemo } from 'react'
import { DonutChart, Sparkline, KpiMetricCard } from './Charts'

interface RevenueSourceItem {
  id: string
  name: string
  category: string
  revNum: number
  rev: string
  appts: number
  avgTicket: string
  pct: number
  color: string
  growth: string
}

interface AnalyticsRevenueSourcesTabProps {
  revenueSources: RevenueSourceItem[]
}

export default function AnalyticsRevenueSourcesTab({ revenueSources }: AnalyticsRevenueSourcesTabProps) {
  // Tỷ trọng vĩ mô Chuyên khoa & Gói khám
  const pkgRev = useMemo(
    () =>
      revenueSources
        .filter((s) => s.category?.includes('Gói') || s.name?.includes('Gói'))
        .reduce((sum, s) => sum + (s.revNum || 0), 0),
    [revenueSources],
  )
  const specRev = useMemo(
    () =>
      revenueSources
        .filter((s) => !s.category?.includes('Gói') && !s.name?.includes('Gói'))
        .reduce((sum, s) => sum + (s.revNum || 0), 0),
    [revenueSources],
  )
  const pkgAppts = useMemo(
    () =>
      revenueSources
        .filter((s) => s.category?.includes('Gói') || s.name?.includes('Gói'))
        .reduce((sum, s) => sum + (s.appts || 0), 0),
    [revenueSources],
  )
  const specAppts = useMemo(
    () =>
      revenueSources
        .filter((s) => !s.category?.includes('Gói') && !s.name?.includes('Gói'))
        .reduce((sum, s) => sum + (s.appts || 0), 0),
    [revenueSources],
  )
  const totalRevSources = pkgRev + specRev
  const totalAppts = pkgAppts + specAppts
  const pkgPct = totalRevSources > 0 ? Math.round((pkgRev / totalRevSources) * 100) : 0
  const specPct = totalRevSources > 0 ? 100 - pkgPct : 0

  // Segments cho Donut Chart
  const donutSegments = useMemo(() => {
    if (!revenueSources.length) return []
    // Lấy top 4 nguồn thu lớn nhất + nhóm các nguồn còn lại thành Khác
    const sorted = [...revenueSources].sort((a, b) => (b.revNum || 0) - (a.revNum || 0))
    const top4 = sorted.slice(0, 4)
    const rest = sorted.slice(4)
    const restRev = rest.reduce((acc, s) => acc + (s.revNum || 0), 0)

    const segs = top4.map((s) => ({
      label: s.name,
      value: s.revNum || 0,
      color: s.color || '#047857',
      subLabel: `${s.rev}`,
    }))

    if (restRev > 0) {
      segs.push({
        label: 'Các khoa & dịch vụ khác',
        value: restRev,
        color: '#94a3b8',
        subLabel: `${restRev.toFixed(1)} tr`,
      })
    }
    return segs
  }, [revenueSources])

  return (
    <div className="space-y-4">
      {/* 2 Thẻ tổng quát so sánh Gói khám vs Chuyên khoa */}
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiMetricCard
          label="Khám Gói sức khỏe định kỳ"
          value={`${Math.round(pkgRev * 1_000_000).toLocaleString('vi-VN')} đ`}
          badge={`Chiếm ${pkgPct}%`}
          detail={`${pkgAppts} lượt khám ${pkgAppts > 0 ? `· TB ${Math.round((pkgRev * 1_000_000) / pkgAppts).toLocaleString('vi-VN')} đ/gói` : ''}`}
          tone="emerald"
          sparklineData={[15, 18, 22, 28, 35, 42, 50]}
        />
        <KpiMetricCard
          label="Khám lẻ theo Chuyên khoa"
          value={`${Math.round(specRev * 1_000_000).toLocaleString('vi-VN')} đ`}
          badge={`Chiếm ${specPct}%`}
          detail={`${specAppts} lượt khám ${specAppts > 0 ? `· TB ${Math.round((specRev * 1_000_000) / specAppts).toLocaleString('vi-VN')} đ/lượt` : ''}`}
          tone="blue"
          sparklineData={[20, 25, 22, 30, 28, 35, 38]}
        />
      </div>

      {/* Sơ đồ Phân bổ Trực quan: Chia 2 nửa (Horizontal Bar Chart + Donut Chart tỷ trọng) */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Phân tích Cơ cấu Nguồn thu: Chuyên khoa & Gói khám</h3>
            <p className="text-xs text-slate-400 mt-0.5">Xếp hạng chi tiết từng nguồn thu và tương quan tỷ trọng vĩ mô</p>
          </div>
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            Tổng doanh thu: {Math.round(totalRevSources * 1_000_000).toLocaleString('vi-VN')} đ
          </span>
        </div>

        {revenueSources.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Chưa có dữ liệu nguồn thu trong kỳ được chọn.</div>
        ) : (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Nửa bên trái (lg:col-span-7): Biểu đồ Cột Ngang (Horizontal Bar Chart) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tỷ trọng Doanh thu các Nguồn
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">Theo doanh thu thực thu</span>
              </div>

              <div className="space-y-2.5 pt-1">
                {revenueSources.map((s, idx) => (
                  <div key={s.id || idx} className="rounded border border-slate-200/70 bg-slate-50/40 p-2.5 space-y-1.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({s.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">{s.rev}</span>
                        <span className="rounded bg-white border border-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                          {s.pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, s.pct * 2.7)}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nửa bên phải (lg:col-span-5): Donut Chart phân bổ tỷ trọng theo mẫu Spend Allocation */}
            <div className="lg:col-span-5 rounded border border-slate-200/80 bg-slate-50/60 p-4 flex flex-col items-center shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                Biểu đồ Phân bổ Nguồn thu
              </h4>

              <DonutChart
                segments={donutSegments}
                size={160}
                thickness={26}
                centerLabel="Quy mô"
                centerValue={`${totalRevSources.toFixed(1)} tr`}
                centerSub="Toàn viện"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bảng Xếp hạng & Chi tiết Đóng góp từng Khoa / Gói khám */}
      <div className="rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Bảng chi tiết Doanh thu theo Chuyên khoa & Gói khám</h3>
          <p className="text-xs text-slate-400 mt-0.5">Xếp hạng theo tổng thu thực tế, số ca khám và giá trị trung bình</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Hạng</th>
                <th className="py-3 px-4">Tên Chuyên khoa / Gói khám</th>
                <th className="py-3 px-4">Phân loại</th>
                <th className="py-3 px-4 text-center">Lượt khám</th>
                <th className="py-3 px-4 text-right">Giá trị TB/ca</th>
                <th className="py-3 px-4 text-right">Tổng doanh thu</th>
                <th className="py-3 px-4 text-center">Tỷ trọng</th>
                <th className="py-3 px-4 text-right">Tăng trưởng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {revenueSources.map((s, idx) => (
                <tr key={s.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${s.category === 'Gói khám bệnh' || s.category?.includes('Gói')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                    {s.appts} ca
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                    {s.avgTicket}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                    {s.rev}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold text-slate-800">
                    {s.pct}%
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-700 font-medium whitespace-nowrap">
                    {s.growth}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* DÒNG TỔNG CỘNG (TOTAL ROW) */}
            {revenueSources.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-bold uppercase text-[10px]">Total</td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">Tổng toàn viện</td>
                  <td className="py-3.5 px-4 text-slate-500 font-semibold">{revenueSources.length} nguồn thu</td>
                  <td className="py-3.5 px-4 text-center text-slate-900 font-bold">{totalAppts} ca</td>
                  <td className="py-3.5 px-4 text-right text-slate-600">
                    {totalAppts > 0 ? `${Math.round((totalRevSources * 1_000_000) / totalAppts).toLocaleString('vi-VN')} đ` : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-800 font-bold text-sm">
                    {Math.round(totalRevSources * 1_000_000).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-900 font-bold">100%</td>
                  <td className="py-3.5 px-4 text-right text-emerald-700 font-bold">+100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
