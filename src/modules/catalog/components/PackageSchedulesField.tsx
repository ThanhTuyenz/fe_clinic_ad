'use client'

import React from 'react'
import { DAYS_OF_WEEK } from '../types/catalog.types'

interface PackageSchedulesFieldProps {
  form: any
  setForm: React.Dispatch<React.SetStateAction<any>>
}

export default function PackageSchedulesField({ form, setForm }: PackageSchedulesFieldProps) {
  const activeList: number[] = form.activeDaysOfWeek || [1, 2, 3, 4, 5, 6, 0]
  const isAll = activeList.length === 7
  const isWeekdays = activeList.length === 5 && [1, 2, 3, 4, 5].every((d) => activeList.includes(d))
  const isWeekends = activeList.length === 2 && activeList.includes(6) && activeList.includes(0)

  return (
    <section className="sm:col-span-2 space-y-4 rounded border border-slate-200 bg-slate-50/40 p-4">
      {/* 1. Ngày hoạt động trong tuần */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ngày hoạt động trong tuần</h3>
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              Chỉ những ngày được chọn mới mở lịch cho bệnh nhân đặt gói khám.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setForm({ ...form, activeDaysOfWeek: [1, 2, 3, 4, 5, 6, 0] })}
              className={`rounded border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                isAll
                  ? 'border-slate-500 bg-slate-100 font-bold text-slate-900 shadow-2xs'
                  : 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
              }`}
            >
              Cả tuần (T2–CN)
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, activeDaysOfWeek: [1, 2, 3, 4, 5] })}
              className={`rounded border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                isWeekdays
                  ? 'border-slate-500 bg-slate-100 font-bold text-slate-900 shadow-2xs'
                  : 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
              }`}
            >
              Thứ 2 – Thứ 6 (Hành chính)
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, activeDaysOfWeek: [6, 0] })}
              className={`rounded border px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                isWeekends
                  ? 'border-slate-500 bg-slate-100 font-bold text-slate-900 shadow-2xs'
                  : 'border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
              }`}
            >
              T7 & Chủ Nhật (Cuối tuần)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
          {DAYS_OF_WEEK.map((day) => {
            const isChecked = activeList.includes(day.id)
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => {
                  const next = isChecked
                    ? activeList.filter((d) => d !== day.id)
                    : [...activeList, day.id]
                  if (next.length === 0) return
                  setForm({ ...form, activeDaysOfWeek: next })
                }}
                className={`flex flex-col items-center justify-center rounded border py-2.5 text-xs transition-all cursor-pointer ${
                  isChecked
                    ? 'border-slate-400 bg-white text-slate-900 font-bold shadow-xs ring-1 ring-slate-400/40'
                    : 'border-slate-200 bg-slate-50/70 text-slate-400 font-normal hover:bg-white hover:text-slate-600'
                }`}
              >
                <span className="text-xs">{day.label}</span>
                <span
                  className={`mt-1 text-[10px] ${
                    isChecked ? 'font-semibold text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {isChecked ? 'Mở' : 'Nghỉ'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* 2. Khung giờ & Buổi tiếp nhận */}
      <div>
        <div className="mb-2">
          <h3 className="text-sm font-bold text-slate-900">Khung giờ & Buổi tiếp nhận bệnh nhân</h3>
          <p className="mt-0.5 text-xs font-normal text-slate-500">
            Chọn buổi tiếp nhận để hệ thống tự động lọc khung giờ và bác sĩ trực phù hợp khi đặt lịch.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <label
            className={`flex flex-col gap-1 rounded border p-3 cursor-pointer transition-colors ${
              (form.sessionType || 'MORNING') === 'MORNING'
                ? 'border-slate-800 bg-white shadow-xs'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="sessionType"
                value="MORNING"
                checked={(form.sessionType || 'MORNING') === 'MORNING'}
                onChange={() => setForm({ ...form, sessionType: 'MORNING' })}
              />
              <span className="text-xs font-bold text-slate-900">Chỉ buổi sáng</span>
            </div>
            <span className="text-[11px] font-medium text-slate-600">Khung giờ: 07:30 – 11:30</span>
            <span className="text-[11px] text-slate-400">
              Khuyên dùng cho gói tổng quát & xét nghiệm máu (cần nhịn ăn sáng).
            </span>
          </label>

          <label
            className={`flex flex-col gap-1 rounded border p-3 cursor-pointer transition-colors ${
              form.sessionType === 'AFTERNOON'
                ? 'border-slate-800 bg-white shadow-xs'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="sessionType"
                value="AFTERNOON"
                checked={form.sessionType === 'AFTERNOON'}
                onChange={() => setForm({ ...form, sessionType: 'AFTERNOON' })}
              />
              <span className="text-xs font-bold text-slate-900">Chỉ buổi chiều</span>
            </div>
            <span className="text-[11px] font-medium text-slate-600">Khung giờ: 13:30 – 17:00</span>
            <span className="text-[11px] text-slate-400">
              Dành cho các gói khám tư vấn, chuyên sâu không làm xét nghiệm lúc đói.
            </span>
          </label>

          <label
            className={`flex flex-col gap-1 rounded border p-3 cursor-pointer transition-colors ${
              form.sessionType === 'EVENING'
                ? 'border-slate-800 bg-white shadow-xs'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="sessionType"
                value="EVENING"
                checked={form.sessionType === 'EVENING'}
                onChange={() => setForm({ ...form, sessionType: 'EVENING' })}
              />
              <span className="text-xs font-bold text-slate-900">Khám ngoài giờ (Tối)</span>
            </div>
            <span className="text-[11px] font-medium text-slate-600">Khung giờ: 17:00 – 20:30</span>
            <span className="text-[11px] text-slate-400">
              Dành cho người bận rộn khám sau giờ làm việc hành chính.
            </span>
          </label>

          <label
            className={`flex flex-col gap-1 rounded border p-3 cursor-pointer transition-colors ${
              form.sessionType === 'OFFICE_HOURS'
                ? 'border-slate-800 bg-white shadow-xs'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="sessionType"
                value="OFFICE_HOURS"
                checked={form.sessionType === 'OFFICE_HOURS'}
                onChange={() => setForm({ ...form, sessionType: 'OFFICE_HOURS' })}
              />
              <span className="text-xs font-bold text-slate-900">Giờ hành chính</span>
            </div>
            <span className="text-[11px] font-medium text-slate-600">Sáng & Chiều (07:30 – 17:00)</span>
            <span className="text-[11px] text-slate-400">
              Chỉ tiếp nhận trong giờ hành chính ban ngày, không nhận ca tối.
            </span>
          </label>

          <label
            className={`flex flex-col gap-1 rounded border p-3 cursor-pointer transition-colors ${
              form.sessionType === 'ALL_DAY'
                ? 'border-slate-800 bg-white shadow-xs'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="sessionType"
                value="ALL_DAY"
                checked={form.sessionType === 'ALL_DAY'}
                onChange={() => setForm({ ...form, sessionType: 'ALL_DAY' })}
              />
              <span className="text-xs font-bold text-slate-900">Cả ngày & Ngoài giờ</span>
            </div>
            <span className="text-[11px] font-medium text-slate-600">Tất cả ca trực (07:30 – 20:30)</span>
            <span className="text-[11px] text-slate-400">
              Mở tất cả các ca trực của bác sĩ và phòng khám trong ngày.
            </span>
          </label>
        </div>
      </div>
    </section>
  )
}
