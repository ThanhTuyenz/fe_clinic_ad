'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit2, Trash2, Lock, Unlock, Search, RefreshCw, AlertCircle, Plus, Calendar, Building2 } from 'lucide-react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
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
import { createUser, deleteUser, listUsers, updateUser, listCatalog, listClinicRooms, resolveMediaUrl } from '../services/staffService'
import { useAuth } from '@/common/hooks/useAuth'
import { usePermission } from '@/common/hooks/usePermission'
import { AppPermission } from '@/common/constants/permissions.constant'
import ImageUploader from '@/modules/catalog/components/ImageUploader'

const ROLES = [
  ['all', 'Tất cả'],
  ['admin', 'Quản trị hệ thống'],
  ['chain_manager', 'Quản lý toàn chuỗi'],
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
  branchIds: [] as string[],
  primaryBranchId: '',
  specialtyId: '',
  roomId: '',
}

const TABLE_COLUMNS = [
  'Nhân viên',
  'Chi nhánh',
  'Chuyên khoa',
  { label: 'Vai trò', width: 'whitespace-nowrap' },
  { label: 'Trạng thái', width: 'whitespace-nowrap' },
  { label: 'Thao tác', align: 'right' as const, width: 'whitespace-nowrap' },
]

export default function ClinicStaffPage() {
  const navigate = useNavigate()
  const { role: currentRole } = useAuth()
  const { hasPermission } = usePermission()
  const canCreateUsers = hasPermission(AppPermission.USER_CREATE)
  const canUpdateUsers = hasPermission(AppPermission.USER_UPDATE)
  const canDeleteUsers = hasPermission(AppPermission.USER_DELETE)
  const canManageRoles = hasPermission(AppPermission.ROLE_MANAGE)
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
    const initialBranchId = branches[0]?.id || ''
    setForm({
      ...EMPTY,
      branchId: initialBranchId,
      branchIds: initialBranchId ? [initialBranchId] : [],
      primaryBranchId: initialBranchId,
      specialtyId: specialties[0]?.id ? String(specialties[0].id) : '',
    })
    setError('')
    setModal('create')
  }

  const openEdit = (row: any) => {
    setSelected(row)
    const doc = row.doctor || {}
    const assignedBranchIds = (row.branchAssignments || []).map((b: any) => b.branchId || b.branch?.id).filter(Boolean)
    const primaryObj = (row.branchAssignments || []).find((b: any) => b.isPrimary)
    const primaryId = primaryObj?.branchId || primaryObj?.branch?.id || assignedBranchIds[0] || row.branchId || branches[0]?.id || ''
    const finalBranchIds = assignedBranchIds.length > 0 ? assignedBranchIds : (primaryId ? [primaryId] : [])

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
      branchId: primaryId,
      branchIds: finalBranchIds,
      primaryBranchId: primaryId,
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

  const toggleBranch = (bId: string) => {
    const current: string[] = form.branchIds || []
    let next: string[] = []
    if (current.includes(bId)) {
      next = current.filter((id: string) => id !== bId)
    } else {
      next = [...current, bId]
    }
    let nextPrimary = form.primaryBranchId
    if (!next.includes(nextPrimary)) {
      nextPrimary = next[0] || ''
    }
    setForm((prev: any) => ({
      ...prev,
      branchIds: next,
      primaryBranchId: nextPrimary,
      branchId: nextPrimary,
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim()) return setError('Vui lòng nhập họ tên và email.')
    if (modal === 'create' && form.password.length < 6)
      return setError('Mật khẩu phải có ít nhất 6 ký tự.')
    if (!['admin', 'chain_manager'].includes(form.role) && (!form.branchIds || form.branchIds.length === 0))
      return setError('Vui lòng chọn ít nhất một cơ sở làm việc / quản lý.')

    setSaving(true)
    setError('')
    try {
      const primaryId = form.primaryBranchId || form.branchIds[0] || form.branchId
      const payload: any = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        isBlocked: form.isBlocked,
        avatarUrl: form.avatarUrl || null,
        ...(form.phoneNumber ? { phoneNumber: form.phoneNumber.trim() } : {}),
        ...(form.password ? { password: form.password } : {}),
        branchId: ['admin', 'chain_manager'].includes(form.role) ? undefined : primaryId,
        branchIds: ['admin', 'chain_manager'].includes(form.role) ? [] : form.branchIds,
        primaryBranchId: ['admin', 'chain_manager'].includes(form.role) ? undefined : primaryId,
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
        {currentRole !== 'admin' && <AdminButton
          variant="secondary"
          icon={Calendar}
          onClick={() => navigate('/work-schedules')}
          className="border-emerald-200 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/60"
        >
          Lịch làm việc bác sĩ
        </AdminButton>}
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          loading={loading}
          onClick={() => void load()}
        >
          Làm mới
        </AdminButton>
        {canCreateUsers && <AdminButton
          variant="primary"
          icon={Plus}
          onClick={openCreate}
        >
          Thêm nhân sự
        </AdminButton>}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <FilterTabs
            tabs={filterTabs}
            active={filter}
            onChange={(id) => setFilter(id)}
          />
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
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
                  (['chain_manager', 'admin'].includes(String(row.role).toLowerCase()) ? 'Toàn hệ thống' : row.branchAssignments?.[0]?.branch?.name || row.branchName || 'Chưa phân công')
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
                          <strong className="text-xs text-slate-900 font-semibold block">
                            {row.fullName || 'Chưa cập nhật'}
                          </strong>
                          <p className="text-xs text-slate-400">
                            {row.email} {row.phoneNumber ? `• ${row.phoneNumber}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 whitespace-nowrap">
                      {(() => {
                        const bList = (row.branchAssignments || [])
                          .map((b: any) => b.branch?.name)
                          .filter(Boolean)
                        if (bList.length === 0) {
                          return <span className="text-slate-400">{row.branchName || '—'}</span>
                        }
                        if (bList.length === 1) {
                          return <span className="font-semibold text-slate-800">{bList[0]}</span>
                        }
                        return (
                          <div className="flex items-center gap-1.5" title={bList.join(', ')}>
                            <span className="font-semibold text-slate-800">{bList[0]}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              +{bList.length - 1} cơ sở
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-emerald-800 font-medium whitespace-nowrap">{specName}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">
                        {ROLE_LABEL[roleKey] || row.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={row.isBlocked ? 'blocked' : 'active'}>
                        {row.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {roleKey === 'doctor' && currentRole !== 'admin' && (
                          <AdminIconButton
                            icon={Calendar}
                            title="Lịch làm việc bác sĩ"
                            tone="emerald"
                            onClick={() => navigate('/work-schedules', { state: { doctorId: row.id, doctorName: row.fullName } })}
                          />
                        )}
                        {canUpdateUsers && <><AdminIconButton
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
                        </>}
                        {canDeleteUsers && <AdminIconButton
                          icon={Trash2}
                          title="Xóa"
                          tone="rose"
                          onClick={() => void remove(row)}
                        />}
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
        maxWidth="4xl"
        loading={saving}
      >
        <form onSubmit={submit} className="space-y-3.5" autoComplete="off">
          {/* Avatar hàng đầu gọn gàng */}
          <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
            <ImageUploader
              label="Ảnh đại diện"
              value={form.avatarUrl}
              onChange={(url) => setForm({ ...form, avatarUrl: url })}
              aspectRatio="avatar"
            />
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Ảnh chân dung nhân sự</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Định dạng JPG, PNG hoặc WebP. Tối đa 5MB.
              </p>
            </div>
          </div>

          {/* Nhóm thông tin tài khoản & nhân sự (lưới 3 cột chuẩn) */}
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminInput
              label="Họ và tên"
              name="fullName"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="BS. Nguyễn Văn An"
            />
            <AdminInput
              label="Email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="doctor@vitacare.local"
              autoComplete="off"
            />
            <AdminInput
              label="Số điện thoại"
              name="phone"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="0912345678"
              autoComplete="tel"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminSelect
              label="Vai trò hệ thống"
              disabled={modal === 'edit' && !canManageRoles}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={canManageRoles || modal === 'edit' ? ROLES.slice(1) : ROLES.slice(1).filter(([id]) => ['doctor', 'receptionist'].includes(id))}
            />
            <AdminInput
              label={modal === 'edit' ? 'Mật khẩu (để trống nếu giữ nguyên)' : 'Mật khẩu'}
              name="staff_password"
              type="password"
              required={modal !== 'edit'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {/* Chọn cơ sở công tác / quản lý (Hỗ trợ đa chi nhánh) */}
          {['admin', 'chain_manager'].includes(form.role) ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Vai trò này có phạm vi toàn hệ thống, không cần gán từng chi nhánh.</p> : (
          <div className="p-3 rounded border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {form.role === 'branch_manager'
                    ? 'Chi nhánh quản lý'
                    : form.role === 'doctor'
                    ? 'Chi nhánh công tác & khám bệnh'
                    : 'Chi nhánh làm việc'}
                </span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Đã chọn: <strong className="text-emerald-700">{form.branchIds?.length || 0}</strong> cơ sở
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {branches.map((b) => {
                const isChecked = form.branchIds?.includes(b.id)
                const isPrimary = form.primaryBranchId === b.id

                return (
                  <div
                    key={b.id}
                    onClick={() => toggleBranch(b.id)}
                    className={`flex items-center justify-between p-2.5 rounded border transition-colors cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <label
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleBranch(b.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={`text-xs truncate ${isChecked ? 'text-emerald-950 font-bold' : 'text-slate-700 font-medium'}`}>
                        {b.name}
                      </span>
                    </label>

                    {isChecked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setForm((prev: any) => ({ ...prev, primaryBranchId: b.id, branchId: b.id }))
                        }}
                        title={isPrimary ? 'Cơ sở chính hiện tại' : 'Đặt cơ sở này làm cơ sở chính'}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold border transition-all cursor-pointer shrink-0 ${
                          isPrimary
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500 hover:text-emerald-700'
                        }`}
                      >
                        {isPrimary ? '★ Cơ sở chính' : 'Đặt làm chính'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {form.branchIds?.length > 1 && (
              <p className="text-[11px] text-slate-500 italic mt-1">
                * Bấm nút <strong>&quot;Đặt làm chính&quot;</strong> để chọn cơ sở mặc định ưu tiên phân ca và đón tiếp.
              </p>
            )}
          </div>

          )}
          {/* Nhóm chuyên môn Bác sĩ (chỉ hiển thị khi vai trò là Bác sĩ) */}
          {form.role === 'doctor' && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-emerald-600"></span>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Thông tin chuyên môn Bác sĩ
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <AdminSelect
                  label="Học hàm / Học vị"
                  value={form.academicRank}
                  onChange={(e) => setForm({ ...form, academicRank: e.target.value })}
                  options={ACADEMIC_RANKS.map((r) => ({ value: r, label: r }))}
                />
                <AdminInput
                  label="Số CCHN"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  placeholder="CCHN-12345"
                  className="font-mono"
                  autoComplete="off"
                />
                <AdminInput
                  label="Kinh nghiệm (năm)"
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <AdminSelect
                  label="Chuyên khoa"
                  value={form.specialtyId}
                  onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
                  placeholder="-- Chọn chuyên khoa --"
                  options={specialties.map((s) => ({ value: String(s.id), label: s.name }))}
                />
                <div className="sm:col-span-2">
                  <AdminSelect
                    label="Phòng khám phân công"
                    value={form.roomId}
                    onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                    placeholder="-- Chọn phòng khám --"
                    options={availableRooms.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
                  />
                </div>
              </div>

              <div>
                <AdminTextarea
                  label="Giới thiệu bác sĩ & Thế mạnh điều trị"
                  value={form.biography}
                  onChange={(e) => setForm({ ...form, biography: e.target.value })}
                  placeholder="Kinh nghiệm chuyên môn, quá trình công tác, thế mạnh điều trị..."
                  rows={2}
                />
              </div>
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
