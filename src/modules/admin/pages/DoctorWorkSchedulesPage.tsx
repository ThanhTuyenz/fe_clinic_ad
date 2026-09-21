'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSchedule, deleteSchedule, listSchedules, updateSchedule } from '../services/schedules'
import { listUsers } from '../services/users'
import { listCatalog } from '../services/systemCatalog'
import { listClinicRooms } from '../services/clinicRooms'
import DoctorLeaveModal from '../components/schedules/DoctorLeaveModal'
import { Search, Calendar, List, Plus, RefreshCw, Bot } from 'lucide-react'
import {
  AdminButton,
  AdminPageHeader,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminModal,
  AdminInput,
  AdminSelect,
  StatusBadge,
} from '@/common/components/ui'

const SCHEDULE_TABLE_COLUMNS = [
  { label: 'Bác sĩ' },
  { label: 'Chi nhánh & Phòng' },
  { label: 'Ngày' },
  { label: 'Khung giờ' },
  { label: 'Thời lượng' },
  { label: 'Trạng thái' },
  { label: 'Thao tác', align: 'right' as const },
]

const SLOT_DURATIONS = [15, 20, 30, 45, 60]
const EMPTY_FORM = { doctorId: '', branchId: '', roomId: '', workDate: new Date().toISOString().slice(0, 10), startTime: '08:00', endTime: '12:00', slotDurationMin: '30', status: 'OPEN' }

const formatYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const getMonday = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

const formatDayHeader = (d: Date) => {
  const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return `${days[d.getDay()]}\n${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
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
  const [doctorLeaveOpen, setDoctorLeaveOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + i)), [currentMonday])
  const startDateStr = formatYMD(weekDays[0])
  const endDateStr = formatYMD(weekDays[6])

  const loadData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [scRes, uRes, bRes, rRes] = await Promise.all([
        listSchedules({ doctorId: filterDoctor || undefined, branchId: filterBranch || undefined }),
        listUsers(),
        listCatalog('branches').catch(() => []),
        listClinicRooms().catch(() => []),
      ])
      setSchedules(scRes || [])
      setDoctors(uRes.data.filter((u: any) => String(u.role || u.userType).toLowerCase() === 'doctor'))
      setBranches(bRes || []); setRooms(rRes || [])
    } catch (e: any) { setError(e?.message || 'Không tải được lịch làm việc.') }
    finally { setLoading(false) }
  }, [filterDoctor, filterBranch])

  useEffect(() => { void loadData() }, [loadData])

  const availableRooms = useMemo(() => {
    if (!form.branchId) return rooms
    return rooms.filter((rm) => rm.branchId === form.branchId || rm.branch?.id === form.branchId)
  }, [rooms, form.branchId])

  const schedulesMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    schedules.forEach((sc) => {
      if (filterBranch && sc.branchId !== filterBranch) return
      const dStr = String(sc.workDate).slice(0, 10)
      const k1 = `${sc.doctorId}_${dStr}`
      if (!map[k1]) map[k1] = []
      map[k1].push(sc)
      if (sc.doctor?.userId && sc.doctor?.userId !== sc.doctorId) {
        const k2 = `${sc.doctor.userId}_${dStr}`
        if (!map[k2]) map[k2] = []
        map[k2].push(sc)
      }
    })
    return map
  }, [schedules, filterBranch])

  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return doctors.filter((d) => {
      const dId = d.doctor?.id || d.id
      const uId = d.id
      const name = (d.fullName || d.doctor?.fullName || '').toLowerCase()
      if (q && !name.includes(q)) return false
      if (filterDoctor && dId !== filterDoctor && uId !== filterDoctor) return false
      if (filterBranch) {
        const hasA = d.branchAssignments?.some((ba: any) => ba.branchId === filterBranch || ba.branch?.id === filterBranch)
        const hasS = schedules.some((sc: any) => (sc.doctorId === dId || sc.doctor?.userId === uId) && sc.branchId === filterBranch)
        if (!hasA && !hasS) return false
      }
      return true
    })
  }, [doctors, schedules, filterDoctor, filterBranch, searchTerm])

  const openCreate = (doctorId?: string, dateStr?: string) => {
    setSelected(null)
    setForm({ ...EMPTY_FORM, doctorId: doctorId || doctors[0]?.doctor?.id || doctors[0]?.id || '', branchId: filterBranch || branches[0]?.id || '', workDate: dateStr || formatYMD(new Date()) })
    setError(''); setModal('create')
  }

  const openEdit = (row: any) => {
    setSelected(row)
    setForm({ doctorId: row.doctorId, branchId: row.branchId, roomId: row.roomId || '', workDate: row.workDate, startTime: row.startTime, endTime: row.endTime, slotDurationMin: String(row.slotDurationMin || 30), status: row.status || 'OPEN' })
    setError(''); setModal('edit')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.doctorId || !form.branchId || !form.workDate) return setError('Vui lòng chọn bác sĩ, chi nhánh và ngày.')
    setSaving(true); setError('')
    try {
      const payload = { ...form, roomId: form.roomId || null, slotDurationMin: Number(form.slotDurationMin) || 30 }
      if (modal === 'create') await createSchedule(payload)
      else await updateSchedule(selected.id, payload)
      setModal(null); await loadData()
    } catch (err: any) { setError(err?.message || 'Không lưu được lịch làm việc.') }
    finally { setSaving(false) }
  }

  const remove = async (row: any) => {
    if (!confirm(`Hủy ca trực ngày ${row.workDate}?`)) return
    try { await deleteSchedule(row.id); await loadData() }
    catch (e: any) { setError(e?.message || 'Không xóa được ca trực.') }
  }

  const toggleStatus = async (row: any) => {
    try { await updateSchedule(row.id, { status: row.status === 'OPEN' ? 'CLOSED' : 'OPEN' }); await loadData() }
    catch (e: any) { setError(e?.message || 'Không đổi được trạng thái.') }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý lịch làm việc"
        title="Lịch làm việc & Ca trực Bác sĩ"
        description="Phân ca trực theo tuần, điều phối phòng làm việc và thời lượng khám."
      >
        <div className="flex items-center gap-2">
          <AdminButton
            variant="outline"
            icon={Bot}
            onClick={() => setDoctorLeaveOpen(true)}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            AI Báo Bác sĩ nghỉ & Đổi lịch
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => openCreate()}
          >
            Xếp lịch làm việc
          </AdminButton>
        </div>
      </AdminPageHeader>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'grid' && (
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button onClick={() => setCurrentMonday(new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() - 7))} className="rounded px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer">‹</button>
              <span className="px-2 text-xs font-bold text-slate-800 whitespace-nowrap">{startDateStr.split('-').reverse().join('/')} – {endDateStr.split('-').reverse().join('/')}</span>
              <button onClick={() => setCurrentMonday(new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + 7))} className="rounded px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white cursor-pointer">›</button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input placeholder="Tìm bác sĩ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-36 sm:w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2.5 text-xs outline-none focus:border-emerald-600" />
          </div>
          <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="max-w-[150px] truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-600">
            <option value="">Tất cả Chi nhánh</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="max-w-[150px] truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-emerald-600">
            <option value="">Tất cả Bác sĩ</option>
            {doctors.map((d) => <option key={d.id} value={d.doctor?.id || d.id}>{d.academicRank ? `${d.academicRank} ` : ''}{d.fullName}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button onClick={() => setViewMode('grid')} className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold cursor-pointer ${viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'}`}><Calendar className="h-3.5 w-3.5" /> Lịch Tuần</button>
            <button onClick={() => setViewMode('table')} className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold cursor-pointer ${viewMode === 'table' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'}`}><List className="h-3.5 w-3.5" /> Danh Sách</button>
          </div>
          <AdminButton
            variant="secondary"
            size="xs"
            icon={RefreshCw}
            loading={loading}
            onClick={() => void loadData()}
          >
            Làm mới
          </AdminButton>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <section className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="grid min-w-[1050px] grid-cols-[220px_repeat(7,1fr)] divide-x divide-y divide-slate-100">
            <div className="bg-slate-50/80 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
              <span>Bác sĩ</span><span className="text-[10px] text-slate-400 font-normal">({filteredDoctors.length})</span>
            </div>
            {weekDays.map((date) => (
              <div key={date.toISOString()} className="bg-slate-50/80 p-2.5 text-center text-xs font-bold text-slate-700 whitespace-pre-line">{formatDayHeader(date)}</div>
            ))}

            {loading ? (
              <div className="col-span-8 p-12 text-center text-sm text-slate-400">Đang tải lịch làm việc...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="col-span-8 p-12 text-center text-sm text-slate-400">Không tìm thấy bác sĩ phù hợp.</div>
            ) : (
              filteredDoctors.map((doc) => {
                const docId = doc.doctor?.id || doc.id
                return (
                  <div key={docId} className="contents">
                    <div className="bg-white p-3 flex flex-col justify-center">
                      <b className="text-xs text-slate-900 leading-tight">{doc.academicRank ? `${doc.academicRank} ` : ''}{doc.fullName}</b>
                      <p className="mt-1 text-[10px] font-semibold text-emerald-700">{doc.doctor?.specialties?.[0]?.specialty?.name || '—'}</p>
                    </div>
                    {weekDays.map((date) => {
                      const dStr = formatYMD(date)
                      const daySc = schedulesMap[`${docId}_${dStr}`] || []
                      return (
                        <div key={dStr} className="min-h-[90px] p-1.5 bg-slate-50/20 hover:bg-slate-50/60 transition group relative">
                          <div className="space-y-1">
                            {daySc.map((sc) => {
                              const isOpen = sc.status === 'OPEN'
                              return (
                                <div key={sc.id} className={`p-1.5 rounded-lg border text-[10px] transition shadow-2xs ${isOpen ? 'border-emerald-200 bg-emerald-50/90 text-emerald-950' : 'border-rose-200 bg-rose-50/90 text-rose-950'}`}>
                                  <div className="flex items-center justify-between font-bold">
                                    <span>{sc.startTime} – {sc.endTime}</span>
                                    <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                                  </div>
                                  <p className="mt-0.5 font-medium truncate">{sc.room?.name || sc.room?.code || 'Chưa xếp phòng'}</p>
                                  <div className="mt-1 flex items-center justify-end gap-1 pt-1 border-t border-black/5">
                                    <button onClick={() => openEdit(sc)} className="rounded px-1 text-[9px] font-semibold hover:bg-white cursor-pointer">Sửa</button>
                                    <button onClick={() => void toggleStatus(sc)} className="rounded px-1 text-[9px] font-semibold text-amber-700 hover:bg-white cursor-pointer">{isOpen ? 'Khóa' : 'Mở'}</button>
                                    <button onClick={() => void remove(sc)} className="rounded px-1 text-[9px] font-semibold text-rose-700 hover:bg-white cursor-pointer">Xóa</button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {daySc.length === 0 && (
                            <button onClick={() => openCreate(docId, dStr)} className="mt-1 w-full rounded border border-dashed border-slate-200 py-2.5 text-[10px] font-semibold text-slate-400 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">+ Lịch</button>
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
        <AdminTableCard className="mt-4">
          <AdminTable minWidth="min-w-[850px]">
            <AdminTableHead columns={SCHEDULE_TABLE_COLUMNS} />
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <AdminTableLoading colSpan={7} message="Đang tải lịch…" />
              ) : schedules.length === 0 ? (
                <AdminTableEmpty colSpan={7} message="Chưa có ca trực nào." />
              ) : (
                schedules.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {row.doctor?.academicRank ? `${row.doctor.academicRank} ` : ''}{row.doctor?.fullName || '—'}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <p className="font-semibold text-slate-700">{row.branch?.name || 'Chi nhánh'}</p>
                      <p className="text-emerald-800">{row.room?.name || 'Chưa xếp phòng'}</p>
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-800">{row.workDate}</td>
                    <td className="px-5 py-3 text-xs font-bold text-emerald-900">{row.startTime} – {row.endTime}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{row.slotDurationMin || 30} ph/ca</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge
                        status={row.status === 'OPEN' ? 'open' : 'closed'}
                        label={row.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                        tone={row.status === 'OPEN' ? 'emerald' : 'rose'}
                      />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <AdminButton variant="secondary" size="xs" onClick={() => openEdit(row)}>
                          Sửa
                        </AdminButton>
                        <AdminButton
                          variant="outline"
                          size="xs"
                          className={row.status === 'OPEN' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}
                          onClick={() => void toggleStatus(row)}
                        >
                          {row.status === 'OPEN' ? 'Đóng' : 'Mở'}
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          size="xs"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => void remove(row)}
                        >
                          Xóa
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </AdminTable>
        </AdminTableCard>
      )}

      {/* CREATE / EDIT MODAL */}
      <AdminModal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Xếp ca làm việc mới' : 'Cập nhật ca làm việc'}
        loading={saving}
      >
        <form onSubmit={submit} className="space-y-3.5">
          <AdminSelect
            label="Bác sĩ"
            required
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
          >
            <option value="">-- Chọn bác sĩ --</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.doctor?.id || d.id}>
                {d.academicRank ? `${d.academicRank} ` : ''}{d.fullName}
              </option>
            ))}
          </AdminSelect>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminSelect
              label="Chi nhánh"
              required
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              <option value="">-- Chọn chi nhánh --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Phòng khám"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            >
              <option value="">-- Chọn phòng khám --</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name || r.code}</option>
              ))}
            </AdminSelect>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <AdminInput
              label="Ngày làm việc"
              type="date"
              required
              value={form.workDate}
              onChange={(e) => setForm({ ...form, workDate: e.target.value })}
            />
            <AdminInput
              label="Bắt đầu"
              type="time"
              required
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <AdminInput
              label="Kết thúc"
              type="time"
              required
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminSelect
              label="Thời lượng 1 ca"
              value={form.slotDurationMin}
              onChange={(e) => setForm({ ...form, slotDurationMin: e.target.value })}
            >
              {SLOT_DURATIONS.map((d) => (
                <option key={d} value={d}>{d} phút / ca</option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Trạng thái"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="OPEN">Mở cho đặt hẹn (OPEN)</option>
              <option value="CLOSED">Đóng ca (CLOSED)</option>
            </AdminSelect>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <AdminButton
              variant="secondary"
              disabled={saving}
              onClick={() => setModal(null)}
            >
              Hủy
            </AdminButton>
            <AdminButton
              variant="primary"
              type="submit"
              loading={saving}
            >
              Lưu ca làm việc
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      <DoctorLeaveModal isOpen={doctorLeaveOpen} onClose={() => setDoctorLeaveOpen(false)} doctors={doctors} onSuccess={loadData} />
    </>
  )
}
