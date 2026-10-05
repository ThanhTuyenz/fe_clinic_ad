'use client'

import React, { useMemo } from 'react'

interface AnalyticsOperationsTabProps {
  data: {
    appointments: string
    completionRate: string
    noShowRate: string
    cancelRate: string
    newPatientsPct: number
    returnPatientsPct: number
  }
  heatmapMatrix?: number[][]
}

export default function AnalyticsOperationsTab({ data, heatmapMatrix: externalHeatmap }: AnalyticsOperationsTabProps) {
  const heatmapDays = useMemo(() => ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'], [])
  const heatmapSlots = useMemo(
    () => [
      '07:00 – 09:00',
      '09:00 – 11:00',
      '11:00 – 13:00',
      '13:00 – 15:00',
      '15:00 – 17:00',
      '17:00 – 19:00',
      '19:00 – 21:00',
    ],
    [],
  )

  const heatmapMatrix: number[][] = useMemo(() => {
    if (externalHeatmap && Array.isArray(externalHeatmap) && externalHeatmap.length === 7) {
      return externalHeatmap
    }
    return Array.from({ length: 7 }, () => Array(7).fill(0))
  }, [externalHeatmap])

  const maxHeatmapVal = useMemo(() => {
    let max = 0
    for (const row of heatmapMatrix) {
      for (const val of row) {
        if (val > max) max = val
      }
    }
    return max
  }, [heatmapMatrix])

  const peakInfo = useMemo(() => {
    let max = 0
    let peakSlot = ''
    let peakDay = ''
    heatmapSlots.forEach((slot, sIdx) => {
      heatmapDays.forEach((day, dIdx) => {
        const count = heatmapMatrix[sIdx]?.[dIdx] || 0
        if (count > max) {
          max = count
          peakSlot = slot
          peakDay = day
        }
      })
    })
    return { max, peakSlot, peakDay }
  }, [heatmapMatrix, heatmapSlots, heatmapDays])

  const getHeatmapClass = (count: number) => {
    if (count === 0) return 'bg-slate-50 text-slate-400 font-normal hover:bg-slate-100'
    if (maxHeatmapVal <= 0) return 'bg-slate-50 text-slate-400 font-normal'
    const ratio = count / maxHeatmapVal
    if (ratio >= 0.8) return 'bg-[#fca5a5] text-slate-900 font-bold hover:bg-[#f87171]/90 shadow-2xs'
    if (ratio >= 0.6) return 'bg-[#fed7aa] text-slate-900 font-semibold hover:bg-[#fdba74] shadow-2xs'
    if (ratio >= 0.4) return 'bg-[#fef08a] text-slate-800 font-medium hover:bg-[#fde047] shadow-2xs'
    if (ratio >= 0.2) return 'bg-[#bbf7d0] text-slate-800 font-medium hover:bg-[#86efac] shadow-2xs'
    return 'bg-[#a5f3fc] text-slate-800 font-medium hover:bg-[#67e8f9] shadow-2xs'
  }

  return (
    <div className="space-y-4">
      {/* 3 Thẻ lưu lượng */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Tổng ca khám tiếp nhận</span>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {data.appointments}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">Hoàn thành: {data.completionRate}</p>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Tỷ lệ vắng mặt (No-show)</span>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {data.noShowRate}
          </p>
          <p className="mt-1 text-xs text-slate-400">Đặt lịch nhưng không tới phòng khám</p>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Tỷ lệ hủy lịch hẹn</span>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {data.cancelRate}
          </p>
          <p className="mt-1 text-xs text-slate-400">Bệnh nhân báo hủy trước giờ khám</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* Heatmap Giờ cao điểm */}
        <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Biểu đồ nhiệt Giờ cao điểm (Peak Hours Heatmap)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Số lượng bệnh nhân tiếp nhận trung bình theo từng khung giờ trong tuần</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 select-none">
              <span className="font-medium text-slate-400">0 ca</span>
              <div className="flex h-3.5 w-28 rounded-full overflow-hidden border border-slate-200 shadow-2xs">
                <span className="flex-1 bg-slate-100" title="0 ca" />
                <span className="flex-1 bg-[#a5f3fc]" title="Thấp" />
                <span className="flex-1 bg-[#bbf7d0]" title="Trung bình" />
                <span className="flex-1 bg-[#fef08a]" title="Khá đông" />
                <span className="flex-1 bg-[#fed7aa]" title="Đông" />
                <span className="flex-1 bg-[#fca5a5]" title="Cao điểm" />
              </div>
              <span className="font-medium text-slate-400">Cao điểm</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-[11px] font-bold text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-2.5 font-semibold text-slate-400">Khung giờ</th>
                  {heatmapDays.map((d) => (
                    <th key={d} className="pb-2.5 px-1">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {heatmapSlots.map((slot, sIdx) => (
                  <tr key={slot}>
                    <td className="text-left py-2 text-[11px] font-semibold text-slate-600 whitespace-nowrap pr-2">
                      {slot}
                    </td>
                    {heatmapDays.map((_, dIdx) => {
                      const count = heatmapMatrix[sIdx]?.[dIdx] || 0
                      const colorClass = getHeatmapClass(count)
                      return (
                        <td key={dIdx} className="p-1">
                          <div
                            className={`h-9 w-full rounded flex items-center justify-center text-xs font-semibold transition-all duration-150 hover:scale-105 cursor-pointer ${colorClass}`}
                            title={`${slot}, ${heatmapDays[dIdx]}: ${count} ca`}
                          >
                            {count}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200">
            <span className="font-bold text-slate-900 mr-1.5">Gợi ý điều phối:</span>
            {peakInfo.max > 0 ? (
                  <>
                    Khung giờ <b>{peakInfo.peakSlot}</b> ngày <b>{peakInfo.peakDay}</b> đạt đỉnh tiếp nhận với <b>{peakInfo.max} ca</b>. Nên chủ động bố trí thêm bác sĩ khám sơ bộ và mở tối đa quầy tiếp nhận để giảm thiểu thời gian chờ.
                  </>
            ) : (
              <>Chưa ghi nhận ca khám tập trung trong khoảng thời gian đã chọn.</>
            )}
          </div>
        </div>

        {/* Khách mới vs Tái khám & Chỉ số Phễu */}
        <div className="space-y-4">
          <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Tỷ lệ Bệnh nhân mới vs Tái khám
            </h3>
            <div className="h-5 w-full rounded overflow-hidden flex text-[10px] font-bold text-white border border-slate-200">
              <div style={{ width: `${data.newPatientsPct}%` }} className="bg-slate-800 flex items-center justify-center">
                {data.newPatientsPct}% Mới
              </div>
              <div style={{ width: `${data.returnPatientsPct}%` }} className="bg-slate-400 flex items-center justify-center">
                {data.returnPatientsPct}% Tái khám
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="rounded p-2.5 bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Bệnh nhân mới</span>
                <p className="mt-1 text-base font-bold text-slate-900">{data.newPatientsPct}%</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Đặt qua Web, App & Tiếp đón</p>
              </div>
              <div className="rounded p-2.5 bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Khách tái khám</span>
                <p className="mt-1 text-base font-bold text-slate-900">{data.returnPatientsPct}%</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Đo lường mức độ giữ chân (Retention)</p>
              </div>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Chỉ số Phễu Tiếp nhận
            </h3>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1 text-slate-700">
                  <span>Hoàn thành khám bệnh</span>
                  <b className="text-slate-900">{data.completionRate}</b>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: data.completionRate }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1 text-slate-700">
                  <span>Vắng mặt (No-show)</span>
                  <b className="text-slate-700">{data.noShowRate}</b>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: data.noShowRate }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1 text-slate-700">
                  <span>Hủy lịch hẹn trước</span>
                  <b className="text-slate-700">{data.cancelRate}</b>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-slate-300 rounded-full" style={{ width: data.cancelRate }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
