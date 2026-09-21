'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit2, Trash2, Lock, Unlock, Search, RefreshCw, AlertCircle, Eye, Plus, ShieldAlert } from 'lucide-react'
import {
  AdminButton,
  AdminIconButton,
  AdminPageHeader,
  AdminStatCard,
  FilterTabs,
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
} from '@/common/components/ui'
import { apiClient, apiErrorMessage } from '@/lib/api-client'
import { createUser, deleteUser, listUsers, updateUser } from '../services/users'
import { listPatientHistoryReception, listPatientsReception } from '../services/appointments'
import { formatDateVi, patientListDisplayName } from '../components/reception/receptionHelpers'

type PatientAccount = {
  id: string
  fullName?: string
  email?: string
  phoneNumber?: string
  role?: string
  status?: string
  isBlocked?: boolean
  createdAt?: string
  profiles?: any[]
}

const EMPTY_FORM = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  nationalId: '',
  healthInsuranceNumber: '',
  dateOfBirth: '',
  gender: 'MALE',
  address: '',
}

const genderLabel = (v: unknown) => {
  const r = String(v || '').toUpperCase()
  return r === 'MALE' || r === 'NAM' ? 'Nam' : r === 'FEMALE' || r === 'NỮ' || r === 'NU' ? 'Nữ' : v ? String(v) : '—'
}

const TABLE_COLUMNS = [
  'Tài khoản & Tên',
  'Liên hệ',
  'Định danh (CCCD / BHYT)',
  'Hồ sơ khám',
  'Trạng thái',
  { label: 'Thao tác', align: 'right' as const },
]

export default function AdminPatientsPage() {
  const [rows, setRows] = useState<PatientAccount[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [selected, setSelected] = useState<PatientAccount | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [savingId, setSavingId] = useState('')

  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [activePatient, setActivePatient] = useState<PatientAccount | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [uRes, pRes] = await Promise.all([
        listUsers({ limit: 100, isDeleted: false }),
        listPatientsReception({ page: 1, pageSize: 100 }).catch(() => null),
      ])
      const profiles: any[] = Array.isArray(pRes) ? pRes : Array.isArray(pRes?.patients) ? pRes.patients : []
      const byAccount = new Map<string, any[]>()
      profiles.forEach((p) => {
        const accId = String(p.accountId || p.account?.id || '')
        if (accId) {
          if (!byAccount.has(accId)) byAccount.set(accId, [])
          byAccount.get(accId)!.push(p)
        }
      })
      setRows(
        uRes.data
          .filter((u: any) => String(u.role || u.userType || '').toLowerCase() === 'patient')
          .map((u: any) => ({ ...u, profiles: byAccount.get(u.id) || [] }))
      )
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không tải được danh sách bệnh nhân.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter === 'blocked' && !r.isBlocked) return false
      if (statusFilter === 'active' && r.isBlocked) return false
      if (!q) return true
      const pText = (r.profiles || []).map((p) => `${p.fullName || ''} ${p.phone || ''} ${p.patientCode || ''} ${p.nationalId || ''}`).join(' ')
      return `${r.fullName || ''} ${r.email || ''} ${r.phoneNumber || ''} ${pText}`.toLowerCase().includes(q)
    })
  }, [rows, query, statusFilter])

  const stats = useMemo(
    () => ({
      total: rows.length,
      blocked: rows.filter((r) => r.isBlocked).length,
      active: rows.filter((r) => !r.isBlocked).length,
    }),
    [rows]
  )

  const openDetail = async (row: PatientAccount) => {
    setSelected(row)
    setHistory([])
    const pId = row.profiles?.find((p) => p.isMainProfile)?.id || row.profiles?.[0]?.id
    if (!pId) return
    setHistoryLoading(true)
    try {
      const appts = await listPatientHistoryReception({ patientId: pId })
      setHistory(Array.isArray(appts) ? appts.slice(0, 5) : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const toggleBlocked = async (row: PatientAccount) => {
    const nextBlocked = !row.isBlocked
    if (!confirm(`Bạn có chắc muốn ${nextBlocked ? 'khóa' : 'mở khóa'} tài khoản ${row.fullName || row.email}?`)) return
    setSavingId(row.id)
    try {
      await updateUser(row.id, { isBlocked: nextBlocked })
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isBlocked: nextBlocked } : r)))
      if (selected?.id === row.id) setSelected((prev) => (prev ? { ...prev, isBlocked: nextBlocked } : null))
      setSuccessMsg(`Đã ${nextBlocked ? 'khóa' : 'mở khóa'} tài khoản.`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không thể cập nhật trạng thái tài khoản.'))
    } finally {
      setSavingId('')
    }
  }

  const openCreateModal = () => {
    setActivePatient(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalType('create')
  }

  const openEditModal = (row: PatientAccount) => {
    setActivePatient(row)
    const mainP = row.profiles?.find((p) => p.isMainProfile) || row.profiles?.[0]
    setForm({
      fullName: row.fullName || mainP?.fullName || '',
      phoneNumber: row.phoneNumber || mainP?.phone || '',
      email: row.email || '',
      password: '',
      nationalId: mainP?.nationalId || '',
      healthInsuranceNumber: mainP?.healthInsuranceNumber || '',
      dateOfBirth: mainP?.dateOfBirth ? String(mainP.dateOfBirth).slice(0, 10) : '',
      gender: mainP?.gender ? String(mainP.gender).toUpperCase() : 'MALE',
      address: mainP?.address || '',
    })
    setFormError('')
    setModalType('edit')
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.phoneNumber.trim()) {
      return setFormError('Họ tên và Số điện thoại là bắt buộc.')
    }
    setFormSubmitting(true)
    setFormError('')
    try {
      await createUser({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        password: form.password.trim() || 'VitaCare@123',
        role: 'patient',
        status: 'active',
        isBlocked: false,
      })
      setSuccessMsg('Đã tạo tài khoản bệnh nhân mới thành công.')
      setTimeout(() => setSuccessMsg(''), 3500)
      setModalType(null)
      await load()
    } catch (cause) {
      setFormError(apiErrorMessage(cause, 'Không thể tạo tài khoản bệnh nhân.'))
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient) return
    if (!form.fullName.trim() || !form.phoneNumber.trim()) {
      return setFormError('Họ tên và Số điện thoại là bắt buộc.')
    }
    setFormSubmitting(true)
    setFormError('')
    try {
      await updateUser(activePatient.id, {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      })
      const mainP = activePatient.profiles?.find((p) => p.isMainProfile) || activePatient.profiles?.[0]
      if (mainP?.id) {
        await apiClient
          .patch(`/patient-profiles/${mainP.id}`, {
            fullName: form.fullName.trim(),
            phoneNumber: form.phoneNumber.trim(),
            nationalId: form.nationalId.trim() || null,
            healthInsuranceNumber: form.healthInsuranceNumber.trim() || null,
            dateOfBirth: form.dateOfBirth || undefined,
            gender: form.gender,
            address: form.address.trim() || null,
          })
          .catch(() => null)
      }
      setSuccessMsg('Đã cập nhật thông tin bệnh nhân.')
      setTimeout(() => setSuccessMsg(''), 3500)
      setModalType(null)
      if (selected?.id === activePatient.id) setSelected(null)
      await load()
    } catch (cause) {
      setFormError(apiErrorMessage(cause, 'Không cập nhật được thông tin.'))
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!activePatient) return
    setFormSubmitting(true)
    setFormError('')
    try {
      await deleteUser(activePatient.id)
      setRows((prev) => prev.filter((r) => r.id !== activePatient.id))
      if (selected?.id === activePatient.id) setSelected(null)
      setSuccessMsg('Đã xóa tài khoản bệnh nhân.')
      setTimeout(() => setSuccessMsg(''), 3500)
      setModalType(null)
    } catch (cause) {
      setFormError(apiErrorMessage(cause, 'Không xóa được tài khoản.'))
    } finally {
      setFormSubmitting(false)
    }
  }

  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'active', label: 'Hoạt động', count: stats.active },
    { id: 'blocked', label: 'Đã khóa', count: stats.blocked },
  ]

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý người dùng"
        title="Hồ sơ bệnh nhân"
        description="Quản lý thông tin tài khoản, CCCD, BHYT và lịch sử khám bệnh."
      >
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
          onClick={openCreateModal}
        >
          Thêm bệnh nhân
        </AdminButton>
      </AdminPageHeader>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
          {successMsg}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Tổng tài khoản" value={stats.total} />
        <AdminStatCard label="Đang hoạt động" value={stats.active} tone="emerald" />
        <AdminStatCard label="Đã khóa" value={stats.blocked} tone="rose" />
      </div>

      <AdminTableCard className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <FilterTabs
            tabs={filterTabs}
            active={statusFilter}
            onChange={(id) => setStatusFilter(id as any)}
          />
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên, SĐT, CCCD, Email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
            />
          </div>
        </div>

        <AdminTable minWidth="min-w-[800px]">
          <AdminTableHead columns={TABLE_COLUMNS} />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <AdminTableLoading colSpan={6} message="Đang tải dữ liệu bệnh nhân…" />
            ) : filtered.length === 0 ? (
              <AdminTableEmpty colSpan={6} message="Không có bệnh nhân phù hợp." />
            ) : (
              filtered.map((row) => {
                const mainP = row.profiles?.find((p) => p.isMainProfile) || row.profiles?.[0]
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <strong className="font-semibold text-slate-900 block">
                        {row.fullName || mainP?.fullName || 'Chưa cập nhật'}
                      </strong>
                      <p className="text-xs text-slate-400">{row.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {row.phoneNumber || mainP?.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <p className="font-mono text-slate-700">
                        {mainP?.nationalId ? `CCCD: ${mainP.nationalId}` : 'Chưa có CCCD'}
                      </p>
                      {mainP?.healthInsuranceNumber && (
                        <p className="font-mono text-slate-400 text-[11px]">
                          BHYT: {mainP.healthInsuranceNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {row.profiles?.length || 0} hồ sơ
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={row.isBlocked ? 'blocked' : 'active'}>
                        {row.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <AdminIconButton
                          icon={Eye}
                          title="Chi tiết"
                          tone="emerald"
                          onClick={() => void openDetail(row)}
                        />
                        <AdminIconButton
                          icon={Edit2}
                          title="Sửa"
                          tone="emerald"
                          onClick={() => openEditModal(row)}
                        />
                        <AdminIconButton
                          icon={row.isBlocked ? Unlock : Lock}
                          title={row.isBlocked ? 'Mở khóa' : 'Khóa'}
                          tone={row.isBlocked ? 'emerald' : 'amber'}
                          disabled={savingId === row.id}
                          onClick={() => void toggleBlocked(row)}
                        />
                        <AdminIconButton
                          icon={Trash2}
                          title="Xóa"
                          tone="rose"
                          onClick={() => {
                            setActivePatient(row)
                            setFormError('')
                            setModalType('delete')
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </AdminTable>
        <AdminTableFooter total={filtered.length} label="tài khoản bệnh nhân" />
      </AdminTableCard>

      {/* DETAIL MODAL */}
      <AdminModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        eyebrow="Chi tiết bệnh nhân"
        title={selected ? selected.fullName || selected.email : ''}
        maxWidth="xl"
        footer={
          <div className="flex justify-end gap-2">
            <AdminButton
              variant="secondary"
              onClick={() => {
                const s = selected
                setSelected(null)
                if (s) openEditModal(s)
              }}
            >
              Sửa
            </AdminButton>
            <AdminButton variant="primary" onClick={() => setSelected(null)}>
              Đóng
            </AdminButton>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Email:</span>
                <span className="font-semibold text-slate-800">{selected.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Số điện thoại:</span>
                <span className="font-semibold text-slate-800">{selected.phoneNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Trạng thái:</span>
                <StatusBadge status={selected.isBlocked ? 'blocked' : 'active'}>
                  {selected.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                </StatusBadge>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Ngày tạo:</span>
                <span className="font-semibold text-slate-800">
                  {selected.createdAt ? formatDateVi(selected.createdAt) : '—'}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Hồ sơ liên kết ({selected.profiles?.length || 0})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(selected.profiles || []).map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 text-xs"
                  >
                    <div className="flex justify-between font-semibold">
                      <span>{patientListDisplayName(p)}</span>
                      <span className="font-mono text-slate-400">{p.patientCode}</span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      Giới tính: {genderLabel(p.gender)} • CCCD: {p.nationalId || '—'} • BHYT:{' '}
                      {p.healthInsuranceNumber || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* CREATE / EDIT MODAL */}
      <AdminModal
        isOpen={modalType === 'create' || modalType === 'edit'}
        onClose={() => setModalType(null)}
        eyebrow={modalType === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}
        title={modalType === 'create' ? 'Thêm bệnh nhân mới' : 'Cập nhật bệnh nhân'}
        loading={formSubmitting}
      >
        <form
          onSubmit={modalType === 'create' ? handleSubmitCreate : handleSubmitEdit}
          className="space-y-3.5"
        >
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Họ và tên"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
            <AdminInput
              label="Số điện thoại"
              required
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="0912345678"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="patient@example.com"
            />
            <AdminSelect
              label="Giới tính"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Số CCCD"
              value={form.nationalId}
              onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
              placeholder="12 chữ số CCCD"
              className="font-mono"
            />
            <AdminInput
              label="Mã thẻ BHYT"
              value={form.healthInsuranceNumber}
              onChange={(e) => setForm({ ...form, healthInsuranceNumber: e.target.value })}
              placeholder="15 ký tự thẻ BHYT"
              className="font-mono"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Ngày sinh"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
            <AdminInput
              label="Địa chỉ thường trú"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Số nhà, đường, phường, tỉnh..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <AdminButton
              variant="secondary"
              disabled={formSubmitting}
              onClick={() => setModalType(null)}
            >
              Hủy
            </AdminButton>
            <AdminButton
              variant="primary"
              type="submit"
              loading={formSubmitting}
            >
              {modalType === 'create' ? 'Tạo bệnh nhân' : 'Lưu thay đổi'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* DELETE MODAL */}
      <AdminModal
        isOpen={modalType === 'delete' && Boolean(activePatient)}
        onClose={() => setModalType(null)}
        maxWidth="md"
        title="Xác nhận xóa bệnh nhân?"
        loading={formSubmitting}
      >
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          Bạn đang chuẩn bị xóa tài khoản{' '}
          <strong className="text-slate-800">
            {activePatient?.fullName || activePatient?.email}
          </strong>
          . Thao tác này sẽ vô hiệu hóa tài khoản.
        </p>
        {formError && (
          <div className="mt-3 text-xs text-rose-600 text-center font-medium">{formError}</div>
        )}
        <div className="mt-6 flex gap-2">
          <AdminButton
            variant="secondary"
            className="flex-1"
            disabled={formSubmitting}
            onClick={() => setModalType(null)}
          >
            Hủy bỏ
          </AdminButton>
          <AdminButton
            variant="danger"
            className="flex-1"
            loading={formSubmitting}
            onClick={() => void handleConfirmDelete()}
          >
            Xác nhận xóa
          </AdminButton>
        </div>
      </AdminModal>
    </>
  )
}
