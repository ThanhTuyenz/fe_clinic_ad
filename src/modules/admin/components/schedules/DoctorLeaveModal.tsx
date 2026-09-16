'use client'

import React, { useState } from 'react'
import {
  analyzeDoctorLeaveImpact,
  executeSmartReschedule,
  type DoctorLeaveImpactResponse,
} from '../../services/smartReschedule'

interface Props {
  isOpen: boolean
  onClose: () => void
  doctors: any[]
  onSuccess?: () => void
}

export default function DoctorLeaveModal({ isOpen, onClose, doctors, onSuccess }: Props) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10))
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))

  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<DoctorLeaveImpactResponse | null>(null)
  const [err, setErr] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Map of appointmentId -> selected newSlotId
  const [selectedReplacements, setSelectedReplacements] = useState<Record<string, string>>({})
  const [rescheduling, setRescheduling] = useState(false)

  if (!isOpen) return null

  const handleAnalyze = async () => {
    if (!selectedDoctorId) {
      setErr('Vui lòng chọn bác sĩ')
      return
    }
    setAnalyzing(true)
    setErr('')
    setSuccessMsg('')
    try {
      const res = await analyzeDoctorLeaveImpact({
        doctorId: selectedDoctorId,
        fromDate,
        toDate,
      })
      setAnalysis(res)
      // Mặc định chọn slot thay thế đầu tiên do AI gợi ý cho mỗi ca
      const initialMap: Record<string, string> = {}
      res.impacts.forEach((imp) => {
        if (imp.suggestedSlots && imp.suggestedSlots.length > 0) {
          initialMap[imp.appointment.id] = imp.suggestedSlots[0].slotId
        }
      })
      setSelectedReplacements(initialMap)
    } catch (e: any) {
      setErr(e?.message || 'Lỗi khi phân tích ảnh hưởng lịch nghỉ.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExecuteReschedule = async () => {
    if (!analysis) return
    const items = Object.entries(selectedReplacements).map(([appointmentId, newSlotId]) => ({
      appointmentId,
      newSlotId,
    }))

    if (items.length === 0) {
      setErr('Không có lịch hẹn nào được chọn để chuyển đổi.')
      return
    }

    setRescheduling(true)
    setErr('')
    try {
      const res = await executeSmartReschedule({ items })
      setSuccessMsg(`✅ Đã thực hiện đổi lịch thành công cho ${res.successCount}/${res.total} ca khám!`)
      if (onSuccess) onSuccess()
    } catch (e: any) {
      setErr(e?.message || 'Không thể thực hiện đổi lịch tự động.')
    } finally {
      setRescheduling(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI Smart Rescheduling: Bác sĩ nghỉ đột xuất
              </h2>
              <p className="text-xs text-slate-500">
                AI tự động rà soát bệnh nhân bị ảnh hưởng và tìm slot thay thế tương đương
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {err && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-medium">
            {err}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-bold">
            {successMsg}
          </div>
        )}

        {/* Form nhập thông tin nghỉ */}
        <div className="grid gap-3 sm:grid-cols-3 bg-slate-50/80 p-3.5 rounded border border-slate-200/80 text-xs">
          <div className="sm:col-span-3">
            <label className="block font-bold text-slate-700 mb-1">Chọn bác sĩ báo nghỉ:</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value)
                setAnalysis(null)
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user?.fullName || d.fullName} {d.specialtyName ? `(${d.specialtyName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Từ ngày:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 font-medium focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Đến ngày:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 font-medium focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !selectedDoctorId}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {analyzing ? 'Đang phân tích…' : '🔍 AI Phân tích'}
            </button>
          </div>
        </div>

        {/* KẾT QUẢ PHÂN TÍCH AI */}
        {analysis && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded text-xs text-amber-900">
              <span className="font-bold">
                ⚠️ Phát hiện {analysis.affectedCount} lịch hẹn của bệnh nhân bị ảnh hưởng!
              </span>
              <span className="text-[11px] text-amber-700">
                Chuyên khoa: {analysis.doctor.specialtyName}
              </span>
            </div>

            {analysis.affectedCount === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                Không có bệnh nhân nào đặt lịch trước trong khoảng thời gian này.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {analysis.impacts.map((item, idx) => (
                  <div
                    key={item.appointment.id}
                    className="p-3 bg-white border border-slate-200 rounded space-y-2 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        #{idx + 1}. {item.appointment.patient?.fullName || item.appointment.patient?.name} (Mã: {item.appointment.ticket})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.appointment.examDate} lúc {item.appointment.examTime}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                        ✨ AI Gợi ý chuyển sang:
                      </label>
                      {item.suggestedSlots.length === 0 ? (
                        <p className="text-[11px] text-rose-600 italic">
                          Không tìm thấy slot trống cùng chuyên khoa trong 5 ngày tới.
                        </p>
                      ) : (
                        <select
                          value={selectedReplacements[item.appointment.id] || ''}
                          onChange={(e) =>
                            setSelectedReplacements((prev) => ({
                              ...prev,
                              [item.appointment.id]: e.target.value,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded text-xs font-medium text-emerald-950 focus:outline-none"
                        >
                          {item.suggestedSlots.map((slot) => (
                            <option key={slot.slotId} value={slot.slotId}>
                              {slot.doctorName} — {slot.workDate} ({slot.startTime} - {slot.endTime}) tại {slot.branchName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {analysis.affectedCount > 0 && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleExecuteReschedule}
                  disabled={rescheduling}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {rescheduling ? 'Đang thực hiện đổi lịch…' : '🚀 Xác nhận Đổi lịch bằng AI'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
