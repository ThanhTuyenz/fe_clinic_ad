'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, RefreshCw, AlertCircle, Eye, CalendarX, RotateCcw, Search, Plus } from 'lucide-react'
import {
  AdminButton,
  AdminIconButton,
  AdminPageHeader,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminTableFooter,
  AdminModal,
  StatusBadge,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from '@/common/components/ui'
import {
  createAppointmentReception,
  getAvailability,
  listReceptionAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
} from '../services/appointmentsService'
import { listCatalog } from '@/modules/catalog'
import { listDoctors } from '@/modules/admin/services/doctors'
import { appointmentSourceLabel } from '@/modules/admin/utils/appointmentSource'
import {
  doctorDisplayName,
  formatDateVi,
  formatExamTimeLine,
  patientListDisplayName,
  receptionStatusMeta,
  ymd,
} from '@/modules/reception'

type AppointmentRow = Record<string, any>

const STATUS_OPTIONS = [
  ['all', 'Tất cả trạng thái'],
  ['pending', 'Chờ xử lý'],
  ['confirmed', 'Đã xác nhận / khám'],
  ['examined', 'Đã khám'],
  ['cancelled', 'Đã hủy'],
]

const shiftDays = (base: string, days: number) => {
  const d = new Date(`${base}T00:00:00`)
  d.setDate(d.getDate() + days)
  return ymd(d)
}

const TABLE_COLUMNS = [
  'Mã vé / Đặt hẹn',
  'Bệnh nhân',
  'Thời gian khám',
  'Bác sĩ & Phòng',
  'Trạng thái',
  { label: 'Thao tác', align: 'right' as const },
]

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
  const [successMsg, setSuccessMsg] = useState('')

  const [selected, setSelected] = useState<AppointmentRow | null>(null)
  const [activeModal, setActiveModal] = useState<'create' | 'reschedule' | 'cancel' | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const [createForm, setCreateForm] = useState({
    patientPhoneOrEmail: '',
    patientName: '',
    branchId: '',
    doctorId: '',
    appointmentDate: today,
    startTime: '',
    note: '',
  })
  const [createSlots, setCreateSlots] = useState<any[]>([])
  const [createSlotsLoading, setCreateSlotsLoading] = useState(false)

  const [rescheduleDate, setRescheduleDate] = useState(today)
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([])
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [rescheduleNote, setRescheduleNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  // Load branches & doctors static catalog once on mount
  useEffect(() => {
    Promise.all([
      listCatalog('branches').catch(() => []),
      listDoctors().catch(() => []),
    ]).then(([bRows, dRows]) => {
      setBranches(bRows || [])
      const byId = new Map<string, any>()
      ;(dRows || []).forEach((d: any) => {
        if (d?.id) byId.set(String(d.id), d)
      })
      setDoctors([...byId.values()])
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const appts = await listReceptionAppointments({ from: fromDate, to: toDate, status, q: undefined })
      setRows(appts || [])
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh sách lịch hẹn.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (activeModal !== 'create' || !createForm.doctorId || !createForm.appointmentDate) {
      setCreateSlots([])
      return
    }
    let cancel = false
    setCreateSlotsLoading(true)
    getAvailability({ doctorId: createForm.doctorId, date: createForm.appointmentDate })
      .then((res: any) => {
        if (!cancel) setCreateSlots(Array.isArray(res) ? res : res?.slots || [])
      })
      .catch(() => {
        if (!cancel) setCreateSlots([])
      })
      .finally(() => {
        if (!cancel) setCreateSlotsLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [activeModal, createForm.doctorId, createForm.appointmentDate])

  useEffect(() => {
    if (activeModal !== 'reschedule' || !rescheduleDoctorId || !rescheduleDate) {
      setRescheduleSlots([])
      return
    }
    let cancel = false
    setRescheduleSlotsLoading(true)
    getAvailability({ doctorId: rescheduleDoctorId, date: rescheduleDate })
      .then((res: any) => {
        if (!cancel) setRescheduleSlots(Array.isArray(res) ? res : res?.slots || [])
      })
      .catch(() => {
        if (!cancel) setRescheduleSlots([])
      })
      .finally(() => {
        if (!cancel) setRescheduleSlotsLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [activeModal, rescheduleDoctorId, rescheduleDate])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((row) => {
      if (branchId && row.branch?.id !== branchId) return false
      if (doctorId && String(row.doctor?.id || '') !== doctorId) return false
      if (!term) return true
      const h = [
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
      return h.includes(term)
    })
  }, [rows, branchId, doctorId, q])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.patientPhoneOrEmail.trim() || !createForm.doctorId || !createForm.startTime) {
      return setModalError('Vui lòng điền đủ thông tin bắt buộc.')
    }
    setModalLoading(true)
    setModalError('')
    try {
      await createAppointmentReception({
        patientEmailOrPhone: createForm.patientPhoneOrEmail.trim(),
        patient: createForm.patientName.trim() ? { fullName: createForm.patientName.trim() } : null,
        doctorId: createForm.doctorId,
        appointmentDate: createForm.appointmentDate,
        startTime: createForm.startTime,
        note: createForm.note.trim() || undefined,
      })
      setSuccessMsg('Đã tạo lịch hẹn mới.')
      setTimeout(() => setSuccessMsg(''), 3500)
      setActiveModal(null)
      await load()
    } catch (err: any) {
      setModalError(err?.message || 'Tạo lịch hẹn thất bại.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !selectedSlotId) return setModalError('Vui lòng chọn khung giờ trống.')
    setModalLoading(true)
    setModalError('')
    try {
      await rescheduleAppointment({
        appointmentId: selected.id,
        newSlotId: selectedSlotId,
        note: rescheduleNote.trim() || 'Dời lịch bởi Admin',
      })
      setSuccessMsg('Đã dời lịch khám thành công.')
      setTimeout(() => setSuccessMsg(''), 3500)
      setActiveModal(null)
      setSelected(null)
      await load()
    } catch (err: any) {
      setModalError(err?.message || 'Dời lịch khám thất bại.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !cancelReason.trim()) return setModalError('Vui lòng nhập lý do hủy lịch.')
    setModalLoading(true)
    setModalError('')
    try {
      await updateAppointmentStatus({
        appointmentId: selected.id,
        status: 'cancelled',
        cancelReason: cancelReason.trim(),
      })
      setSuccessMsg('Đã hủy lịch khám.')
      setTimeout(() => setSuccessMsg(''), 3500)
      setActiveModal(null)
      setSelected(null)
      await load()
    } catch (err: any) {
      setModalError(err?.message || 'Hủy lịch thất bại.')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý lịch khám"
        title="Danh sách lịch hẹn"
        description="Theo dõi, đặt nhanh, dời lịch và hủy lịch khám trên toàn hệ thống."
      >
        <AdminButton
          variant={fromDate === today && toDate === today ? 'primary' : 'secondary'}
          onClick={() => {
            setFromDate(today)
            setToDate(today)
          }}
        >
          Hôm nay
        </AdminButton>
        <AdminButton
          variant={fromDate === shiftDays(today, -6) && toDate === today ? 'primary' : 'secondary'}
          onClick={() => {
            setFromDate(shiftDays(today, -6))
            setToDate(today)
          }}
        >
          7 ngày
        </AdminButton>
        <AdminButton
          variant={!fromDate && !toDate ? 'primary' : 'secondary'}
          onClick={() => {
            setFromDate('')
            setToDate('')
          }}
        >
          Tất cả các ngày
        </AdminButton>
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          loading={loading}
          onClick={() => void load()}
        >
          Làm mới
        </AdminButton>
        <AdminButton
          variant="primary"
          icon={Plus}
          onClick={() => {
            setCreateForm({
              patientPhoneOrEmail: '',
              patientName: '',
              branchId: branches[0]?.id || '',
              doctorId: doctors[0]?.id || '',
              appointmentDate: today,
              startTime: '',
              note: '',
            })
            setModalError('')
            setActiveModal('create')
          }}
        >
          Đặt lịch nhanh
        </AdminButton>
      </AdminPageHeader>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
          {successMsg}
        </div>
      )}

      <AdminTableCard className="mt-5">
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Khoảng ngày khám */}
            <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs">
              <span className="text-slate-400 font-medium whitespace-nowrap">Từ:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              />
              <span className="text-slate-300">→</span>
              <span className="text-slate-400 font-medium whitespace-nowrap">Đến:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              />
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('')
                    setToDate('')
                  }}
                  title="Xem tất cả ngày"
                  className="text-slate-400 hover:text-slate-600 ml-1 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Trạng thái */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs rounded border border-slate-200 px-3 py-1.5 bg-white text-slate-700 font-medium cursor-pointer shadow-2xs"
            >
              {STATUS_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>

            {/* Cơ sở */}
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="text-xs rounded border border-slate-200 px-3 py-1.5 bg-white text-slate-700 font-medium cursor-pointer shadow-2xs max-w-[180px] truncate"
            >
              <option value="">Tất cả cơ sở</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Bác sĩ */}
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="text-xs rounded border border-slate-200 px-3 py-1.5 bg-white text-slate-700 font-medium cursor-pointer shadow-2xs max-w-[200px] truncate"
            >
              <option value="">Tất cả bác sĩ</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {doctorDisplayName(d)}
                </option>
              ))}
            </select>

            {/* Ô tìm kiếm */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm mã vé, tên bệnh nhân, SĐT..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white shadow-2xs"
              />
            </div>
          </div>
        </div>

        <AdminTable minWidth="min-w-[850px]">
          <AdminTableHead columns={TABLE_COLUMNS} />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <AdminTableLoading colSpan={6} message="Đang tải dữ liệu lịch hẹn…" />
            ) : filtered.length === 0 ? (
              <AdminTableEmpty colSpan={6} message="Không có lịch hẹn nào phù hợp." />
            ) : (
              filtered.map((row) => {
                const meta = receptionStatusMeta(row.status)
                const canAct =
                  row.status !== 'cancelled' &&
                  row.status !== 'examined' &&
                  row.status !== 'completed'
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {row.ticket || row.bookingCode || '—'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {appointmentSourceLabel(row)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <strong className="font-semibold text-slate-900 block">
                        {patientListDisplayName(row.patient)}
                      </strong>
                      <p className="text-xs text-slate-400 font-mono">
                        {row.patient?.phone || row.patient?.email || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">
                      <div className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatExamTimeLine(row.startTime, row.endTime)}
                      </div>
                      <p className="text-slate-400 mt-0.5">{formatDateVi(row.appointmentDate)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <p className="font-semibold text-slate-800">{doctorDisplayName(row.doctor)}</p>
                      <p className="text-slate-500 mt-0.5">
                        {row.clinicRoomName || row.clinicRoom?.name || row.branch?.name || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={String(row.status)}>{meta.label}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <AdminIconButton
                          icon={Eye}
                          title="Chi tiết"
                          tone="emerald"
                          onClick={() => setSelected(row)}
                        />
                        {canAct && (
                          <>
                            <AdminIconButton
                              icon={RotateCcw}
                              title="Dời lịch"
                              tone="blue"
                              onClick={() => {
                                setSelected(row)
                                setRescheduleDoctorId(
                                  String(row.doctor?.id || doctors[0]?.id || '')
                                )
                                setRescheduleDate(
                                  row.appointmentDate
                                    ? String(row.appointmentDate).slice(0, 10)
                                    : today
                                )
                                setSelectedSlotId('')
                                setRescheduleNote('')
                                setModalError('')
                                setActiveModal('reschedule')
                              }}
                            />
                            <AdminIconButton
                              icon={CalendarX}
                              title="Hủy lịch"
                              tone="rose"
                              onClick={() => {
                                setSelected(row)
                                setCancelReason('')
                                setModalError('')
                                setActiveModal('cancel')
                              }}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </AdminTable>
        <AdminTableFooter total={filtered.length} label="lịch hẹn" />
      </AdminTableCard>

      {/* DETAIL MODAL */}
      <AdminModal
        isOpen={Boolean(selected && !activeModal)}
        onClose={() => setSelected(null)}
        eyebrow="Chi tiết lịch hẹn"
        title={selected ? selected.ticket || selected.bookingCode : ''}
        footer={
          <AdminButton variant="secondary" onClick={() => setSelected(null)}>
            Đóng
          </AdminButton>
        }
      >
        {selected && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Bệnh nhân:</span>
              <span className="font-semibold text-slate-800">
                {patientListDisplayName(selected.patient)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Số điện thoại:</span>
              <span className="font-semibold text-slate-800">
                {selected.patient?.phone || '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Bác sĩ khám:</span>
              <span className="font-semibold text-slate-800">
                {doctorDisplayName(selected.doctor)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Cơ sở / Phòng:</span>
              <span className="font-semibold text-slate-800">
                {selected.branch?.name} - {selected.clinicRoomName || '—'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Thời gian:</span>
              <span className="font-semibold text-slate-800">
                {formatExamTimeLine(selected)} ({formatDateVi(selected.appointmentDate)})
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Trạng thái:</span>
              <StatusBadge status={String(selected.status)}>
                {receptionStatusMeta(selected.status).label}
              </StatusBadge>
            </div>
            {selected.cancelReason && (
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-rose-500">Lý do hủy:</span>
                <span className="font-semibold text-rose-700">{selected.cancelReason}</span>
              </div>
            )}
            {selected.note && (
              <div className="py-1.5">
                <span className="text-slate-400 block mb-1">Ghi chú:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
                  {selected.note}
                </p>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* CREATE QUICK APPOINTMENT MODAL */}
      <AdminModal
        isOpen={activeModal === 'create'}
        onClose={() => setActiveModal(null)}
        title="Đặt lịch khám nhanh"
        loading={modalLoading}
      >
        <form onSubmit={handleCreate} className="space-y-3.5">
          {modalError && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              label="SĐT / Email bệnh nhân"
              required
              value={createForm.patientPhoneOrEmail}
              onChange={(e) =>
                setCreateForm({ ...createForm, patientPhoneOrEmail: e.target.value })
              }
              placeholder="0912345678"
            />
            <AdminInput
              label="Tên bệnh nhân"
              value={createForm.patientName}
              onChange={(e) => setCreateForm({ ...createForm, patientName: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminSelect
              label="Bác sĩ khám"
              required
              value={createForm.doctorId}
              onChange={(e) =>
                setCreateForm({ ...createForm, doctorId: e.target.value, startTime: '' })
              }
              placeholder="-- Chọn bác sĩ --"
              options={doctors.map((d) => ({ value: d.id, label: doctorDisplayName(d) }))}
            />
            <AdminInput
              label="Ngày khám"
              type="date"
              required
              value={createForm.appointmentDate}
              onChange={(e) =>
                setCreateForm({ ...createForm, appointmentDate: e.target.value, startTime: '' })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Khung giờ khám *
            </label>
            {createSlotsLoading ? (
              <p className="text-xs text-slate-400 py-2">Đang tải slot trống…</p>
            ) : createSlots.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                Không có khung giờ trống trong ngày đã chọn.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 border rounded bg-slate-50/50">
                {createSlots.map((s: any) => {
                  const val = s.time || s.startTime
                  const active = createForm.startTime === val
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, startTime: val })}
                      className={`py-1.5 text-xs font-semibold rounded border cursor-pointer ${
                        active
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <AdminTextarea
            label="Ghi chú khám"
            value={createForm.note}
            onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })}
            placeholder="Lý do khám, triệu chứng ban đầu..."
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <AdminButton
              variant="secondary"
              disabled={modalLoading}
              onClick={() => setActiveModal(null)}
            >
              Hủy
            </AdminButton>
            <AdminButton
              variant="primary"
              type="submit"
              loading={modalLoading}
              disabled={!createForm.startTime}
            >
              Đặt lịch
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* RESCHEDULE MODAL */}
      <AdminModal
        isOpen={activeModal === 'reschedule' && Boolean(selected)}
        onClose={() => setActiveModal(null)}
        title="Dời lịch khám (Reschedule)"
        description={
          selected
            ? `Bệnh nhân: ${patientListDisplayName(selected.patient)} (${selected.ticket || selected.bookingCode})`
            : undefined
        }
        loading={modalLoading}
      >
        <form onSubmit={handleReschedule} className="space-y-3.5">
          {modalError && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <AdminSelect
              label="Bác sĩ phụ trách"
              required
              value={rescheduleDoctorId}
              onChange={(e) => {
                setRescheduleDoctorId(e.target.value)
                setSelectedSlotId('')
              }}
              options={doctors.map((d) => ({ value: d.id, label: doctorDisplayName(d) }))}
            />
            <AdminInput
              label="Ngày khám mới"
              type="date"
              required
              value={rescheduleDate}
              onChange={(e) => {
                setRescheduleDate(e.target.value)
                setSelectedSlotId('')
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chọn khung giờ mới còn trống *
            </label>
            {rescheduleSlotsLoading ? (
              <p className="text-xs text-slate-400 py-2">Đang tìm slot trống…</p>
            ) : rescheduleSlots.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                Không có ca khám trống nào cho bác sĩ trong ngày này.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 border rounded bg-slate-50/50">
                {rescheduleSlots.map((s: any) => {
                  const sId = String(s.slotId || s.id || s.time || s.startTime)
                  const label = s.time || s.startTime
                  const isSel = selectedSlotId === sId
                  return (
                    <button
                      key={sId}
                      type="button"
                      onClick={() => setSelectedSlotId(sId)}
                      className={`py-1.5 text-xs font-semibold rounded border cursor-pointer ${
                        isSel
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <AdminInput
            label="Lý do / Ghi chú đổi lịch"
            value={rescheduleNote}
            onChange={(e) => setRescheduleNote(e.target.value)}
            placeholder="VD: Bệnh nhân bận việc đột xuất xin đổi giờ..."
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <AdminButton
              variant="secondary"
              disabled={modalLoading}
              onClick={() => setActiveModal(null)}
            >
              Hủy
            </AdminButton>
            <AdminButton
              variant="primary"
              type="submit"
              loading={modalLoading}
              disabled={!selectedSlotId}
            >
              Xác nhận dời lịch
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* CANCEL MODAL */}
      <AdminModal
        isOpen={activeModal === 'cancel' && Boolean(selected)}
        onClose={() => setActiveModal(null)}
        maxWidth="md"
        title="Xác nhận hủy lịch khám?"
        description={
          selected
            ? `Vé khám: ${selected.ticket || selected.bookingCode} - Bệnh nhân: ${patientListDisplayName(selected.patient)}`
            : undefined
        }
        loading={modalLoading}
      >
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <CalendarX className="w-6 h-6" />
        </div>
        <form onSubmit={handleCancel} className="space-y-3">
          {modalError && (
            <div className="p-2 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {modalError}
            </div>
          )}
          <AdminTextarea
            label="Lý do hủy lịch khám"
            required
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Nhập lý do hủy (bắt buộc để lưu kiểm toán hệ thống)..."
          />
          <div className="flex gap-2 pt-2">
            <AdminButton
              variant="secondary"
              className="flex-1"
              disabled={modalLoading}
              onClick={() => setActiveModal(null)}
            >
              Không hủy
            </AdminButton>
            <AdminButton
              variant="danger"
              className="flex-1"
              type="submit"
              loading={modalLoading}
              disabled={!cancelReason.trim()}
            >
              Xác nhận hủy
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
