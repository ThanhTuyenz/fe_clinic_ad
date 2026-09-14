'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { listReceptionAppointments } from '../services/appointments'
import { listCatalog } from '../services/systemCatalog'
import { listDoctors } from '../services/doctors'
import { appointmentSourceLabel } from '../utils/appointmentSource'
import {
  doctorDisplayName,
  formatDateVi,
  formatExamTimeLine,
  patientListDisplayName,
  receptionStatusMeta,
  ymd,
} from '../components/reception/receptionHelpers'

type AppointmentRow = Record<string, any>

const STATUS_OPTIONS = [
  ['all', 'Tất cả trạng thái'],
  ['pending', 'Chờ xử lý'],
  ['confirmed', 'Đã xác nhận / đang khám'],
  ['examined', 'Đã khám'],
  ['cancelled', 'Đã hủy'],
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  booked: 'bg-sky-50 text-sky-700',
  'checked-in': 'bg-emerald-50 text-emerald-700',
  examining: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-rose-50 text-rose-700',
}

function shiftDays(base: string, days: number) {
  const date = new Date(`${base}T00:00:00`)
  date.setDate(date.getDate() + days)
  return ymd(date)
}

export default function AdminAppointmentsPage() {
  const today = ymd(new Date())
  const [rows, setRows] = useState<AppointmentRow[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [status, setStatus] = useState('all')
  const [branchId, setBranchId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<AppointmentRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [appointments, branchRows, doctorRows] = await Promise.all([
        listReceptionAppointments({ from: fromDate, to: toDate, status }),
        listCatalog('branches').catch(() => []),
        listDoctors().catch(() => []),
      ])
      setRows(appointments || [])
      setBranches(branchRows || [])
      const byId = new Map<string, any>()
      for (const doctor of doctorRows || []) {
        if (doctor?.id) byId.set(String(doctor.id), doctor)
      }
      for (const row of appointments || []) {
        if (row?.doctor?.id && !byId.has(String(row.doctor.id))) byId.set(String(row.doctor.id), row.doctor)
      }
      setDoctors([...byId.values()])
    } catch (cause: any) {
      setError(cause?.message || 'Không tải được danh sách lịch hẹn.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, status])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((row) => {
      if (branchId && row.branch?.id !== branchId) return false
      if (doctorId && String(row.doctor?.id || '') !== doctorId) return false
      if (!term) return true
      const haystack = [
        row.ticket,
        row.bookingCode,
        patientListDisplayName(row.patient),
        row.patient?.phone,
        row.patient?.email,
        doctorDisplayName(row.doctor),
        row.branch?.name,
        row.clinicRoomName,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [rows, branchId, doctorId, q])

  const stats = useMemo(() => {
    const counts = { total: filtered.length, pending: 0, confirmed: 0, examined: 0, cancelled: 0 }
    for (const row of filtered) {
      const key = String(row.status || 'pending').toLowerCase()
      if (key in counts) counts[key as keyof typeof counts] += 1
    }
    return counts
  }, [filtered])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý lịch khám</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Danh sách lịch hẹn</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi và lọc lịch trên toàn hệ thống. Hủy lịch do bệnh nhân hoặc nhân viên tiếp nhận thực hiện.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFromDate(today); setToDate(today) }} className="rounded-md border px-3 py-2 text-xs font-bold">
            Hôm nay
          </button>
          <button onClick={() => { setFromDate(shiftDays(today, -6)); setToDate(today) }} className="rounded-md border px-3 py-2 text-xs font-bold">
            7 ngày
          </button>
          <button onClick={() => void load()} className="rounded-md border px-3 py-2 text-xs font-bold">
            Làm mới
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Tổng lịch', stats.total, 'text-slate-900'],
          ['Chờ xử lý', stats.pending, 'text-amber-700'],
          ['Đã xác nhận', stats.confirmed, 'text-sky-700'],
          ['Đã khám', stats.examined, 'text-emerald-700'],
          ['Đã hủy', stats.cancelled, 'text-rose-600'],
        ].map(([label, value, tone]) => (
          <article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`mt-2 text-2xl font-extrabold ${tone}`}>{loading ? '—' : value}</p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b p-4">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
            <option value="">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
            <option value="">Tất cả bác sĩ</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.fullName || doctor.name || doctor.displayName}
              </option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Tìm mã vé, bệnh nhân, SĐT..."
            className="min-w-[220px] flex-1 rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Mã vé', 'Bệnh nhân', 'Thời gian', 'Bác sĩ', 'Chi nhánh / phòng', 'Trạng thái', 'Thao tác'].map((label) => (
                  <th key={label} className="px-5 py-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    Đang tải danh sách lịch hẹn…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    Không có lịch hẹn phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const meta = receptionStatusMeta(row)
                  return (
                    <tr key={row.id} className="border-t">
                      <td className="px-5 py-3">
                        <b className="font-mono text-emerald-800">{row.ticket || row.bookingCode || '—'}</b>
                        <p className="mt-1 text-[11px] text-slate-400">{appointmentSourceLabel(row)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <b className="text-slate-900">{patientListDisplayName(row.patient)}</b>
                        <p className="mt-1 text-xs text-slate-400">{row.patient?.phone || '—'}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{formatDateVi(row.appointmentDate)}</p>
                        <p className="mt-1 text-xs text-emerald-700">{formatExamTimeLine(row.startTime, row.endTime)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{doctorDisplayName(row.doctor)}</p>
                        <p className="mt-1 text-xs text-slate-400">{row.specialty?.name || row.doctor?.specialtyName || '—'}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{row.branch?.name || '—'}</p>
                        <p className="mt-1 text-xs text-slate-400">{row.clinicRoomName || 'Chưa chọn phòng'}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_BADGE[meta.tone] || 'bg-slate-100 text-slate-600'}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button onClick={() => { setSelected(row); setError('') }} className="rounded border px-3 py-1.5 text-xs">
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t px-5 py-3 text-xs text-slate-400">Tổng cộng {filtered.length} lịch hẹn</footer>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="my-6 w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Chi tiết lịch hẹn</p>
                <h2 className="mt-1 font-bold text-slate-900">{selected.ticket || selected.bookingCode}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-xl text-slate-400">
                ×
              </button>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ['Bệnh nhân', patientListDisplayName(selected.patient)],
                ['Số điện thoại', selected.patient?.phone || '—'],
                ['Bác sĩ', doctorDisplayName(selected.doctor)],
                ['Chuyên khoa', selected.specialty?.name || selected.doctor?.specialtyName || '—'],
                ['Ngày khám', formatDateVi(selected.appointmentDate)],
                ['Khung giờ', formatExamTimeLine(selected.startTime, selected.endTime)],
                ['Chi nhánh', selected.branch?.name || '—'],
                ['Phòng', selected.clinicRoomName || 'Chưa chọn phòng'],
                ['Nguồn đặt', appointmentSourceLabel(selected)],
                ['Gói / dịch vụ', selected.servicePackage?.name || selected.bookingMethod?.name || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <footer className="flex justify-end border-t px-5 py-4">
              <button type="button" onClick={() => setSelected(null)} className="rounded border px-4 py-2 text-sm">
                Đóng
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
