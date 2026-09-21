'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiErrorMessage } from '@/lib/api-client'
import { createUser, deleteUser, listUsers, updateUser } from '../services/staffService'
import { Plus, Search, RefreshCw, Calendar } from 'lucide-react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import {
  AdminButton,
  AdminPageHeader,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminTableFooter,
  StatusBadge,
  AdminModal,
  AdminInput,
} from '@/common/components/ui'

const LABELS = {
  doctor: { title: 'Quản lý bác sĩ', singular: 'bác sĩ', code: 'BS', label: 'Bác sĩ' },
  receptionist: { title: 'Quản lý tiếp tân', singular: 'tiếp tân', code: 'TT', label: 'Tiếp tân' },
}

const TABLE_COLUMNS = [
  { label: 'Nhân viên' },
  { label: 'Mã' },
  { label: 'Vai trò' },
  { label: 'Trạng thái' },
  { label: 'Thao tác', align: 'right' as const },
]

const EMPTY_FORM = { fullName: '', email: '', password: '', isBlocked: false }

export default function StaffCrudPage({ role = 'doctor' }: { role?: 'doctor' | 'receptionist' }) {
  const navigate = useNavigate()
  const meta = LABELS[role]
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listUsers()
      setRows(result.data.filter((u: any) => String(u.role || u.userType).toLowerCase() === role))
    } catch (e) {
      setError(apiErrorMessage(e, 'Không thể tải danh sách tài khoản.'))
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => `${r.fullName || ''} ${r.email || ''}`.toLowerCase().includes(q)) : rows
  }, [query, rows])

  function openCreate() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal('create')
  }

  function openEdit(row: any) {
    setSelected(row)
    setForm({
      fullName: row.fullName || '',
      email: row.email || '',
      password: '',
      status: row.status || 'active',
      isBlocked: Boolean(row.isBlocked),
    })
    setError('')
    setModal('edit')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim() || !form.email.trim()) return setError('Vui lòng nhập họ tên và email.')
    if (modal === 'create' && form.password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.')
    setSaving(true)
    try {
      if (modal === 'create') {
        await createUser({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, role, status: 'active' })
      } else {
        await updateUser(selected.id, {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          status: form.status,
          isBlocked: form.isBlocked,
          ...(form.password ? { password: form.password } : {}),
        })
      }
      setModal(null)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Không thể lưu thông tin.'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleBlocked(row: any) {
    if (!confirm(`${row.isBlocked ? 'Mở khóa' : 'Khóa'} tài khoản ${row.fullName || row.email}?`)) return
    try {
      await updateUser(row.id, { isBlocked: !row.isBlocked })
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Không thể cập nhật trạng thái.'))
    }
  }

  async function remove(row: any) {
    if (!confirm(`Xóa ${meta.singular} ${row.fullName || row.email}?`)) return
    try {
      await deleteUser(row.id)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Không thể xóa tài khoản.'))
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý nhân sự"
        title={meta.title}
        description={`Danh sách tài khoản ${meta.singular} thuộc hệ thống phòng khám.`}
      >
        {role === 'doctor' && (
          <AdminButton
            variant="secondary"
            icon={Calendar}
            onClick={() => navigate('/work-schedules')}
            className="border-emerald-200 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/60"
          >
            Lịch làm việc bác sĩ
          </AdminButton>
        )}
        <AdminButton
          variant="primary"
          icon={Plus}
          onClick={openCreate}
        >
          Thêm {meta.singular}
        </AdminButton>
      </AdminPageHeader>

      {error && (
        <div className="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <AdminTableCard className="mt-5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded border border-slate-200 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-emerald-600 bg-white"
              placeholder={`Tìm theo tên hoặc email ${meta.singular}...`}
            />
          </div>
          <AdminButton
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={() => void load()}
          >
            Làm mới
          </AdminButton>
        </div>

        <AdminTable minWidth="min-w-[760px]">
          <AdminTableHead columns={TABLE_COLUMNS} />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <AdminTableLoading colSpan={5} message="Đang tải dữ liệu…" />
            ) : filtered.length === 0 ? (
              <AdminTableEmpty colSpan={5} message={`Chưa có ${meta.singular} phù hợp.`} />
            ) : (
              filtered.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <strong className="text-slate-900 block">{row.fullName || 'Chưa cập nhật'}</strong>
                    <p className="text-[11px] text-slate-400">{row.email}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-emerald-700 font-bold">
                    {meta.code}-{String(index + 1).padStart(3, '0')}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-600">{meta.label}</td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={row.isBlocked ? 'blocked' : row.status === 'inactive' ? 'inactive' : 'active'}
                      label={row.isBlocked ? 'Đã khóa' : row.status === 'inactive' ? 'Ngưng hoạt động' : 'Hoạt động'}
                      tone={row.isBlocked || row.status === 'inactive' ? 'rose' : 'emerald'}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <AdminButton variant="secondary" size="xs" onClick={() => openEdit(row)}>
                        Sửa
                      </AdminButton>
                      <AdminButton
                        variant="outline"
                        size="xs"
                        className={row.isBlocked ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
                        onClick={() => void toggleBlocked(row)}
                      >
                        {row.isBlocked ? 'Mở khóa' : 'Khóa'}
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
        <AdminTableFooter count={filtered.length} label={meta.singular} />
      </AdminTableCard>

      {/* CREATE / EDIT MODAL */}
      <AdminModal
        isOpen={Boolean(modal)}
        onClose={() => !saving && setModal(null)}
        title={`${modal === 'create' ? 'Thêm mới' : 'Cập nhật'} ${meta.singular}`}
        loading={saving}
      >
        <form onSubmit={submit} className="space-y-3.5">
          <AdminInput
            label="Họ và tên"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="VD: Bác sĩ Nguyễn Văn A"
          />
          <AdminInput
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="bacsi@vitacare.vn"
          />
          <AdminInput
            label="Mật khẩu"
            type="password"
            required={modal === 'create'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            helperText={modal === 'edit' ? 'Để trống nếu không muốn đổi mật khẩu' : 'Tối thiểu 6 ký tự'}
          />
          {modal === 'edit' && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.isBlocked}
                onChange={(e) => setForm({ ...form, isBlocked: e.target.checked })}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              Khóa tài khoản này
            </label>
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
              Lưu thông tin
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
