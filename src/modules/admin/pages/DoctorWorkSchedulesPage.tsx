'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSchedule, deleteSchedule, listSchedules, updateSchedule } from '../services/schedules'
import { listUsers } from '../services/users'
import { listCatalog } from '../services/systemCatalog'
import { listClinicRooms } from '../services/clinicRooms'

const SLOT_DURATIONS = [15, 20, 30, 45, 60]

const EMPTY_FORM = {
  doctorId: '',
  branchId: '',
  roomId: '',
  workDate: new Date().toISOString().slice(0, 10),
  startTime: '08:00',
  endTime: '12:00',
  slotDurationMin: '30',
  status: 'OPEN',
}

function formatYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonday(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  const diff = date.getDate() - (day === 0 ? 6 : day - 1)
  date.setDate(diff)
  return date
}

function formatDayHeader(date: Date) {
  const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${days[date.getDay()]}\n${d}/${m}`
}

export default function DoctorWorkSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [filterBranch, setFilterBranch] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const weekDays = useMemo(() => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + i)
      dates.push(d)
    }
    return dates
  }, [currentMonday])

  const startDateStr = formatYMD(weekDays[0])
  const endDateStr = formatYMD(weekDays[6])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [resSchedules, resUsers, resBranches, resRooms] = await Promise.all([
        listSchedules({
          doctorId: filterDoctor || undefined,
          branchId: filterBranch || undefined,
        }),
        listUsers(),
        listCatalog('branches').catch(() => []),
        listClinicRooms().catch(() => []),
      ])

      const doctorList = resUsers.data.filter((u: any) => String(u.role || u.userType).toLowerCase() === 'doctor')

      setSchedules(resSchedules)
      setDoctors(doctorList)
      setBranches(resBranches)
      setRooms(resRooms)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được dữ liệu lịch làm việc.')
    } finally {
      setLoading(false)
    }
  }, [filterDoctor, filterBranch])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const prevWeek = () => {
    const prev = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() - 7)
    setCurrentMonday(prev)
  }

  const nextWeek = () => {
    const next = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + 7)
    setCurrentMonday(next)
  }

  const availableRooms = useMemo(() => {
    if (!form.branchId) return rooms
    return rooms.filter((rm) => rm.branchId === form.branchId || rm.branch?.id === form.branchId)
  }, [rooms, form.branchId])

  const schedulesMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const sc of schedules) {
      if (filterBranch && sc.branchId !== filterBranch) continue
      const dateStr = String(sc.workDate).slice(0, 10)
      const docId = sc.doctorId
      const userId = sc.doctor?.userId

      const key1 = `${docId}_${dateStr}`
      if (!map[key1]) map[key1] = []
      map[key1].push(sc)

      if (userId && userId !== docId) {
        const key2 = `${userId}_${dateStr}`
        if (!map[key2]) map[key2] = []
        map[key2].push(sc)
      }
    }
    return map
  }, [schedules, filterBranch])

  const filteredDoctors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return doctors.filter((d) => {
      const docId = d.doctor?.id || d.id
      const userId = d.id
      const fullName = (d.fullName || d.doctor?.fullName || '').toLowerCase()

      if (query && !fullName.includes(query)) {
        return false
      }
      if (filterDoctor && docId !== filterDoctor && userId !== filterDoctor) {
        return false
      }
      if (filterBranch) {
        const hasAssignment = d.branchAssignments?.some((ba: any) => ba.branchId === filterBranch || ba.branch?.id === filterBranch)
        const hasScheduleAtBranch = schedules.some((sc: any) => (sc.doctorId === docId || sc.doctor?.userId === userId) && sc.branchId === filterBranch)
        if (!hasAssignment && !hasScheduleAtBranch) return false
      }
      return true
    })
  }, [doctors, schedules, filterDoctor, filterBranch, searchTerm])

  const openCreate = (doctorId?: string, dateStr?: string) => {
    setSelected(null)
    setForm({
      ...EMPTY_FORM,
      doctorId: doctorId || doctors[0]?.doctor?.id || doctors[0]?.id || '',
      branchId: filterBranch || branches[0]?.id || '',
      workDate: dateStr || new Date().toISOString().slice(0, 10),
    })
    setError('')
    setModal('create')
  }

  const openEdit = (row: any) => {
    setSelected(row)
    setForm({
      doctorId: row.doctorId,
      branchId: row.branchId,
      roomId: row.roomId || '',
      workDate: row.workDate,
      startTime: row.startTime,
      endTime: row.endTime,
      slotDurationMin: String(row.slotDurationMin || 30),
      status: row.status || 'OPEN',
    })
    setError('')
    setModal('edit')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.doctorId || !form.branchId || !form.workDate) {
      return setError('Vui lòng chọn bác sĩ, chi nhánh và ngày làm việc.')
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        doctorId: form.doctorId,
        branchId: form.branchId,
        roomId: form.roomId || null,
        workDate: form.workDate,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMin: Number(form.slotDurationMin) || 30,
        status: form.status,
      }

      if (modal === 'create') await createSchedule(payload)
      else await updateSchedule(selected.id, payload)

      setModal(null)
      await loadData()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không lưu được lịch làm việc.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: any) {
    if (!confirm(`Hủy ca trực ngày ${row.workDate}?`)) return
    try {
      await deleteSchedule(row.id)
      await loadData()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không xóa được ca trực.')
    }
  }

  async function toggleStatus(row: any) {
    const nextStatus = row.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    try {
      await updateSchedule(row.id, { status: nextStatus })
      await loadData()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không đổi được trạng thái ca trực.')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý lịch làm việc</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Lịch làm việc & Ca trực Bác sĩ</h1>
          <p className="mt-1 text-sm text-slate-500">Phân ca trực theo tuần, điều phối phòng làm việc và thời lượng khám.</p>
        </div>
        <button onClick={() => openCreate()} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
          + Xếp lịch làm việc
        </button>
      </div>

      {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'grid' && (
            <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <button onClick={prevWeek} className="rounded px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-xs">
                ‹
              </button>
              <span className="px-2 text-xs font-bold text-slate-800 whitespace-nowrap">
                {startDateStr.split('-').reverse().join('/')} – {endDateStr.split('-').reverse().join('/')}
              </span>
              <button onClick={nextWeek} className="rounded px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-xs">
                ›
              </button>
            </div>
          )}

          <div className="relative">
            <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm tên Bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-36 sm:w-44 rounded-md border border-slate-200 bg-white py-1.5 pl-7 pr-6 text-xs outline-none focus:border-emerald-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1.5 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="max-w-[150px] truncate rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-600"
          >
            <option value="">Tất cả Chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="max-w-[150px] truncate rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-600"
          >
            <option value="">Tất cả Bác sĩ</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.doctor?.id || d.id}>
                {d.academicRank ? `${d.academicRank} ` : ''}{d.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-bold transition ${
                viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lịch Tuần
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Danh Sách
            </button>
          </div>
          <button onClick={() => void loadData()} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
            Làm mới
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <section className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid min-w-[1050px] grid-cols-[220px_repeat(7,1fr)] divide-x divide-y divide-slate-100">
            <div className="bg-slate-50/80 p-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Bác sĩ</span>
              <span className="text-[10px] text-slate-400 font-normal">({filteredDoctors.length})</span>
            </div>

            {weekDays.map((date) => (
              <div key={date.toISOString()} className="bg-slate-50/80 p-3 text-center text-xs font-bold text-slate-700 whitespace-pre-line">
                {formatDayHeader(date)}
              </div>
            ))}

            {loading ? (
              <div className="col-span-8 p-12 text-center text-sm text-slate-400">Đang tải lịch làm việc...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="col-span-8 p-12 text-center text-sm text-slate-400">Không tìm thấy bác sĩ phù hợp.</div>
            ) : (
              filteredDoctors.map((doc) => {
                const docId = doc.doctor?.id || doc.id
                const specName = doc.doctor?.specialties?.[0]?.specialty?.name || '—'
                return (
                  <div key={docId} className="contents">
                    <div className="bg-white p-3.5 flex flex-col justify-center">
                      <b className="text-xs text-slate-900 leading-tight">
                        {doc.academicRank ? `${doc.academicRank} ` : ''}{doc.fullName}
                      </b>
                      <p className="mt-1 text-[10px] font-semibold text-emerald-700">{specName}</p>
                    </div>

                    {weekDays.map((date) => {
                      const dateStr = formatYMD(date)
                      const daySchedules = schedulesMap[`${docId}_${dateStr}`] || schedulesMap[`${doc.id}_${dateStr}`] || []

                      return (
                        <div key={dateStr} className="min-h-[100px] p-2 bg-slate-50/20 hover:bg-slate-50/60 transition group relative">
                          <div className="space-y-1.5">
                            {daySchedules.map((sc) => {
                              const isOpen = sc.status === 'OPEN'
                              return (
                                <div
                                  key={sc.id}
                                  className={`group/card relative rounded-md border p-2 text-[10px] transition shadow-2xs ${
                                    isOpen
                                      ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:border-emerald-400'
                                      : 'border-rose-200 bg-rose-50/80 text-rose-950 hover:border-rose-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <b className="text-xs">
                                      {sc.startTime} – {sc.endTime}
                                    </b>
                                    <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                  </div>
                                  <p className="mt-1 font-medium opacity-85">
                                    {sc.room?.name || sc.room?.code || 'Chưa xếp phòng'}
                                  </p>
                                  <p className="mt-0.5 text-[9px] opacity-70">{sc.slotDurationMin || 30} ph/ca</p>

                                  <div className="mt-2 flex items-center justify-end gap-1.5 pt-1 border-t border-black/5">
                                    <button
                                      onClick={() => openEdit(sc)}
                                      className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 hover:bg-white"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      onClick={() => void toggleStatus(sc)}
                                      className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 hover:bg-white"
                                    >
                                      {isOpen ? 'Khóa' : 'Mở'}
                                    </button>
                                    <button
                                      onClick={() => void remove(sc)}
                                      className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 hover:bg-white"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {daySchedules.length === 0 && (
                            <button
                              onClick={() => openCreate(docId, dateStr)}
                              className="mt-1 w-full rounded-md border border-dashed border-slate-200 bg-white/70 py-3.5 text-[10px] font-bold text-slate-400 shadow-2xs transition hover:border-emerald-500 hover:bg-emerald-50/90 hover:text-emerald-700"
                            >
                              + Xếp lịch
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </section>
      ) : (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  {['Bác sĩ', 'Chi nhánh & Phòng', 'Ngày làm việc', 'Khung giờ ca trực', 'Thời lượng/Ca', 'Trạng thái', 'Thao tác'].map((x) => (
                    <th key={x} className={`px-5 py-3 ${x === 'Thao tác' ? 'text-right' : ''}`}>
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                      Đang tải dữ liệu ca trực…
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                      Chưa có ca làm việc nào được xếp.
                    </td>
                  </tr>
                ) : (
                  schedules.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-bold text-slate-900">
                        {row.doctor?.academicRank ? `${row.doctor.academicRank} ` : ''}{row.doctor?.fullName || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-700">{row.branch?.name || 'Chi nhánh chính'}</p>
                        <p className="text-xs text-emerald-800">{row.room?.name || row.room?.code || 'Chưa xếp phòng'}</p>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-800">{row.workDate}</td>
                      <td className="px-5 py-3 text-xs font-bold text-emerald-900">
                        {row.startTime} – {row.endTime}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{row.slotDurationMin || 30} phút / ca</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${row.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {row.status === 'OPEN' ? 'Đang mở đặt' : 'Đã đóng ca'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(row)} className="rounded border border-slate-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50">
                            Sửa
                          </button>
                          <button onClick={() => void toggleStatus(row)} className="rounded border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                            {row.status === 'OPEN' ? 'Đóng ca' : 'Mở ca'}
                          </button>
                          <button onClick={() => void remove(row)} className="rounded border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4">
          <form onSubmit={submit} className="my-8 w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <b className="text-base text-slate-900">{modal === 'create' ? 'Xếp ca làm việc mới' : 'Cập nhật ca làm việc'}</b>
              <button type="button" onClick={() => setModal(null)} className="text-xl font-bold text-slate-400 hover:text-slate-600">
                ×
              </button>
            </header>

            <div className="space-y-4 p-6">
              <label className="block text-xs font-bold text-slate-700">
                Bác sĩ <span className="text-rose-500">*</span>
                <select
                  required
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.doctor?.id || d.id}>
                      {d.academicRank ? `${d.academicRank} ` : ''}{d.fullName} ({d.email})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  Chi nhánh làm việc <span className="text-rose-500">*</span>
                  <select
                    required
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Chọn chi nhánh --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Phòng khám làm việc
                  <select
                    value={form.roomId}
                    onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Chọn phòng khám --</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || r.code}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-bold text-slate-700">
                  Ngày làm việc <span className="text-rose-500">*</span>
                  <input
                    type="date"
                    required
                    value={form.workDate}
                    onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Giờ bắt đầu
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Giờ kết thúc
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  Thời lượng 1 ca khám
                  <select
                    value={form.slotDurationMin}
                    onChange={(e) => setForm({ ...form, slotDurationMin: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  >
                    {SLOT_DURATIONS.map((dur) => (
                      <option key={dur} value={dur}>
                        {dur} phút / ca
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Trạng thái ca trực
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  >
                    <option value="OPEN">Mở cho đặt hẹn (OPEN)</option>
                    <option value="CLOSED">Đóng ca (CLOSED)</option>
                  </select>
                </label>
              </div>
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                type="submit"
                className="rounded-md bg-emerald-700 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving ? 'Đang lưu…' : 'Lưu ca làm việc'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  )
}
