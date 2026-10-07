'use client'

import React, { useMemo, useState } from 'react'
import { Sparkline, KpiMetricCard } from './Charts'

interface DoctorPerformanceItem {
  id: string
  name: string
  specialty: string
  appts: number
  examRev: string
  subclinicalRev: string
  totalRev: string
}

interface AnalyticsDoctorsTabProps {
  doctorsPerformance: DoctorPerformanceItem[]
}

export default function AnalyticsDoctorsTab({ doctorsPerformance }: AnalyticsDoctorsTabProps) {
  const [doctorMetric, setDoctorMetric] = useState<'revenue' | 'appointments'>('revenue')

  const topByAppts = useMemo(() => {
    if (!doctorsPerformance.length) return null
    return [...doctorsPerformance].sort((a, b) => (b.appts || 0) - (a.appts || 0))[0]
  }, [doctorsPerformance])

  const topByRev = useMemo(() => {
    if (!doctorsPerformance.length) return null
    return [...doctorsPerformance].sort((a, b) => {
      const revA = parseFloat(String(a.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
      const revB = parseFloat(String(b.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
      return revB - revA
    })[0]
  }, [doctorsPerformance])

  // Tính tổng cộng cho Total Row
  const totals = useMemo(() => {
    let totalAppts = 0
    let totalExamRev = 0
    let totalSubRev = 0
    let totalRev = 0

    doctorsPerformance.forEach((d) => {
      totalAppts += d.appts || 0
      const exam = parseFloat(String(d.examRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
      const sub = parseFloat(String(d.subclinicalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
      const tot = parseFloat(String(d.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
      totalExamRev += exam
      totalSubRev += sub
      totalRev += tot
    })

    return {
      totalAppts,
      totalExamRev: `${Math.round(totalExamRev).toLocaleString('vi-VN')} đ`,
      totalSubRev: `${Math.round(totalSubRev).toLocaleString('vi-VN')} đ`,
      totalRev: `${Math.round(totalRev).toLocaleString('vi-VN')} đ`,
    }
  }, [doctorsPerformance])

  const maxTotalRevNum = useMemo(() => {
    return Math.max(
      1,
      ...doctorsPerformance.map((d) => parseFloat(String(d.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0)
    )
  }, [doctorsPerformance])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiMetricCard
          label="Số bác sĩ có số liệu"
          value={`${doctorsPerformance.length} bác sĩ`}
          detail="Trực khám thực tế trong kỳ"
          tone="emerald"
          sparklineData={[5, 8, 12, 10, 15, 14, 18]}
        />
        <KpiMetricCard
          label="Bác sĩ dẫn đầu ca khám"
          value={topByAppts?.name || '—'}
          detail={topByAppts ? `${topByAppts.appts} ca hoàn thành` : 'Chưa có dữ liệu'}
          tone="blue"
          sparklineData={[8, 12, 16, 22, 28, 35, 40]}
        />
        <KpiMetricCard
          label="Bác sĩ dẫn đầu doanh thu"
          value={topByRev?.name || '—'}
          detail={topByRev ? topByRev.totalRev : 'Chưa có dữ liệu'}
          tone="indigo"
          sparklineData={[10, 15, 20, 25, 30, 35, 45]}
        />
      </div>

      {/* Biểu đồ Cột Ngang (Horizontal Bar Chart) Top Bác Sĩ Gánh Tải Chính */}
      <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Biểu đồ Xếp hạng Top Bác sĩ (Horizontal Bar Chart)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhận diện nhanh nhân sự chủ lực gánh tải ca khám và doanh thu toàn viện
            </p>
          </div>

          {/* Nút chuyển đổi tiêu chí xếp hạng */}
          <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setDoctorMetric('revenue')}
              className={`rounded px-3 py-1 font-semibold transition-colors cursor-pointer ${
                doctorMetric === 'revenue'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Doanh thu
            </button>
            <button
              type="button"
              onClick={() => setDoctorMetric('appointments')}
              className={`rounded px-3 py-1 font-semibold transition-colors cursor-pointer ${
                doctorMetric === 'appointments'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo Số ca khám
            </button>
          </div>
        </div>

        {/* Danh sách các thanh Bar ngang */}
        <div className="mt-4 space-y-3">
          {doctorsPerformance.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Chưa có dữ liệu bác sĩ trong kỳ.</div>
          ) : (
            (() => {
              const sorted = [...doctorsPerformance].sort((a: any, b: any) => {
                if (doctorMetric === 'appointments') return b.appts - a.appts
                const revA = parseFloat(String(a.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
                const revB = parseFloat(String(b.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
                return revB - revA
              })
              const maxVal = Math.max(
                1,
                ...(doctorMetric === 'appointments'
                  ? sorted.map((d: any) => d.appts || 0)
                  : sorted.map((d: any) => parseFloat(String(d.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0)),
              )

              const rankMedals = ['🥇 #1', '🥈 #2', '🥉 #3', '#4', '#5', '#6', '#7', '#8']
              const barColors = [
                'bg-emerald-700',
                'bg-blue-600',
                'bg-indigo-600',
                'bg-amber-500',
                'bg-slate-600',
                'bg-teal-600',
                'bg-violet-600',
                'bg-rose-600',
              ]

              return sorted.map((doc: any, idx: number) => {
                const currentVal =
                  doctorMetric === 'appointments'
                    ? doc.appts || 0
                    : parseFloat(String(doc.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
                const widthPct = Math.min(100, Math.max(12, Math.round((currentVal / maxVal) * 100)))

                return (
                  <div
                    key={doc.id || idx}
                    className="rounded border border-slate-200/70 bg-slate-50/40 p-3 hover:bg-slate-50 transition-colors space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 w-9 text-xs">
                          {rankMedals[idx] || `#${idx + 1}`}
                        </span>
                        <span className="font-bold text-slate-900">{doc.name}</span>
                        <span className="rounded bg-white border border-slate-200 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                          {doc.specialty}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {doctorMetric === 'revenue' ? doc.totalRev : `${doc.appts} ca khám`}
                        </span>
                        <span className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {widthPct}%
                        </span>
                      </div>
                    </div>

                    {/* Thanh cột ngang */}
                    <div className="h-2.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[idx % barColors.length]} transition-all duration-500`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            })()
          )}
        </div>
      </div>

      <div className="rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Bảng theo dõi Hiệu suất & Đóng góp Bác sĩ</h3>
          <p className="text-xs text-slate-400 mt-0.5">Chi tiết số ca khám, thu dịch vụ và chỉ định cận lâm sàng (CLS) của từng bác sĩ</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[780px]">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bác sĩ phụ trách</th>
                <th className="py-3 px-4">Chuyên khoa</th>
                <th className="py-3 px-4 text-center">Số ca khám</th>
                <th className="py-3 px-4 text-right">Thu từ Khám bệnh</th>
                <th className="py-3 px-4 text-right">Thu từ Chỉ định CLS</th>
                <th className="py-3 px-4 text-right">Tổng doanh thu</th>
                <th className="py-3 px-4 text-center">Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctorsPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chưa có dữ liệu hiệu suất bác sĩ trong kỳ.
                  </td>
                </tr>
              ) : (
                doctorsPerformance.map((doc, idx) => {
                  const revNum = parseFloat(String(doc.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
                  const barPct = Math.min(100, Math.max(5, Math.round((revNum / maxTotalRevNum) * 100)))

                  return (
                    <tr key={doc.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {doc.name}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {doc.specialty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 tabular-nums whitespace-nowrap">
                        {doc.appts} ca
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                        {doc.examRev}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                        {doc.subclinicalRev}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {doc.totalRev}
                      </td>
                      <td className="py-3.5 px-4 text-center w-28 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-700" style={{ width: `${barPct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{barPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {/* DÒNG TỔNG CỘNG (TOTAL ROW) */}
            {doctorsPerformance.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">Tổng cộng toàn viện</td>
                  <td className="py-3.5 px-4 text-slate-500 font-semibold">{doctorsPerformance.length} bác sĩ</td>
                  <td className="py-3.5 px-4 text-center text-slate-900 font-bold">{totals.totalAppts} ca</td>
                  <td className="py-3.5 px-4 text-right text-slate-700 font-semibold">{totals.totalExamRev}</td>
                  <td className="py-3.5 px-4 text-right text-slate-700 font-semibold">{totals.totalSubRev}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-800 font-bold text-sm">{totals.totalRev}</td>
                  <td className="py-3.5 px-4 text-center text-slate-900 font-bold">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
