'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shield, ShieldPlus, Trash2, AlertCircle, Users, RefreshCw, Search } from 'lucide-react'
import { apiErrorMessage } from '@/lib/api-client'
import { useAuth } from '@/common/hooks/useAuth'
import {
  AdminButton,
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
  AdminTextarea,
} from '@/common/components/ui'
import { listUsers, updateUser } from '../services/users'
import { staffRole } from '../utils/staffSession'

type StaffUser = {
  id: string
  fullName?: string
  email?: string
  phoneNumber?: string
  role?: string
  isBlocked?: boolean
}
type RoleItem = {
  id: string
  label: string
  summary: string
  isSystem?: boolean
  permissions?: string[]
}

const DEFAULT_SYSTEM_ROLES: RoleItem[] = [
  {
    id: 'admin',
    label: 'Quản trị viên',
    summary: 'Toàn quyền: danh mục, nhân sự, bệnh nhân, lịch hẹn, thống kê.',
    isSystem: true,
    permissions: ['catalog', 'staff', 'patients', 'appointments', 'reception', 'consultation', 'billing'],
  },
  {
    id: 'branch_manager',
    label: 'Quản lý chi nhánh',
    summary: 'Vận hành cơ sở: danh mục, nhân sự, lịch hẹn, bệnh nhân.',
    isSystem: true,
    permissions: ['catalog', 'staff', 'patients', 'appointments', 'billing'],
  },
  {
    id: 'receptionist',
    label: 'Lễ tân',
    summary: 'Tiếp nhận, check-in, cấp số thứ tự, đặt lịch quầy, thu phí.',
    isSystem: true,
    permissions: ['reception', 'appointments', 'billing'],
  },
  {
    id: 'doctor',
    label: 'Bác sĩ',
    summary: 'Khám bệnh, chẩn đoán ICD-10, kê đơn thuốc, xem lịch khám.',
    isSystem: true,
    permissions: ['consultation', 'appointments'],
  },
]

const PERMISSION_MODULES = [
  { id: 'catalog', label: 'Danh mục & Cơ sở' },
  { id: 'staff', label: 'Quản lý nhân sự' },
  { id: 'patients', label: 'Hồ sơ bệnh nhân' },
  { id: 'appointments', label: 'Quản lý lịch hẹn' },
  { id: 'reception', label: 'Tiếp đón & Check-in' },
  { id: 'consultation', label: 'Phòng khám & Đơn thuốc' },
  { id: 'billing', label: 'Hóa đơn & Thu phí' },
]

const TABLE_COLUMNS = [
  'Nhân viên',
  'Liên hệ',
  'Vai trò hiện tại',
  { label: 'Chuyển vai trò', align: 'right' as const },
]

const roleOf = (row: StaffUser) => String(row.role || '').toLowerCase()

export default function RolesPermissionsPage() {
  const { user } = useAuth()
  const currentRole = staffRole(user)
  const currentId = String(user?.id || '')
  const canAssignAdmin = currentRole === 'admin'

  const [roles, setRoles] = useState<RoleItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vitacare_custom_roles')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_SYSTEM_ROLES
  })

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')
  const [rows, setRows] = useState<StaffUser[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [savingId, setSavingId] = useState('')

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [roleForm, setRoleForm] = useState({
    id: '',
    label: '',
    summary: '',
    permissions: [] as string[],
  })
  const [roleFormError, setRoleFormError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('vitacare_custom_roles', JSON.stringify(roles))
    } catch {}
  }, [roles])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listUsers({ limit: 100, isDeleted: false })
      setRows(res.data.filter((u: StaffUser) => roles.some((r) => r.id === roleOf(u))))
    } catch (e) {
      setError(apiErrorMessage(e, 'Không tải được danh sách phân quyền.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [roles])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    const map: Record<string, number> = Object.fromEntries(roles.map((r) => [r.id, 0]))
    rows.forEach((r) => {
      const k = roleOf(r)
      if (k in map) map[k]++
    })
    return map
  }, [rows, roles])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'all' && roleOf(r) !== filter) return false
      return !q || `${r.fullName || ''} ${r.email || ''} ${r.phoneNumber || ''}`.toLowerCase().includes(q)
    })
  }, [rows, query, filter])

  const changeRole = async (row: StaffUser, nextRole: string) => {
    if (roleOf(row) === nextRole) return
    if (
      row.id === currentId &&
      !confirm('Đổi vai trò của chính bạn có thể làm mất quyền vào trang này. Tiếp tục?')
    )
      return
    const label = roles.find((r) => r.id === nextRole)?.label || nextRole
    if (!confirm(`Gán vai trò “${label}” cho ${row.fullName || row.email}?`)) return

    setSavingId(row.id)
    setError('')
    try {
      await updateUser(row.id, { role: nextRole })
      setRows((items) => items.map((it) => (it.id === row.id ? { ...it, role: nextRole } : it)))
      setSuccessMsg(`Đã đổi vai trò của ${row.fullName || row.email} thành ${label}.`)
      setTimeout(() => setSuccessMsg(''), 3500)
    } catch (e) {
      setError(apiErrorMessage(e, 'Không cập nhật được vai trò.'))
    } finally {
      setSavingId('')
    }
  }

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault()
    const id = roleForm.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
    if (!id || !roleForm.label.trim()) {
      return setRoleFormError('Mã vai trò và Tên hiển thị là bắt buộc.')
    }
    if (roles.some((r) => r.id === id)) {
      return setRoleFormError('Mã vai trò này đã tồn tại.')
    }
    const newRole: RoleItem = {
      id,
      label: roleForm.label.trim(),
      summary: roleForm.summary.trim() || 'Vai trò tùy chỉnh.',
      isSystem: false,
      permissions: roleForm.permissions,
    }
    setRoles([...roles, newRole])
    setIsRoleModalOpen(false)
    setSuccessMsg(`Đã thêm vai trò "${newRole.label}".`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleDeleteRole = (id: string) => {
    const target = roles.find((r) => r.id === id)
    if (!target || target.isSystem) return alert('Không thể xóa vai trò mặc định của hệ thống!')
    if (counts[id] > 0)
      return alert(
        `Đang có ${counts[id]} người dùng giữ vai trò này. Hãy đổi vai trò của họ trước khi xóa!`
      )
    if (!confirm(`Bạn chắc muốn xóa vai trò "${target.label}"?`)) return
    setRoles(roles.filter((r) => r.id !== id))
    setSuccessMsg(`Đã xóa vai trò "${target.label}".`)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const togglePerm = (id: string) => {
    setRoleForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter((p) => p !== id)
        : [...f.permissions, id],
    }))
  }

  const assignableRoles = roles.filter((r) => canAssignAdmin || r.id !== 'admin')

  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: rows.length },
    ...roles.map((r) => ({ id: r.id, label: r.label, count: counts[r.id] ?? 0 })),
  ]

  return (
    <>
      <AdminPageHeader
        eyebrow="Phân quyền & Bảo mật"
        title="Phân quyền theo vai trò"
        description="Quản lý vai trò nhân viên và quyền hạn truy cập các module."
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
          icon={ShieldPlus}
          onClick={() => {
            setRoleForm({ id: '', label: '', summary: '', permissions: ['appointments'] })
            setRoleFormError('')
            setIsRoleModalOpen(true)
          }}
        >
          Tạo vai trò mới
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

      <div className="mt-5 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'users'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Gán vai trò nhân sự ({rows.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'roles'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" /> Danh sách vai trò ({roles.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <AdminStatCard
                key={r.id}
                label={r.label}
                value={counts[r.id] ?? 0}
                detail={r.summary}
                loading={loading}
              />
            ))}
          </div>

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
                  placeholder="Tìm theo tên, email, SĐT..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            <AdminTable minWidth="min-w-[650px]">
              <AdminTableHead columns={TABLE_COLUMNS} />
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <AdminTableLoading colSpan={4} message="Đang tải dữ liệu…" />
                ) : filtered.length === 0 ? (
                  <AdminTableEmpty colSpan={4} message="Không có nhân viên phù hợp." />
                ) : (
                  filtered.map((row) => {
                    const cur = roleOf(row)
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <strong className="font-semibold text-slate-900 block">
                            {row.fullName || 'Chưa cập nhật'}
                          </strong>
                          <p className="text-xs text-slate-400">
                            {row.email}{' '}
                            {row.id === currentId && (
                              <span className="ml-1 font-bold text-emerald-700">(Bạn)</span>
                            )}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {row.phoneNumber || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge tone="emerald">
                            {roles.find((r) => r.id === cur)?.label || cur}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <select
                            value={cur}
                            disabled={savingId === row.id}
                            onChange={(e) => void changeRole(row, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs focus:outline-none focus:border-emerald-600 disabled:opacity-50 cursor-pointer"
                          >
                            {assignableRoles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </AdminTable>
            <AdminTableFooter total={filtered.length} label="nhân viên" />
          </AdminTableCard>
        </>
      ) : (
        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{r.label}</h3>
                    {r.isSystem ? (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                        Hệ thống
                      </span>
                    ) : (
                      <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-semibold border border-sky-200">
                        Tùy chỉnh
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{r.summary}</p>
                </div>
                {!r.isSystem && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(r.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer"
                    title="Xóa vai trò"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="border-t border-slate-100 pt-2.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Quyền truy cập:
                </p>
                <div className="flex flex-wrap gap-1">
                  {(r.permissions || []).map((p) => {
                    const mod = PERMISSION_MODULES.find((m) => m.id === p)
                    return (
                      <span
                        key={p}
                        className="rounded bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[11px] text-slate-700 font-medium"
                      >
                        {mod?.label || p}
                      </span>
                    )
                  })}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* MODAL TẠO VAI TRÒ */}
      <AdminModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        eyebrow="Tạo vai trò mới"
        title="Thiết lập vai trò tùy chỉnh"
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          {roleFormError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{roleFormError}</span>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Mã vai trò"
              required
              value={roleForm.id}
              onChange={(e) => setRoleForm({ ...roleForm, id: e.target.value })}
              placeholder="cskh / lead_doctor"
              className="font-mono"
            />
            <AdminInput
              label="Tên hiển thị"
              required
              value={roleForm.label}
              onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })}
              placeholder="Chăm sóc khách hàng"
            />
          </div>
          <AdminTextarea
            label="Mô tả chức năng"
            rows={2}
            value={roleForm.summary}
            onChange={(e) => setRoleForm({ ...roleForm, summary: e.target.value })}
            placeholder="Mô tả trách nhiệm của vai trò..."
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Quyền truy cập module
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSION_MODULES.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    roleForm.permissions.includes(m.id)
                      ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={roleForm.permissions.includes(m.id)}
                    onChange={() => togglePerm(m.id)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <AdminButton
              variant="secondary"
              onClick={() => setIsRoleModalOpen(false)}
            >
              Hủy
            </AdminButton>
            <AdminButton
              variant="primary"
              type="submit"
            >
              Tạo vai trò
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
