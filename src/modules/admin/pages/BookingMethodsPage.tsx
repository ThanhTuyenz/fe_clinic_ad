'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiErrorMessage } from '@/lib/api-client'
import { createCatalog, deleteCatalog, listCatalog, updateCatalog } from '../services/systemCatalog'

type Branch = { id: string; name: string }
type BookingMethod = {
  id: string
  branchId: string
  bookingMethodId: string
  code: string
  type: string
  displayName: string
  description?: string | null
  route?: string | null
  isEnabled: boolean
  sortOrder: number
}

const EMPTY = { code: '', displayName: '', description: '', route: '', sortOrder: 0, isEnabled: true }

export default function BookingMethodsPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [methods, setMethods] = useState<BookingMethod[]>([])
  const [branchId, setBranchId] = useState('')
  const [saving, setSaving] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<BookingMethod | null>(null)
  const [form, setForm] = useState(EMPTY)

  async function load(keepBranch = true) {
    setLoading(true)
    setError('')
    try {
      const branchRows = (await listCatalog('branches')) as Branch[]
      setBranches(branchRows)
      setBranchId((value) => {
        if (keepBranch && branchRows.some((branch) => branch.id === value)) return value
        return branchRows[0]?.id || ''
      })
      try {
        setMethods((await listCatalog('booking-methods')) as BookingMethod[])
      } catch (cause) {
        setMethods([])
        setError(apiErrorMessage(cause, 'Không tải được hình thức đặt khám.'))
      }
    } catch (cause) {
      setBranches([])
      setBranchId('')
      setError(apiErrorMessage(cause, 'Không tải được chi nhánh.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(false)
  }, [])

  const current = useMemo(
    () => methods.filter((item) => item.branchId === branchId).sort((a, b) => a.sortOrder - b.sortOrder),
    [branchId, methods],
  )

  function openCreate() {
    setSelected(null)
    setForm({ ...EMPTY, sortOrder: current.length + 1 })
    setError('')
    setModal('create')
  }

  function openEdit(row: BookingMethod) {
    setSelected(row)
    setForm({
      code: row.code || '',
      displayName: row.displayName || '',
      description: row.description || '',
      route: row.route || '',
      sortOrder: row.sortOrder || 0,
      isEnabled: row.isEnabled,
    })
    setError('')
    setModal('edit')
  }

  function closeModal() {
    if (saving) return
    setModal(null)
    setSelected(null)
    setForm(EMPTY)
  }

  async function toggle(row: BookingMethod) {
    setSaving(row.id)
    setError('')
    const next = !row.isEnabled
    setMethods((items) => items.map((item) => (item.id === row.id ? { ...item, isEnabled: next } : item)))
    try {
      await updateCatalog('booking-methods', row.id, { isEnabled: next, sortOrder: row.sortOrder })
    } catch (cause) {
      setMethods((items) => items.map((item) => (item.id === row.id ? row : item)))
      setError(apiErrorMessage(cause, 'Không cập nhật được hình thức.'))
    } finally {
      setSaving('')
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const code = form.code.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_')
    if (!branchId) return setError('Vui lòng chọn chi nhánh.')
    if (modal === 'create' && !code) return setError('Vui lòng nhập mã hình thức.')
    if (!form.displayName.trim()) return setError('Vui lòng nhập tên hiển thị.')

    setSaving(modal === 'create' ? 'create' : selected?.id || 'save')
    setError('')
    try {
      if (modal === 'create') {
        await createCatalog('booking-methods', {
          ...form,
          code,
          type: code,
          branchId,
          sortOrder: form.sortOrder || current.length + 1,
        })
      } else if (selected) {
        await updateCatalog('booking-methods', selected.id, {
          displayName: form.displayName.trim(),
          description: form.description.trim(),
          route: form.route.trim(),
          sortOrder: Number(form.sortOrder) || 0,
          isEnabled: form.isEnabled,
        })
      }
      setModal(null)
      setSelected(null)
      setForm(EMPTY)
      await load()
    } catch (cause) {
      setError(apiErrorMessage(cause, modal === 'create' ? 'Không thêm được hình thức đặt khám.' : 'Không lưu được hình thức đặt khám.'))
    } finally {
      setSaving('')
    }
  }

  async function remove(row: BookingMethod) {
    if (!confirm(`Ngừng dùng hình thức “${row.displayName}” tại chi nhánh này?`)) return
    setSaving(row.id)
    setError('')
    try {
      await deleteCatalog('booking-methods', row.id)
      await load()
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không ngừng dùng được hình thức.'))
    } finally {
      setSaving('')
    }
  }

  return (
    <section className="w-full">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý danh mục & Cơ sở</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Quản lý hình thức đặt khám</h1>
          <p className="mt-1 text-sm text-slate-500">Cấu hình hình thức đặt khám theo từng chi nhánh. Bật/tắt chỉ áp dụng tại cơ sở đang chọn.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="w-full sm:w-80">
            <span className="mb-2 block text-xs font-bold uppercase text-slate-600">Chi nhánh áp dụng</span>
            <select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value)
                closeModal()
              }}
              disabled={loading || !branches.length}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Chọn chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={openCreate} disabled={!branchId} className="h-11 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-50">
            + Thêm hình thức
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? (
          [1, 2, 3, 4].map((item) => <div key={item} className="h-44 animate-pulse rounded-xl bg-white" />)
        ) : current.length ? (
          current.map((row) => (
            <article key={row.id} className={`rounded-xl border bg-white p-5 ${row.isEnabled ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.code}</span>
                  <h2 className="mt-1 font-bold text-slate-900">{row.displayName}</h2>
                  <p className="mt-2 text-sm leading-5 text-slate-500">{row.description || 'Chưa có mô tả.'}</p>
                  {row.route && <p className="mt-2 text-xs text-slate-400">{row.route}</p>}
                  <p className="mt-2 text-xs text-slate-400">Thứ tự hiển thị: {row.sortOrder}</p>
                </div>
                <button
                  type="button"
                  disabled={saving === row.id}
                  onClick={() => void toggle(row)}
                  className={`relative h-7 w-12 shrink-0 rounded-full ${row.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  aria-label={row.isEnabled ? 'Tắt hình thức' : 'Bật hình thức'}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${row.isEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className={`text-xs font-bold ${row.isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {saving === row.id ? 'Đang cập nhật...' : row.isEnabled ? 'Đang hiển thị trên website' : 'Đã tắt tại chi nhánh này'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(row)} className="rounded border border-slate-200 px-3 py-1.5 text-xs">
                    Sửa
                  </button>
                  {row.isEnabled && (
                    <button
                      onClick={() => void remove(row)}
                      disabled={saving === row.id}
                      className="rounded border border-rose-200 px-3 py-1.5 text-xs text-rose-700 disabled:opacity-50"
                    >
                      Ngừng dùng
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500 md:col-span-2">
            Chi nhánh chưa có hình thức đặt khám.
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form onSubmit={submit} className="my-6 w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">{modal === 'create' ? 'Thêm hình thức cho chi nhánh' : 'Cập nhật hình thức đặt khám'}</h2>
                {modal === 'edit' && (
                  <p className="mt-1 text-xs font-normal text-slate-500">Tên, mô tả và đường dẫn dùng chung cho mọi chi nhánh có cùng mã.</p>
                )}
              </div>
              <button type="button" onClick={closeModal} className="text-xl text-slate-400">
                ×
              </button>
            </header>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">
                Mã hình thức
                <input
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  placeholder="VD: VACCINATION"
                  disabled={modal === 'edit'}
                  className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal uppercase disabled:bg-slate-50 disabled:text-slate-500"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Tên hiển thị
                <input
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  placeholder="VD: Đặt lịch tiêm chủng"
                  className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Đường dẫn frontend
                <input
                  value={form.route}
                  onChange={(event) => setForm({ ...form, route: event.target.value })}
                  placeholder="/dat-lich/tiem-chung"
                  className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Thứ tự
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
                  className="mt-1.5 h-11 w-full rounded-lg border px-3 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600 md:col-span-2">
                Mô tả
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm font-normal"
                />
              </label>
              {modal === 'edit' && (
                <label className="flex items-center gap-2 text-sm font-normal text-slate-700 md:col-span-2">
                  <input type="checkbox" checked={form.isEnabled} onChange={(event) => setForm({ ...form, isEnabled: event.target.checked })} />
                  Đang hiển thị tại chi nhánh này
                </label>
              )}
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-4">
              <button type="button" onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm">
                Hủy
              </button>
              <button disabled={Boolean(saving)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                {saving ? 'Đang lưu…' : modal === 'create' ? 'Thêm vào chi nhánh' : 'Lưu dữ liệu'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  )
}
