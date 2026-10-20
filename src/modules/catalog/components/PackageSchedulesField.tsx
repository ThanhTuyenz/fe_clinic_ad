'use client'

import { useState } from 'react'
import { DAYS_OF_WEEK, RECEPTION_SESSIONS, ReceptionDay, formatReceptionSchedule } from '../types/catalog.types'

interface Props {
  value: ReceptionDay[]
  onChange: (days: ReceptionDay[]) => void
  disabled?: boolean
  weekendOnly?: boolean
}

export default function PackageSchedulesField({ value, onChange, disabled, weekendOnly = false }: Props) {
  const [perDay, setPerDay] = useState(() => new Set(value.map((day) => [...day.sessions].sort().join(','))).size > 1)
  const selectedDays = value.map((day) => day.dayOfWeek)
  const commonSessions = RECEPTION_SESSIONS.filter((session) => value.some((day) => day.sessions.includes(session.code))).map((session) => session.code)
  const chooseDays = (days: number[]) => onChange(days.map((dayOfWeek) =>
    value.find((day) => day.dayOfWeek === dayOfWeek) || { dayOfWeek, sessions: perDay ? [] : [...commonSessions] },
  ))
  const toggleSession = (code: string, targetDay?: number) => {
    const selected = targetDay === undefined ? commonSessions : value.find((day) => day.dayOfWeek === targetDay)?.sessions || []
    const next = selected.includes(code) ? selected.filter((session) => session !== code) : [...selected, code]
    onChange(value.map((day) => targetDay === undefined || day.dayOfWeek === targetDay ? { ...day, sessions: next } : day))
  }

  return <fieldset disabled={disabled} className="space-y-4 rounded border border-slate-200 bg-slate-50/40 p-4 disabled:opacity-60">
    <legend className="px-1 text-sm font-bold text-slate-900">Lịch tiếp nhận gói khám</legend>
    <p className="text-xs text-slate-500">Bệnh nhân chỉ được đặt trong ngày, buổi đã chọn và khi có lịch bác sĩ phù hợp.</p>
    {weekendOnly && <p className="text-xs text-slate-600">Khám ngoài giờ chỉ nhận thứ Bảy và Chủ nhật. Bỏ chọn các ngày khác nếu lịch cũ còn lưu.</p>}
    <div className="flex flex-wrap gap-2">
      {[{ label: 'Cả tuần', days: [1, 2, 3, 4, 5, 6, 0] }, { label: 'Thứ 2–Thứ 6', days: [1, 2, 3, 4, 5] }, { label: 'Cuối tuần', days: [6, 0] }].filter((preset) => !weekendOnly || preset.days.every((day) => day === 6 || day === 0)).map((preset) =>
        <button key={preset.label} type="button" onClick={() => chooseDays(preset.days)} className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs hover:border-emerald-600">{preset.label}</button>,
      )}
      <button type="button" onClick={() => onChange([])} className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs">Tạm ngừng tiếp nhận</button>
    </div>
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {DAYS_OF_WEEK.map((day) => {
        const selected = selectedDays.includes(day.id)
        return <button key={day.id} type="button" aria-pressed={selected} disabled={weekendOnly && day.id !== 6 && day.id !== 0 && !selected} onClick={() => chooseDays(selected ? selectedDays.filter((id) => id !== day.id) : [...selectedDays, day.id])}
          className={`rounded border px-2 py-2 text-xs ${selected ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>
          <span className="block font-semibold">{day.label}</span><span className="mt-1 block">{selected ? 'Nhận' : 'Không nhận'}</span>
        </button>
      })}
    </div>
    {!!value.length && <>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" checked={perDay} onChange={(event) => {
          setPerDay(event.target.checked)
          if (!event.target.checked) onChange(value.map((day) => ({ ...day, sessions: commonSessions })))
        }} className="accent-emerald-700" />Thiết lập buổi riêng theo ngày
      </label>
      {(perDay ? DAYS_OF_WEEK.filter((day) => selectedDays.includes(day.id)) : [{ id: -1, label: 'Buổi tiếp nhận cho các ngày đã chọn' }]).map((day) =>
        <div key={day.id} className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">{day.label}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {RECEPTION_SESSIONS.map((session) => <label key={session.code} className="flex items-center gap-2 rounded border border-slate-200 bg-white p-3 text-xs">
              <input type="checkbox" checked={(perDay ? value.find((item) => item.dayOfWeek === day.id)?.sessions || [] : commonSessions).includes(session.code)}
                onChange={() => toggleSession(session.code, perDay ? day.id : undefined)} className="accent-emerald-700" />
              <span><span className="block font-semibold">{session.label}</span><span className="text-slate-500">{session.hours}</span></span>
            </label>)}
          </div>
        </div>,
      )}
    </>}
    <p className="rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{formatReceptionSchedule(value)}</p>
  </fieldset>
}
