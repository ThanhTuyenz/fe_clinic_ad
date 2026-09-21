'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit2, Trash2, Lock, Unlock, Search, RefreshCw, AlertCircle, Plus } from 'lucide-react'
import {
  AdminButton,
  AdminIconButton,
  AdminPageHeader,
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
  AdminTextarea,
} from '@/common/components/ui'
import { createUser, deleteUser, listUsers, updateUser } from '../services/users'
import { listCatalog } from '../services/systemCatalog'
import { listClinicRooms } from '../services/clinicRooms'
import { resolveMediaUrl } from '../services/media'
import ImageUploader from '../components/ImageUploader'

const ROLES = [
  ['all', 'Tất cả'],
  ['doctor', 'Bác sĩ'],
  ['receptionist', 'Lễ tân'],
  ['branch_manager', 'Quản lý chi nhánh'],
] as const
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES)
const ACADEMIC_RANKS = [
  'BS. CKI',
  'BS. CKII',
  'Thạc sĩ, BS',
  'Tiến sĩ, BS',
  'PGS. TS. BS',
  'GS. TS. BS',
  'Bác sĩ Đa khoa',
]

const EMPTY = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: 'doctor',
  isBlocked: false,
  avatarUrl: '',
  academicRank: 'BS. CKI',
  licenseNumber: '',
  experienceYears: '5',
  biography: '',
  branchId: '',
  specialtyId: '',
  roomId: '',
}

const TABLE_COLUMNS = [
  'Nhân viên',
  'Chi nhánh',
  'Chuyên khoa',
  'Vai trò',
  'Trạng thái',
  { label: 'Thao tác', align: 'right' as const },
]

export default function ClinicStaffPage() {
  const [rows, setRows] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [uRes, bRes, sRes, rRes] = await Promise.all([
        listUsers(),
        listCatalog('branches').catch(() => []),
        listCatalog('specialties').catch(() => []),
        listClinicRooms().catch(() => []),
      ])
      setRows(
        uRes.data.filter((u: any) =>
          ROLES.some(([id]) => id === String(u.role || u.userType).toLowerCase())
        )
      )
      setBranches(bRes)
      setSpecialties(sRes)
      setRooms(rRes)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được nhân sự.')
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
      const roleMatch = filter === 'all' || String(r.role || r.userType).toLowerCase() === filter
      if (!roleMatch) return false
      if (!q) return true
      const b = r.branchAssignments?.[0]?.branch?.name || r.branchName || ''
      const spec = r.doctor?.specialties?.[0]?.specialty?.name || ''
      return [r.fullName, r.email, r.phoneNumber, b, spec].join(' ').toLowerCase().includes(q)
    })
  }, [rows, filter, query])

  const availableRooms = useMemo(() => {
    if (!form.branchId) return rooms
    return rooms.filter((rm: any) => rm.branchId === form.branchId)
  }, [rooms, form.branchId])

  const openCreate = () => {
    setSelected(null)
    setForm({
      ...EMPTY,
      branchId: branches[0]?.id || '',
      specialtyId: specialties[0]?.id ? String(specialties[0].id) : '',
    })
    setError('')
    setModal('create')
  }

  const openEdit = (row: any) => {
    setSelected(row)
    const doc = row.doctor || {}
    setForm({
      fullName: row.fullName || '',
      email: row.email || '',
      phoneNumber: row.phoneNumber || '',
      password: '',
      role: String(row.role || row.userType).toLowerCase(),
      isBlocked: !!row.isBlocked,
      avatarUrl: row.avatarUrl || doc.avatarUrl || '',
      academicRank: doc.academicRank || 'BS. CKI',
      licenseNumber: doc.licenseNumber || '',
      experienceYears: doc.experienceYears != null ? String(doc.experienceYears) : '5',
      biography: doc.biography || '',
      branchId: row.branchAssignments?.[0]?.branchId || row.branchId || '',
      specialtyId: doc.specialties?.[0]?.specialtyId
        ? String(doc.specialties[0].specialtyId)
        : doc.specialtyId
        ? String(doc.specialtyId)
        : '',
      roomId: doc.roomId || row.roomId || '',
    })
    setError('')
    setModal('edit')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim()) return setError('Vui lòng nhập họ tên và email.')
    if (modal === 'create' && form.password.length < 6)
      return setError('Mật khẩu phải có ít nhất 6 ký tự.')

    setSaving(true)
    setError('')
    try {
      const payload: any = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        isBlocked: form.isBlocked,
        avatarUrl: form.avatarUrl || null,
        ...(form.phoneNumber ? { phoneNumber: form.phoneNumber.trim() } : {}),
        ...(form.password ? { password: form.password } : {}),
        ...(form.branchId ? { branchId: form.branchId } : {}),
      }
      if (form.role === 'doctor') {
        payload.academicRank = form.academicRank.trim()
        payload.licenseNumber = form.licenseNumber.trim()
        payload.experienceYears = Number(form.experienceYears) || 0
        payload.biography = form.biography.trim()
        if (form.specialtyId) payload.specialtyId = Number(form.specialtyId)
        if (form.roomId) payload.roomId = form.roomId
      }
      if (modal === 'create') {
        await createUser({ ...payload, status: 'active' })
        setSuccessMsg('Đã tạo tài khoản nhân sự mới.')
      } else {
        await updateUser(selected.id, payload)
        setSuccessMsg('Đã cập nhật thông tin nhân sự.')
      }
      setTimeout(() => setSuccessMsg(''), 3500)
      setModal(null)
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không lưu được nhân sự.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: any) => {
    if (!confirm(`Xóa tài khoản ${row.fullName || row.email}?`)) return
    try {
      await deleteUser(row.id)
      setSuccessMsg(`Đã xóa tài khoản.`)
      setTimeout(() => setSuccessMsg(''), 3000)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không xóa được tài khoản.')
    }
  }

  const toggle = async (row: any) => {
    const next = !row.isBlocked
    try {
      await updateUser(row.id, { isBlocked: next })
      setSuccessMsg(next ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.')
      setTimeout(() => setSuccessMsg(''), 3000)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không cập nhật được trạng thái.')
    }
  }

  const filterTabs = ROLES.map(([id, label]) => ({
    id,
    label,
    count:
      id === 'all'
        ? rows.length
        : rows.filter((r) => String(r.role || r.userType).toLowerCase() === id).length,
  }))

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý người dùng"
        title="Nhân sự phòng khám"
        description="Quản lý tài khoản, ảnh đại diện, chi nhánh, chuyên khoa và phòng khám."
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
          onClick={openCreate}
        >
          Thêm nhân sự
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

      <AdminTableCard className="mt-5">
        <div className="border-b border-slate-100 p-4 space-y-3">
          <FilterTabs
            tabs={filterTabs}
            active={filter}
            onChange={(id) => setFilter(id)}
          />
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
              placeholder="Tìm theo tên, email, SĐT..."
            />
          </div>
        </div>

        <AdminTable minWidth="min-w-[750px]">
          <AdminTableHead columns={TABLE_COLUMNS} />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <AdminTableLoading colSpan={6} message="Đang tải dữ liệu nhân sự…" />
            ) : filtered.length === 0 ? (
              <AdminTableEmpty colSpan={6} message="Không có nhân sự phù hợp." />
            ) : (
              filtered.map((row) => {
                const bName =
                  row.branchAssignments?.[0]?.branch?.name || row.branchName || 'Chi nhánh chính'
                const specName = row.doctor?.specialties?.[0]?.specialty?.name || '—'
                const avatar = row.avatarUrl || row.doctor?.avatarUrl
                const roleKey = String(row.role || row.userType).toLowerCase()
                return (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {avatar ? (
                          <img
                            src={resolveMediaUrl(avatar)}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100 shadow-xs">
                            {(row.fullName || row.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <strong className="text-slate-900 font-semibold block">
                            {row.fullName || 'Chưa cập nhật'}
                          </strong>
                          <p className="text-xs text-slate-400">
                            {row.email} {row.phoneNumber ? `• ${row.phoneNumber}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">{bName}</td>
                    <td className="px-5 py-3.5 text-xs text-emerald-800 font-medium">{specName}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      <span className="inline-flex items-center font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {ROLE_LABEL[roleKey] || row.role}
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
                          icon={Edit2}
                          title="Sửa"
                          tone="emerald"
                          onClick={() => openEdit(row)}
                        />
                        <AdminIconButton
                          icon={row.isBlocked ? Unlock : Lock}
                          title={row.isBlocked ? 'Mở khóa' : 'Khóa'}
                          tone={row.isBlocked ? 'emerald' : 'amber'}
                          onClick={() => void toggle(row)}
                        />
                        <AdminIconButton
                          icon={Trash2}
                          title="Xóa"
                          tone="rose"
                          onClick={() => void remove(row)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </AdminTable>
        <AdminTableFooter total={filtered.length} label="nhân sự" />
      </AdminTableCard>

      {/* CREATE / EDIT MODAL */}
      <AdminModal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        eyebrow={modal === 'create' ? 'Tạo mới' : 'Chỉnh sửa'}
        title={modal === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật nhân sự'}
        maxWidth="xl"
        loading={saving}
      >
        <form onSubmit={submit} className="space-y-4">
          <ImageUploader
            label="Ảnh đại diện (Avatar)"
            value={form.avatarUrl}
            onChange={(url) => setForm({ ...form, avatarUrl: url })}
            aspectRatio="square"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Họ và tên"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="BS. Nguyễn Văn An"
            />
            <AdminInput
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="doctor@vitacare.local"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Số điện thoại"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="0912345678"
            />
            <AdminSelect
              label="Vai trò hệ thống"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={ROLES.slice(1)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminSelect
              label="Chi nhánh làm việc"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              placeholder="-- Chọn chi nhánh --"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
            <AdminInput
              label={modal === 'edit' ? 'Mật khẩu (để trống nếu giữ nguyên)' : 'Mật khẩu'}
              type="password"
              required={modal !== 'edit'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {form.role === 'doctor' && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Thông tin chuyên môn Bác sĩ
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminSelect
                  label="Học hàm / Học vị"
                  value={form.academicRank}
                  onChange={(e) => setForm({ ...form, academicRank: e.target.value })}
                  options={ACADEMIC_RANKS.map((r) => ({ value: r, label: r }))}
                />
                <AdminInput
                  label="Số CCHN"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="CCHN-12345"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <AdminInput
                  label="Kinh nghiệm (năm)"
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                />
                <AdminSelect
                  label="Chuyên khoa"
                  value={form.specialtyId}
                  onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
                  placeholder="-- Chọn chuyên khoa --"
                  options={specialties.map((s) => ({ value: String(s.id), label: s.name }))}
                />
                <AdminSelect
                  label="Phòng khám"
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  placeholder="-- Chọn phòng --"
                  options={availableRooms.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
                />
              </div>
              <AdminTextarea
                label="Giới thiệu bác sĩ"
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                placeholder="Kinh nghiệm chuyên môn, thế mạnh điều trị..."
              />
            </div>
          )}

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
              {modal === 'create' ? 'Tạo nhân sự' : 'Lưu thay đổi'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
