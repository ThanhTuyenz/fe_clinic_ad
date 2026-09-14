'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiErrorMessage } from '@/lib/api-client'
import { useAuth } from '@/common/hooks/useAuth'
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

const ROLE_META = [
  {
    id: 'admin',
    label: 'Quản trị viên',
    summary: 'Toàn hệ thống: danh mục, nhân sự, bệnh nhân, lịch hẹn.',
  },
  {
    id: 'branch_manager',
    label: 'Quản lý chi nhánh',
    summary: 'Vận hành cơ sở: danh mục, nhân sự, bệnh nhân, lịch hẹn.',
  },
  {
    id: 'receptionist',
    label: 'Lễ tân',
    summary: 'Tiếp nhận, check-in, đặt lịch tại quầy, thu phí.',
  },
  {
    id: 'doctor',
    label: 'Bác sĩ',
    summary: 'Khám bệnh, đơn thuốc, lịch của mình.',
  },
] as const

const ACCESS = [
  ['Danh mục & cơ sở', ['admin', 'branch_manager']],
  ['Nhân sự', ['admin', 'branch_manager']],
  ['Bệnh nhân', ['admin', 'branch_manager']],
  ['Lịch hẹn hệ thống', ['admin', 'branch_manager']],
  ['Tiếp nhận tại quầy', ['receptionist']],
  ['Khám bệnh', ['doctor']],
  ['Thanh toán', ['admin', 'branch_manager', 'receptionist']],
] as const

function roleOf(row: StaffUser) {
  return String(row.role || '').toLowerCase()
}

export default function RolesPermissionsPage() {
  const { user } = useAuth()
  const currentRole = staffRole(user)
  const currentId = String(user?.id || '')
  const canAssignAdmin = currentRole === 'admin'
  const assignableRoles = ROLE_META.filter((role) => canAssignAdmin || role.id !== 'admin')

  const [rows, setRows] = useState<StaffUser[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listUsers({ limit: 100, isDeleted: false })
      setRows(result.data.filter((item: StaffUser) => ROLE_META.some((role) => role.id === roleOf(item))))
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không tải được danh sách phân quyền.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    const next: Record<string, number> = Object.fromEntries(ROLE_META.map((role) => [role.id, 0]))
    for (const row of rows) {
      const role = roleOf(row)
      if (role in next) next[role] += 1
    }
    return next
  }, [rows])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return rows.filter((row) => {
      const role = roleOf(row)
      if (filter !== 'all' && role !== filter) return false
      if (!term) return true
      return `${row.fullName || ''} ${row.email || ''} ${row.phoneNumber || ''}`.toLowerCase().includes(term)
    })
  }, [rows, query, filter])

  async function changeRole(row: StaffUser, nextRole: string) {
    const current = roleOf(row)
    if (current === nextRole) return
    if (row.id === currentId && !confirm('Đổi vai trò của chính bạn có thể làm mất quyền vào trang này. Tiếp tục?')) return
    const label = ROLE_META.find((role) => role.id === nextRole)?.label || nextRole
    if (!confirm(`Gán vai trò “${label}” cho ${row.fullName || row.email}?`)) return
    setSavingId(row.id)
    setError('')
    try {
      await updateUser(row.id, { role: nextRole })
      setRows((items) => items.map((item) => (item.id === row.id ? { ...item, role: nextRole } : item)))
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không đổi được vai trò.'))
    } finally {
      setSavingId('')
    }
  }

  async function toggleBlocked(row: StaffUser) {
    if (row.id === currentId) {
      setError('Không thể khóa tài khoản đang đăng nhập.')
      return
    }
    const next = !row.isBlocked
    if (!confirm(next ? `Bạn chắc muốn khóa tài khoản ${row.fullName || row.email}?` : `Mở khóa tài khoản ${row.fullName || row.email}?`)) return
    setSavingId(row.id)
    setError('')
    try {
      await updateUser(row.id, { isBlocked: next })
      setRows((items) => items.map((item) => (item.id === row.id ? { ...item, isBlocked: next } : item)))
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không cập nhật được trạng thái tài khoản.'))
    } finally {
      setSavingId('')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý người dùng</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Vai trò & Phân quyền</h1>
          <p className="mt-1 text-sm text-slate-500">Vai trò hệ thống cố định. Gán lại role cho nhân sự, không tạo role mới.</p>
        </div>
        <button onClick={() => void load()} className="rounded-md border px-3 py-2 text-xs font-bold">
          Làm mới
        </button>
      </div>

      {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ROLE_META.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setFilter((value) => (value === role.id ? 'all' : role.id))}
            className={`rounded-xl border p-4 text-left ${filter === role.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-slate-900">{role.label}</h2>
              <span className="text-lg font-extrabold text-emerald-700">{loading ? '—' : counts[role.id] || 0}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{role.summary}</p>
          </button>
        ))}
      </div>

      <section className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Khu vực</th>
              {ROLE_META.map((role) => (
                <th key={role.id} className="px-3 py-3 text-center">
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACCESS.map(([area, roles]) => (
              <tr key={area} className="border-t">
                <td className="px-5 py-3 font-semibold text-slate-800">{area}</td>
                {ROLE_META.map((role) => (
                  <td key={role.id} className="px-3 py-3 text-center">
                    {roles.includes(role.id) ? <span className="font-bold text-emerald-700">Có</span> : <span className="text-slate-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b p-4">
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm">
            <option value="all">Tất cả vai trò</option>
            {ROLE_META.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên hoặc email nhân sự..."
            className="min-w-[240px] flex-1 rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Nhân sự', 'Vai trò', 'Trạng thái', 'Thao tác'].map((label) => (
                  <th key={label} className="px-5 py-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-slate-400">
                    Đang tải phân quyền…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-slate-400">
                    Không có nhân sự phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-5 py-3">
                      <b className="text-slate-900">{row.fullName || 'Chưa cập nhật'}</b>
                      <p className="mt-1 text-xs text-slate-400">{row.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={roleOf(row)}
                        disabled={savingId === row.id || (!canAssignAdmin && roleOf(row) === 'admin')}
                        onChange={(event) => void changeRole(row, event.target.value)}
                        className="rounded-md border bg-white px-3 py-2 text-sm"
                      >
                        {assignableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.label}
                          </option>
                        ))}
                        {!canAssignAdmin && roleOf(row) === 'admin' && <option value="admin">Quản trị viên</option>}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {row.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button
                        onClick={() => void toggleBlocked(row)}
                        disabled={savingId === row.id || row.id === currentId}
                        className={`rounded border px-3 py-1.5 text-xs disabled:opacity-50 ${row.isBlocked ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}`}
                      >
                        {savingId === row.id ? 'Đang lưu…' : row.isBlocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t px-5 py-3 text-xs text-slate-400">Tổng cộng {filtered.length} nhân sự</footer>
      </section>
    </>
  )
}
