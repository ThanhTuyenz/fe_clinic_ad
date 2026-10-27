'use client'

import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { DonutChart, KpiMetricCard } from './Charts'

interface AnalyticsRevenueTimelineTabProps {
  data: {
    invoicePaymentStatus?: {
      paid: { count: number; amount: number }
      unpaid: { count: number; amount: number }
    }
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
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const invoicePaymentStatus = data.invoicePaymentStatus
  const formatAmount = (amount: number) => Number(amount || 0).toLocaleString('vi-VN') + ' đ'
  const revTrend = data.bars.map((b) => b.rev)
  const countTrend = data.bars.map((b) => b.count)

  const maxCount = Math.max(10, Math.ceil(Math.max(...countTrend, 0) * 1.25))

  return (
    <div className="space-y-4">
      {/* 3 Thẻ chỉ số Executive có Sparkline mini */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiMetricCard
          label="Tổng doanh thu kỳ này"
          value={data.revenue}
          badge={`↑ ${data.revenueGrowth}`}
          detail="vs kỳ trước"
          tone="emerald"
          sparklineData={revTrend.length ? revTrend : [10, 20, 15, 30, 25, 35, 40]}
        />
        <KpiMetricCard
          label="Doanh thu TB / ngày"
          value={data.dailyAvg}
          detail="Theo chu kỳ vận hành"
          tone="blue"
          sparklineData={revTrend.length ? revTrend : [5, 8, 7, 12, 10, 15, 14]}
        />
        <KpiMetricCard
          label="Doanh thu TB / lượt khám"
          value={data.avgPerPatient}
          detail="Khám & cận lâm sàng"
          tone="indigo"
          sparklineData={countTrend.length ? countTrend : [15, 25, 20, 35, 30, 45, 42]}
        />
      </div>

      <section className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900">Tình trạng thanh toán hóa đơn</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Trạng thái hiện tại của hóa đơn được tạo trong kỳ và chi nhánh đã chọn.
          Không tính hóa đơn đã hủy hoặc hoàn tiền.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <KpiMetricCard
            label="Đã thanh toán"
            value={invoicePaymentStatus ? formatAmount(invoicePaymentStatus.paid.amount) : '—'}
            detail={invoicePaymentStatus ? invoicePaymentStatus.paid.count.toLocaleString('vi-VN') + ' hóa đơn' : 'Chưa có dữ liệu'}
            tone="emerald"
          />
          <KpiMetricCard
            label="Chưa thanh toán"
            value={invoicePaymentStatus ? formatAmount(invoicePaymentStatus.unpaid.amount) : '—'}
            detail={invoicePaymentStatus ? invoicePaymentStatus.unpaid.count.toLocaleString('vi-VN') + ' hóa đơn' : 'Chưa có dữ liệu'}
            tone="amber"
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Khoản chưa thanh toán chưa được tính vào doanh thu. Doanh thu phía trên tính theo ngày thanh toán,
          nên có thể khác số tiền đã thanh toán của nhóm hóa đơn phát sinh trong kỳ.
        </p>
      </section>

      {/* Biểu đồ Combo Doanh Thu & Lượt Khám (Cột Doanh thu + Đường Line số ca khám) */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{data.chartLabel}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Biểu đồ kết hợp (Recharts Composed Chart): Cột Doanh thu & Đường Line Lượt khám thực tế</p>
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
          {!isMounted ? (
            <div className="h-64 w-full animate-pulse rounded bg-slate-100" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.bars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#047857"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit=" tr"
                    domain={[0, data.chartCeiling || 'auto']}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#0284c7"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit=" ca"
                    domain={[0, maxCount]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null
                      const revVal = payload.find((p) => p.dataKey === 'rev')?.value
                      const countVal = payload.find((p) => p.dataKey === 'count')?.value
                      return (
                        <div className="rounded border border-slate-200 bg-slate-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-sm">
                          <p className="text-xs font-bold text-slate-100">{label}</p>
                          <div className="mt-1 space-y-0.5 text-[11px]">
                            <p className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              Doanh thu: {revVal} triệu VNĐ
                            </p>
                            <p className="flex items-center gap-1.5 text-sky-300 font-medium">
                              <span className="h-2 w-2 rounded-full bg-sky-400" />
                              Lưu lượng: {countVal} ca khám
                            </p>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="rev"
                    fill="#047857"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ fill: '#ffffff', stroke: '#0284c7', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
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
            <DonutChart
              segments={[
                {
                  label: data.payments[0]?.name || 'Trực tuyến (QR/Banking)',
                  value: data.payments[0]?.pct || 0,
                  color: '#ec4899',
                  subLabel: data.payments[0]?.amount,
                },
                {
                  label: data.payments[1]?.name || 'Tại quầy (Tiền mặt/POS)',
                  value: data.payments[1]?.pct || 0,
                  color: '#047857',
                  subLabel: data.payments[1]?.amount,
                },
              ]}
              size={150}
              thickness={22}
              centerLabel="Tổng thu"
              centerValue="100%"
              layout="horizontal"
            />
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
