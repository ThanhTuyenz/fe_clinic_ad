'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { createUser, deleteUser, listUsers, updateUser } from '../services/users'

const LABELS = {
  doctor: { title: 'Quản lý bác sĩ', singular: 'bác sĩ', code: 'BS' },
  pharmacist: { title: 'Quản lý dược sĩ', singular: 'dược sĩ', code: 'DS' },
}

const EMPTY_FORM = { fullName: '', email: '', password: '', status: 'active', isBlocked: false }

function errorMessage(error: any) {
  if (axios.isAxiosError(error)) return String(error.response?.data?.message || error.message || 'Không thể xử lý yêu cầu.')
  return String(error?.message || 'Không thể xử lý yêu cầu.')
}

export default function StaffCrudPage({ role }: { role: 'doctor' | 'pharmacist' }) {
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
    setLoading(true); setError('')
    try {
      const result = await listUsers()
      setRows(result.data.filter((user: any) => String(user.role || user.userType).toLowerCase() === role))
    } catch (e) { setError(errorMessage(e)) } finally { setLoading(false) }
  }, [role])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return rows
    return rows.filter((row) => `${row.fullName || ''} ${row.email || ''}`.toLowerCase().includes(value))
  }, [query, rows])

  function openCreate() { setSelected(null); setForm(EMPTY_FORM); setError(''); setModal('create') }
  function openEdit(row: any) { setSelected(row); setForm({ fullName: row.fullName || '', email: row.email || '', password: '', status: row.status || 'active', isBlocked: Boolean(row.isBlocked) }); setError(''); setModal('edit') }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    if (!form.fullName.trim() || !form.email.trim()) return setError('Vui lòng nhập họ tên và email.')
    if (modal === 'create' && form.password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.')
    setSaving(true)
    try {
      if (modal === 'create') await createUser({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password, role, status: 'active' })
      else await updateUser(selected.id, { fullName: form.fullName.trim(), email: form.email.trim(), status: form.status, isBlocked: form.isBlocked, ...(form.password ? { password: form.password } : {}) })
      setModal(null); await load()
    } catch (e) { setError(errorMessage(e)) } finally { setSaving(false) }
  }

  async function toggleBlocked(row: any) {
    if (!confirm(`${row.isBlocked ? 'Mở khóa' : 'Khóa'} tài khoản ${row.fullName || row.email}?`)) return
    try { await updateUser(row.id, { isBlocked: !row.isBlocked }); await load() } catch (e) { setError(errorMessage(e)) }
  }

  async function remove(row: any) {
    if (!confirm(`Xóa ${meta.singular} ${row.fullName || row.email}? Thao tác này sẽ vô hiệu hóa tài khoản.`)) return
    try { await deleteUser(row.id); await load() } catch (e) { setError(errorMessage(e)) }
  }

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý nhân sự</p><h1 className="mt-1 text-2xl font-bold text-slate-950">{meta.title}</h1><p className="mt-1 text-sm text-slate-500">Danh sách tài khoản {meta.singular} thuộc hệ thống.</p></div><button onClick={openCreate} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">+ Thêm {meta.singular}</button></div>
    {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <section className="mt-5 rounded-lg border border-slate-200 bg-white"><div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4"><input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full max-w-md rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600" placeholder={`Tìm tên hoặc email ${meta.singular}...`}/><button onClick={()=>void load()} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Làm mới</button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Nhân viên</th><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody>{loading?<tr><td colSpan={5} className="px-5 py-16 text-center text-slate-400">Đang tải dữ liệu…</td></tr>:filtered.length===0?<tr><td colSpan={5} className="px-5 py-16 text-center text-slate-400">Chưa có {meta.singular} phù hợp.</td></tr>:filtered.map((row,index)=><tr key={row.id} className="border-t border-slate-100"><td className="px-5 py-3"><b className="text-slate-900">{row.fullName || 'Chưa cập nhật'}</b><p className="mt-1 text-xs text-slate-400">{row.email}</p></td><td className="px-5 py-3 font-mono text-xs text-slate-500">{meta.code}-{String(index+1).padStart(3,'0')}</td><td className="px-5 py-3 text-slate-600">{role==='doctor'?'Bác sĩ':'Dược sĩ'}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.isBlocked||row.status==='inactive'?'bg-rose-50 text-rose-700':'bg-emerald-50 text-emerald-700'}`}>{row.isBlocked?'Đã khóa':row.status==='inactive'?'Ngưng hoạt động':'Hoạt động'}</span></td><td className="px-5 py-3 text-right"><button onClick={()=>openEdit(row)} className="mr-2 rounded border border-slate-200 px-2.5 py-1.5 text-xs">Sửa</button><button onClick={()=>void toggleBlocked(row)} className="mr-2 rounded border border-amber-200 px-2.5 py-1.5 text-xs text-amber-700">{row.isBlocked?'Mở khóa':'Khóa'}</button><button onClick={()=>void remove(row)} className="rounded border border-rose-200 px-2.5 py-1.5 text-xs text-rose-700">Xóa</button></td></tr>)}</tbody></table></div><footer className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Tổng cộng {filtered.length} {meta.singular}</footer></section>
    {modal&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget&&!saving)setModal(null)}}><form onSubmit={submit} className="w-full max-w-lg rounded-lg bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">{modal==='create'?'Thêm':'Cập nhật'} {meta.singular}</h2><button type="button" onClick={()=>setModal(null)} className="text-xl text-slate-400">×</button></header><div className="space-y-4 p-5"><label className="block text-xs font-bold text-slate-600">Họ và tên<input value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"/></label><label className="block text-xs font-bold text-slate-600">Email<input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"/></label><label className="block text-xs font-bold text-slate-600">Mật khẩu {modal==='edit'&&<span className="font-normal text-slate-400">(để trống nếu không đổi)</span>}<input type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"/></label>{modal==='edit'&&<label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.isBlocked} onChange={(e)=>setForm({...form,isBlocked:e.target.checked})}/> Khóa tài khoản</label>}</div><footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4"><button type="button" disabled={saving} onClick={()=>setModal(null)} className="rounded-md border border-slate-200 px-4 py-2 text-sm">Hủy</button><button disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving?'Đang lưu…':'Lưu thông tin'}</button></footer></form></div>}
  </>
}
