'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiErrorMessage } from '@/lib/api-client'
import { createCatalog, listCatalog, updateCatalog } from '../services/systemCatalog'

type Branch = { id: string; name: string }
type BookingMethod = { id: string; branchId: string; bookingMethodId: string; code: string; type: string; displayName: string; description?: string | null; route?: string | null; isEnabled: boolean; sortOrder: number }
const EMPTY = { code: '', displayName: '', description: '', route: '', sortOrder: 0 }

export default function BookingMethodsPage() {
  const [branches, setBranches] = useState<Branch[]>([]), [methods, setMethods] = useState<BookingMethod[]>([])
  const [branchId, setBranchId] = useState(''), [saving, setSaving] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false), [form, setForm] = useState(EMPTY)

  async function load() {
    setLoading(true); setError('')
    try {
      const branchRows = await listCatalog('branches') as Branch[]
      setBranches(branchRows); setBranchId((value) => branchRows.some((branch) => branch.id === value) ? value : branchRows[0]?.id || '')
      try { setMethods(await listCatalog('booking-methods') as BookingMethod[]) } catch (cause) { setMethods([]); setError(apiErrorMessage(cause, 'Không tải được hình thức đặt khám.')) }
    } catch (cause) { setBranches([]); setBranchId(''); setError(apiErrorMessage(cause, 'Không tải được chi nhánh.')) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  const current = useMemo(() => methods.filter((item) => item.branchId === branchId).sort((a, b) => a.sortOrder - b.sortOrder), [branchId, methods])

  async function toggle(row: BookingMethod) {
    setSaving(row.id); setError(''); const next = !row.isEnabled
    setMethods((items) => items.map((item) => item.id === row.id ? { ...item, isEnabled: next } : item))
    try { await updateCatalog('booking-methods', row.id, { isEnabled: next, sortOrder: row.sortOrder }) }
    catch (cause) { setMethods((items) => items.map((item) => item.id === row.id ? row : item)); setError(apiErrorMessage(cause, 'Không cập nhật được hình thức.')) }
    finally { setSaving('') }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault(); const code = form.code.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_')
    if (!branchId || !code || !form.displayName.trim()) return setError('Vui lòng nhập mã và tên hình thức.')
    setSaving('create'); setError('')
    try {
      const created = await createCatalog('booking-methods', { ...form, code, type: code, branchId, sortOrder: form.sortOrder || current.length + 1 }) as BookingMethod
      setMethods((items) => [...items, created]); setForm(EMPTY); setShowAdd(false)
    } catch (cause) { setError(apiErrorMessage(cause, 'Không thêm được hình thức đặt khám.')) }
    finally { setSaving('') }
  }

  return <section className="w-full"><div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý hệ thống</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Quản lý hình thức đặt khám</h1><p className="mt-1 text-sm text-slate-500">Danh mục động và cấu hình áp dụng riêng tại từng cơ sở.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="w-full sm:w-80"><span className="mb-2 block text-xs font-bold uppercase text-slate-600">Chi nhánh áp dụng</span><select value={branchId} onChange={(event) => { setBranchId(event.target.value); setShowAdd(false) }} disabled={loading || !branches.length} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">Chọn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><button onClick={() => setShowAdd((value) => !value)} disabled={!branchId} className="h-11 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-50">+ Thêm hình thức</button></div></div>
    {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    {showAdd && <form onSubmit={add} className="mt-5 rounded-xl border border-emerald-200 bg-white p-5"><h2 className="font-bold text-slate-900">Thêm hình thức cho chi nhánh</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-xs font-bold text-slate-600">Mã hình thức<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="VD: VACCINATION" className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-600">Tên hiển thị<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="VD: Đặt lịch tiêm chủng" className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-600">Đường dẫn frontend<input value={form.route} onChange={(event) => setForm({ ...form, route: event.target.value })} placeholder="/dat-lich/tiem-chung" className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-600">Thứ tự<input type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-600 md:col-span-2">Mô tả<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm font-normal" /></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 text-sm">Hủy</button><button disabled={saving === 'create'} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">{saving === 'create' ? 'Đang thêm...' : 'Thêm vào chi nhánh'}</button></div></form>}
    <div className="mt-6 grid gap-4 md:grid-cols-2">{loading ? [1,2,3,4].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-white" />) : current.length ? current.map((row) => <article key={row.id} className={`rounded-xl border bg-white p-5 ${row.isEnabled ? 'border-emerald-200' : 'border-slate-200'}`}><div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.code}</span><h2 className="mt-1 font-bold text-slate-900">{row.displayName}</h2><p className="mt-2 text-sm leading-5 text-slate-500">{row.description || 'Chưa có mô tả.'}</p>{row.route && <p className="mt-2 text-xs text-slate-400">{row.route}</p>}</div><button type="button" disabled={saving === row.id} onClick={() => void toggle(row)} className={`relative h-7 w-12 shrink-0 rounded-full ${row.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${row.isEnabled ? 'left-6' : 'left-1'}`} /></button></div><p className={`mt-4 text-xs font-bold ${row.isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>{saving === row.id ? 'Đang cập nhật...' : row.isEnabled ? 'Đang hiển thị trên website' : 'Đã tắt tại chi nhánh này'}</p></article>) : <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500 md:col-span-2">Chi nhánh chưa có hình thức đặt khám.</div>}</div>
  </section>
}
