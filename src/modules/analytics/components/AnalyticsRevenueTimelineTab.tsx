'use client'

import React from 'react'

interface AnalyticsRevenueTimelineTabProps {
  data: {
    revenue: string
    revenueGrowth: string
    dailyAvg: string
    avgPerPatient: string
    chartLabel: string
    guides: string[]
    bars: Array<{ label: string; rev: number; count: number }>
    chartCeiling: number
    payments: Array<{ name: string; pct: number; amount: string }>
  }
}

export default function AnalyticsRevenueTimelineTab({ data }: AnalyticsRevenueTimelineTabProps) {
  return (
    <div className="space-y-4">
      {/* 3 Thẻ chỉ số ngắn gọn, trắng sạch */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Tổng doanh thu kỳ này</span>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {data.revenue}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">↑ {data.revenueGrowth}</p>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Doanh thu trung bình / ngày</span>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {data.dailyAvg}
          </p>
          <p className="mt-1 text-xs text-slate-400">Tính trên chu kỳ vận hành đã chọn</p>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Doanh thu trung bình / lượt khám</span>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {data.avgPerPatient}
          </p>
          <p className="mt-1 text-xs text-slate-400">Khám lâm sàng & chỉ định cận lâm sàng</p>
        </div>
      </div>

      {/* Biểu đồ Combo Doanh Thu & Lượt Khám (Cột Doanh thu + Đường Line số ca khám) */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{data.chartLabel}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Biểu đồ kết hợp (Combo Chart): Cột Doanh thu & Đường Line Lượt khám thực tế</p>
          </div>
          {/* Chú giải 2 trục trực quan */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-700 shadow-2xs" />
              <span className="text-slate-700">Cột: Doanh thu (Tr VNĐ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-full bg-sky-600 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="text-sky-700">Đường: Lượt khám (Ca)</span>
            </div>
          </div>
        </div>

        <div className="pt-5">
          {/* Vùng Canvas Biểu đồ 2 trục Y: Trục trái (Doanh thu) - Trục phải (Lượt khám) */}
          <div className="flex">
            {/* Trục Y Trái: Giá trị Doanh thu */}
            <div className="flex flex-col justify-between text-right pr-3 select-none w-12 shrink-0 h-56">
              {data.guides.map((val, idx) => (
                <span key={idx} className="text-[10px] font-medium text-slate-400 tabular-nums leading-none">
                  {val} <span className="text-[9px]">tr</span>
                </span>
              ))}
              <span className="text-[10px] font-bold text-slate-600 tabular-nums leading-none">
                0 <span className="text-[9px]">tr</span>
              </span>
            </div>

            {/* Vùng Canvas Biểu Đồ: Đáy biểu đồ là đường border-b border-slate-300 (mốc 0) */}
            <div className="relative flex-1 h-56 border-b border-slate-300">
              {/* Đường kẻ ngang nét đứt tham chiếu */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="w-full" />
              </div>

              {/* 1. Cột Doanh Thu: Đặt items-end, chạm TRỰC TIẾP vào đáy container (đường mốc 0) */}
              <div className="relative z-10 flex h-full items-end justify-around px-4">
                {data.bars.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.max(4, Math.round((item.rev / data.chartCeiling) * 100)))
                  return (
                    <div
                      key={idx}
                      className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[68px] cursor-pointer"
                    >
                      {/* Tooltip khi rê chuột */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap rounded bg-slate-900 px-2.5 py-1 text-center shadow-md">
                        <p className="text-[11px] font-bold text-white">{item.label}: {item.rev} triệu VNĐ</p>
                        <p className="text-[10px] text-sky-300 font-medium">Lưu lượng: {item.count} lượt khám</p>
                      </div>

                      {/* Số tiền trên đầu cột */}
                      <span className="text-[11px] font-bold text-slate-700 mb-1.5 tabular-nums transition-colors group-hover:text-emerald-700">
                        {item.rev}
                      </span>

                      {/* Thân cột: Chạm đúng vào đường mốc 0, không có khoảng hở */}
                      <div
                        className="w-8 sm:w-10 rounded-t bg-emerald-700 hover:bg-emerald-800 transition-all duration-300 shadow-2xs"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* 2. Đường Line Lượt khám (Overlay Combo Chart) */}
              {(() => {
                const rawMaxCount = Math.max(...data.bars.map((b: any) => b.count || 0), 0)
                const maxCount = rawMaxCount > 0 ? Math.max(10, Math.ceil(rawMaxCount * 1.25)) : 10
                return (
                  <>
                    <svg className="pointer-events-none absolute inset-0 h-full w-full z-20 overflow-visible" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={data.bars.map((item, idx) => {
                          const xPercent = ((idx + 0.5) / data.bars.length) * 100
                          const yPercent = 100 - (item.count / maxCount) * 100
                          return `${xPercent}%,${yPercent}%`
                        }).join(' ')}
                      />
                    </svg>

                    {/* Điểm nút & Huy hiệu số ca trên Line */}
                    <div className="pointer-events-none absolute inset-0 z-30">
                      {data.bars.map((item, idx) => {
                        const xPercent = ((idx + 0.5) / data.bars.length) * 100
                        const yPercent = 100 - (item.count / maxCount) * 100
                        return (
                          <div
                            key={idx}
                            style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                          >
                            <span className="h-3 w-3 rounded-full bg-white border-2 border-sky-600 shadow-xs" />
                            <span className="mt-1 rounded bg-sky-50/90 border border-sky-200 px-1 py-0.2 text-[9px] font-bold text-sky-800 shadow-2xs">
                              {item.count} ca
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Trục Y Phải: Giá trị Lượt khám (Ca) */}
            {(() => {
              const rawMaxCount = Math.max(...data.bars.map((b: any) => b.count || 0), 0)
              const maxCount = rawMaxCount > 0 ? Math.max(10, Math.ceil(rawMaxCount * 1.25)) : 10
              const step = maxCount / 4
              return (
                <div className="flex flex-col justify-between text-left pl-3 select-none w-12 shrink-0 h-56">
                  <span className="text-[10px] font-semibold text-sky-700 tabular-nums leading-none">
                    {maxCount} <span className="text-[9px] font-normal">ca</span>
                  </span>
                  <span className="text-[10px] font-medium text-sky-600/70 tabular-nums leading-none">
                    {Math.round(step * 3)} <span className="text-[9px] font-normal">ca</span>
                  </span>
                  <span className="text-[10px] font-medium text-sky-600/70 tabular-nums leading-none">
                    {Math.round(step * 2)} <span className="text-[9px] font-normal">ca</span>
                  </span>
                  <span className="text-[10px] font-medium text-sky-600/70 tabular-nums leading-none">
                    {Math.round(step)} <span className="text-[9px] font-normal">ca</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-700 tabular-nums leading-none">
                    0 <span className="text-[9px] font-normal">ca</span>
                  </span>
                </div>
              )
            })()}
          </div>

          {/* Nhãn trục X đặt riêng bên dưới mốc 0 */}
          <div className="flex pt-2.5">
            <div className="w-12 shrink-0 pr-3" />
            <div className="flex-1 flex justify-around px-4 select-none">
              {data.bars.map((item, idx) => (
                <div key={idx} className="text-center flex-1 max-w-[68px]">
                  <p className="text-xs font-bold text-slate-700">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.count} ca</p>
                </div>
              ))}
            </div>
            <div className="w-12 shrink-0 pl-3" />
          </div>
        </div>
      </div>

      {/* Cơ cấu 2 phương thức thanh toán: Donut Chart - Thẻ chi tiết */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cơ cấu 2 Kênh thanh toán</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tỷ trọng dòng tiền thực tế giữa kênh Trực tuyến và Tại quầy</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
            <div
              className="relative grid place-items-center rounded-full shadow-sm"
              style={{
                width: '164px',
                height: '164px',
                background: `conic-gradient(
                  #ec4899 0% ${data.payments[0]?.pct || 0}%,
                  #047857 ${data.payments[0]?.pct || 0}% 100%
                )`,
              }}
            >
              {/* Tâm tròn tạo hình Donut */}
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-inner">
                <div className="px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tổng thu</span>
                  <p className="text-xs font-bold text-slate-900 leading-tight mt-0.5 truncate max-w-[96px]" title={data.revenue}>
                    {data.revenue}
                  </p>
                  <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">2 Kênh thu</span>
                </div>
              </div>
            </div>

            {/* Legend mini dưới Donut */}
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ec4899]" /> {data.payments[0]?.name || 'Trực tuyến'} ({data.payments[0]?.pct || 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#047857]" /> {data.payments[1]?.name || 'Tại quầy'} ({data.payments[1]?.pct || 0}%)
              </span>
            </div>
          </div>

          {/* Thẻ chi tiết 2 phương thức */}
          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
            {data.payments.map((p, idx) => {
              const borderColors = ['border-pink-200', 'border-emerald-200']
              const barColors = ['bg-[#ec4899]', 'bg-[#047857]']
              return (
                <div key={idx} className={`rounded border ${borderColors[idx] || 'border-slate-200'} bg-slate-50/60 p-4 hover:bg-slate-50 transition-colors shadow-2xs`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">{p.name}</span>
                    <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {p.pct}%
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-bold text-slate-900 tabular-nums">{p.amount}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full ${barColors[idx] || 'bg-emerald-600'} rounded-full transition-all duration-500`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
