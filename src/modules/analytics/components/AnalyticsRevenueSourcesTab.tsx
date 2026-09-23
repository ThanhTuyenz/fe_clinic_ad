'use client'

import React, { useMemo } from 'react'

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
  const pkgPct = totalRevSources > 0 ? Math.round((pkgRev / totalRevSources) * 100) : 0
  const specPct = totalRevSources > 0 ? 100 - pkgPct : 0

  return (
    <div className="space-y-4">
      {/* 2 Thẻ tổng quát so sánh Gói khám vs Chuyên khoa */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Khám Gói sức khỏe định kỳ</span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
              Chiếm {pkgPct}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {Math.round(pkgRev * 1_000_000).toLocaleString('vi-VN')} đ
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {pkgAppts} lượt khám {pkgAppts > 0 ? `· Doanh thu TB ${Math.round((pkgRev * 1_000_000) / pkgAppts).toLocaleString('vi-VN')} đ/gói` : ''}
          </p>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Khám lẻ theo Chuyên khoa</span>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
              Chiếm {specPct}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {Math.round(specRev * 1_000_000).toLocaleString('vi-VN')} đ
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {specAppts} lượt khám {specAppts > 0 ? `· Trung bình ${Math.round((specRev * 1_000_000) / specAppts).toLocaleString('vi-VN')} đ/lượt` : ''}
          </p>
        </div>
      </div>

      {/* Sơ đồ Phân bổ Trực quan: Chia 2 nửa (Horizontal Bar Chart + Donut Chart mini vĩ mô) */}
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
                  Xếp hạng Tỷ trọng Doanh thu (Horizontal Bar Chart)
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

            {/* Nửa bên phải (lg:col-span-5): Donut Chart mini vĩ mô */}
            <div className="lg:col-span-5 rounded border border-slate-200/80 bg-slate-50/60 p-4 flex flex-col items-center shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                Tỷ trọng Vĩ mô 2 Mảng lớn (Donut Chart)
              </h4>

              <div
                className="relative grid place-items-center rounded-full shadow-2xs"
                style={{
                  width: '144px',
                  height: '144px',
                  background: `conic-gradient(#047857 0% ${pkgPct}%, #2563eb ${pkgPct}% 100%)`,
                }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Quy mô</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{totalRevSources.toFixed(1)} tr</p>
                    <span className="text-[9px] text-slate-500 block">Toàn viện</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full space-y-2">
                <div className="flex items-center justify-between rounded bg-white p-2.5 border border-emerald-200 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#047857]" />
                    <div>
                      <p className="font-bold text-slate-900">Khám Gói định kỳ</p>
                      <p className="text-[10px] text-slate-400">{pkgAppts} lượt khám</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <b className="text-sm text-emerald-800">{pkgPct}%</b>
                    <p className="text-[10px] font-bold text-slate-600">{pkgRev.toFixed(1)} tr</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded bg-white p-2.5 border border-blue-200 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
                    <div>
                      <p className="font-bold text-slate-900">Khám lẻ Chuyên khoa</p>
                      <p className="text-[10px] text-slate-400">{specAppts} lượt khám</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <b className="text-sm text-blue-800">{specPct}%</b>
                    <p className="text-[10px] font-bold text-slate-600">{specRev.toFixed(1)} tr</p>
                  </div>
                </div>
              </div>
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
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        s.category === 'Gói khám bệnh' || s.category?.includes('Gói')
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
          </table>
        </div>
      </div>
    </div>
  )
}
