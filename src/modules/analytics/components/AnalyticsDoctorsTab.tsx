'use client'

import React, { useMemo, useState } from 'react'

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
  const [showAllDoctors, setShowAllDoctors] = useState(false)

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
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Bác sĩ có số liệu', value: `${doctorsPerformance.length} bác sĩ`, detail: 'Có ca khám trong kỳ' },
          { label: 'Dẫn đầu số ca khám', value: topByAppts?.name || '—', detail: topByAppts ? `${topByAppts.appts} ca hoàn thành` : 'Chưa có dữ liệu' },
          { label: 'Dẫn đầu doanh thu', value: topByRev?.name || '—', detail: topByRev?.totalRev || 'Chưa có dữ liệu' },
        ].map((item) => (
          <div key={item.label} className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-900 line-clamp-2" title={item.value}>{item.value}</p>
            <p className="mt-1 text-[11px] text-slate-500 tabular-nums">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Biểu đồ Cột Ngang (Horizontal Bar Chart) Top Bác Sĩ Gánh Tải Chính */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">
              Xếp hạng bác sĩ
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {showAllDoctors ? 'Tất cả bác sĩ' : 'Top 5 bác sĩ'} trong kỳ · Thanh biểu đồ so với người dẫn đầu
            </p>
          </div>

          {/* Nút chuyển đổi tiêu chí xếp hạng */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setDoctorMetric('revenue')}
              className={`rounded px-3 py-1 font-semibold transition-colors cursor-pointer ${
                doctorMetric === 'revenue'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doanh thu
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
              Số ca khám
            </button>
          </div>
        </div>

        {/* Danh sách các thanh Bar ngang */}
        <div className="mt-1 divide-y divide-slate-100">
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

              return (showAllDoctors ? sorted : sorted.slice(0, 5)).map((doc: any, idx: number) => {
                const currentVal =
                  doctorMetric === 'appointments'
                    ? doc.appts || 0
                    : parseFloat(String(doc.totalRev || '0').replace(/\./g, '').replace(' đ', '')) || 0
                const widthPct = Math.min(100, Math.max(0, (currentVal / maxVal) * 100))

                return (
                  <div
                    key={doc.id || idx}
                    className="grid grid-cols-[24px_minmax(0,1fr)_auto] sm:grid-cols-[24px_minmax(0,1fr)_minmax(100px,1.2fr)_110px] items-center gap-x-3 gap-y-1.5 py-2.5"
                  >
                    <span className="text-[11px] tabular-nums text-slate-400">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-800" title={doc.name}>{doc.name}</p>
                      <p className="truncate text-[10px] text-slate-400" title={doc.specialty}>{doc.specialty}</p>
                    </div>

                    {/* Thanh cột ngang */}
                    <div className="col-start-2 col-span-2 row-start-2 sm:col-start-3 sm:col-span-1 sm:row-start-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden" title={`${Math.round(widthPct)}% so với người dẫn đầu`}>
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="col-start-3 row-start-1 sm:col-start-4 text-right text-[11px] font-medium text-slate-700 tabular-nums whitespace-nowrap">
                      {doctorMetric === 'revenue' ? doc.totalRev : `${doc.appts} ca`}
                    </span>
                  </div>
                )
              })
            })()
          )}
        </div>
        {doctorsPerformance.length > 5 && <button type="button" onClick={() => setShowAllDoctors(!showAllDoctors)} className="mt-1 text-[11px] font-medium text-blue-600 hover:text-blue-800">
          {showAllDoctors ? 'Thu gọn' : `Xem đủ ${doctorsPerformance.length} bác sĩ`}
        </button>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-xs font-semibold text-slate-900">Chi tiết hiệu suất bác sĩ</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Số ca khám và doanh thu trong kỳ</p>
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
                      <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {doc.name}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {doc.specialty}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-medium text-slate-800 tabular-nums whitespace-nowrap">
                        {doc.appts} ca
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                        {doc.examRev}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                        {doc.subclinicalRev}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
                        {doc.totalRev}
                      </td>
                      <td className="py-2.5 px-4 text-center w-28 whitespace-nowrap">
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
                  <td className="py-2.5 px-4 text-slate-900 font-semibold">Tổng cộng trong kỳ</td>
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
