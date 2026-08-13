'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createUser, deleteUser, listUsers, updateUser } from '../services/users'
import { listCatalog } from '../services/systemCatalog'
import { listClinicRooms } from '../services/clinicRooms'

const ROLES = [
  ['all', 'Tất cả'],
  ['doctor', 'Bác sĩ'],
  ['pharmacist', 'Dược sĩ'],
  ['receptionist', 'Lễ tân'],
  ['branch_manager', 'Quản lý chi nhánh'],
  ['cashier', 'Kế toán / Thu ngân'],
]
const ROLE_LABEL = Object.fromEntries(ROLES)
const ACADEMIC_RANKS = ['BS. CKI', 'BS. CKII', 'Thạc sĩ, BS', 'Tiến sĩ, BS', 'PGS. TS. BS', 'GS. TS. BS', 'Bác sĩ Đa khoa']

const EMPTY = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  role: 'doctor',
  isBlocked: false,
  academicRank: 'BS. CKI',
  licenseNumber: '',
  experienceYears: '5',
  biography: '',
  branchId: '',
  specialtyId: '',
  roomId: '',
}

export default function ClinicStaffPage() {
  const [rows, setRows] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [specialties, setSpecialties] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [resUsers, resBranches, resSpecialties, resRooms] = await Promise.all([
        listUsers(),
        listCatalog('branches').catch(() => []),
        listCatalog('specialties').catch(() => []),
        listClinicRooms().catch(() => []),
      ])
      setRows(resUsers.data.filter((u: any) => ROLES.some(([id]) => id === String(u.role || u.userType).toLowerCase())))
      setBranches(resBranches)
      setSpecialties(resSpecialties)
      setRooms(resRooms)
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
    return rows.filter((row) => {
      const r = String(row.role || row.userType).toLowerCase()
      const q = query.trim().toLowerCase()
      return (filter === 'all' || r === filter) && (!q || `${row.fullName || ''} ${row.email || ''} ${row.phoneNumber || ''}`.toLowerCase().includes(q))
    })
  }, [rows, filter, query])

  const availableRooms = useMemo(() => {
    if (!form.branchId) return rooms
    return rooms.filter((rm) => rm.branchId === form.branchId || rm.branch?.id === form.branchId)
  }, [rooms, form.branchId])

  const openCreate = () => {
    setSelected(null)
    setForm({ ...EMPTY, role: filter === 'all' ? 'doctor' : filter, branchId: branches[0]?.id || '' })
    setError('')
    setModal('create')
  }

  const openEdit = (row: any) => {
    setSelected(row)
    const doc = row.doctor || {}
    const bId = row.branchAssignments?.[0]?.branchId || row.branchAssignments?.[0]?.branch?.id || row.branchId || ''
    const sId = doc.specialties?.[0]?.specialtyId ? String(doc.specialties[0].specialtyId) : doc.specialtyId ? String(doc.specialtyId) : ''
    setForm({
      fullName: row.fullName || '',
      email: row.email || '',
      phoneNumber: row.phoneNumber || '',
      password: '',
      role: String(row.role || row.userType).toLowerCase(),
      isBlocked: Boolean(row.isBlocked),
      academicRank: doc.academicRank || 'BS. CKI',
      licenseNumber: doc.licenseNumber || '',
      experienceYears: doc.experienceYears != null ? String(doc.experienceYears) : '5',
      biography: doc.biography || '',
      branchId: bId,
      specialtyId: sId,
      roomId: doc.roomId || row.roomId || '',
    })
    setError('')
    setModal('edit')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim()) return setError('Vui lòng nhập họ tên và email.')
    if (modal === 'create' && form.password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.')

    setSaving(true)
    setError('')
    try {
      const payload: any = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        isBlocked: form.isBlocked,
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

      if (modal === 'create') await createUser({ ...payload, status: 'active' })
      else await updateUser(selected.id, payload)
      setModal(null)
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không lưu được nhân sự.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: any) {
    if (!confirm(`Xóa tài khoản ${row.fullName || row.email}?`)) return
    try {
      await deleteUser(row.id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không xóa được tài khoản.')
    }
  }

  async function toggle(row: any) {
    try {
      await updateUser(row.id, { isBlocked: !row.isBlocked })
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không cập nhật được trạng thái.')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý người dùng</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Nhân sự phòng khám</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý tài khoản, phân bổ chi nhánh, chuyên khoa và phòng làm việc.</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
          + Thêm nhân sự
        </button>
      </div>

      {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="mt-5 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                  filter === id ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {label}
                <span className="ml-1.5 opacity-70">
                  {id === 'all' ? rows.length : rows.filter((r) => String(r.role || r.userType).toLowerCase() === id).length}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-md rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              placeholder="Tìm theo tên, email, sđt..."
            />
            <button onClick={() => void load()} className="rounded-md border border-slate-200 px-3 text-xs font-semibold hover:bg-slate-50">
              Làm mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Nhân viên', 'Chi nhánh', 'Chuyên khoa', 'Vai trò', 'Trạng thái', 'Thao tác'].map((x) => (
                  <th key={x} className={`px-5 py-3 ${x === 'Thao tác' ? 'text-right' : ''}`}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                    Đang tải dữ liệu…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                    Không có nhân sự phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const bName = row.branchAssignments?.[0]?.branch?.name || row.branchName || 'Chi nhánh chính'
                  const specName = row.doctor?.specialties?.[0]?.specialty?.name || '—'
                  return (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-5 py-3">
                        <b>{row.fullName || 'Chưa cập nhật'}</b>
                        <p className="text-xs text-slate-400">
                          {row.email} {row.phoneNumber ? `• ${row.phoneNumber}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700">{bName}</td>
                      <td className="px-5 py-3 text-xs text-emerald-800 font-medium">{specName}</td>
                      <td className="px-5 py-3 text-slate-600">{ROLE_LABEL[String(row.role || row.userType).toLowerCase()] || row.role}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {row.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => openEdit(row)} className="mr-2 rounded border border-slate-200 px-2.5 py-1.5 text-xs hover:bg-slate-50">
                          Sửa
                        </button>
                        <button onClick={() => void toggle(row)} className="mr-2 rounded border border-amber-200 px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-50">
                          {row.isBlocked ? 'Mở khóa' : 'Khóa'}
                        </button>
                        <button onClick={() => void remove(row)} className="rounded border border-rose-200 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Hiển thị {filtered.length}/{rows.length} nhân sự
        </footer>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4">
          <form onSubmit={submit} className="my-8 w-full max-w-xl rounded-xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <b className="text-base text-slate-900">{modal === 'create' ? 'Thêm nhân sự mới' : 'Cập nhật thông tin nhân sự'}</b>
              <button type="button" onClick={() => setModal(null)} className="text-xl font-bold text-slate-400 hover:text-slate-600">
                ×
              </button>
            </header>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  Họ và tên <span className="text-rose-500">*</span>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="VD: BS. Nguyễn Văn An"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Email <span className="text-rose-500">*</span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="VD: doctor.an@vitacare.local"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  Số điện thoại
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="VD: 0912345678"
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Vai trò
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  >
                    {ROLES.slice(1).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-700">
                  Chi nhánh làm việc
                  <select
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
                  Mật khẩu {modal === 'edit' ? '(để trống nếu giữ nguyên)' : <span className="text-rose-500">*</span>}
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={modal === 'edit' ? '••••••••' : 'Tối thiểu 6 ký tự'}
                    className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              {form.role === 'doctor' && (
                <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Thông tin Bác sĩ & Chuyên môn</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Chuyên khoa đảm nhận
                      <select
                        value={form.specialtyId}
                        onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
                        className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                      >
                        <option value="">-- Chọn chuyên khoa --</option>
                        {specialties.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-bold text-slate-700">
                      Phòng làm việc mặc định
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
                      Học hàm / Học vị
                      <select
                        value={form.academicRank}
                        onChange={(e) => setForm({ ...form, academicRank: e.target.value })}
                        className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                      >
                        {ACADEMIC_RANKS.map((rank) => (
                          <option key={rank} value={rank}>
                            {rank}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-bold text-slate-700">
                      Số CCHN / Giấy phép
                      <input
                        type="text"
                        value={form.licenseNumber}
                        onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                        placeholder="VD: 012345/HCM-CCHN"
                        className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                      />
                    </label>

                    <label className="block text-xs font-bold text-slate-700">
                      Kinh nghiệm (Năm)
                      <input
                        type="number"
                        min="0"
                        value={form.experienceYears}
                        onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                        placeholder="VD: 8"
                        className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-slate-700">
                    Tiểu sử / Giới thiệu chuyên môn
                    <textarea
                      rows={3}
                      value={form.biography}
                      onChange={(e) => setForm({ ...form, biography: e.target.value })}
                      placeholder="Mô tả quá trình học tập, công tác và thế mạnh chuyên môn của bác sĩ..."
                      className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"
                    />
                  </label>
                </div>
              )}
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
                {saving ? 'Đang lưu…' : 'Lưu nhân sự'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  )
}

