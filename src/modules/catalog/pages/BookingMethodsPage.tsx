'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiErrorMessage } from '@/lib/api-client'
import {
  createCatalog,
  deleteCatalog,
  listCatalog,
  updateCatalog,
} from '../services/catalogService'
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminTextarea,
} from '@/common/components/ui'

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

const EMPTY = {
  code: '',
  displayName: '',
  description: '',
  route: '',
  sortOrder: 0,
  isEnabled: true,
}

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
      setBranchId((val) =>
        keepBranch && branchRows.some((b) => b.id === val) ? val : branchRows[0]?.id || ''
      )
      try {
        setMethods((await listCatalog('booking-methods')) as BookingMethod[])
      } catch (err) {
        setMethods([])
        setError(apiErrorMessage(err, 'Không tải được hình thức đặt khám.'))
      }
    } catch (err) {
      setBranches([])
      setError(apiErrorMessage(err, 'Không tải được chi nhánh.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(false)
  }, [])

  const current = useMemo(
    () =>
      methods
        .filter((m) => m.branchId === branchId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [branchId, methods]
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

  async function toggle(row: BookingMethod) {
    setSaving(row.id)
    const next = !row.isEnabled
    setMethods((items) =>
      items.map((m) => (m.id === row.id ? { ...m, isEnabled: next } : m))
    )
    try {
      await updateCatalog('booking-methods', row.id, {
        isEnabled: next,
        sortOrder: row.sortOrder,
      })
    } catch (err) {
      setMethods((items) => items.map((m) => (m.id === row.id ? row : m)))
      setError(apiErrorMessage(err, 'Không cập nhật được hình thức.'))
    } finally {
      setSaving('')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const code = form.code.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_')
    if (!code || !form.displayName.trim()) {
      setError('Vui lòng nhập đầy đủ mã và tên hình thức.')
      return
    }

    setSaving('modal')
    setError('')
    try {
      if (modal === 'create') {
        const created = (await createCatalog('booking-methods', {
          branchId,
          code,
          type: code,
          displayName: form.displayName.trim(),
          description: form.description.trim() || undefined,
          route: form.route.trim() || undefined,
          sortOrder: Number(form.sortOrder) || 0,
          isEnabled: form.isEnabled,
        })) as BookingMethod
        setMethods((items) => [...items, created])
      } else if (selected) {
        const updated = (await updateCatalog('booking-methods', selected.id, {
          displayName: form.displayName.trim(),
          description: form.description.trim() || undefined,
          route: form.route.trim() || undefined,
          sortOrder: Number(form.sortOrder) || 0,
          isEnabled: form.isEnabled,
        })) as BookingMethod
        setMethods((items) => items.map((m) => (m.id === selected.id ? updated : m)))
      }
      setModal(null)
    } catch (err) {
      setError(apiErrorMessage(err, 'Không lưu được hình thức đặt khám.'))
    } finally {
      setSaving('')
    }
  }

  async function remove(row: BookingMethod) {
    if (!confirm(`Ngừng dùng hình thức “${row.displayName}” tại chi nhánh này?`)) return
    setSaving(row.id)
    try {
      await deleteCatalog('booking-methods', row.id)
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Không ngừng dùng được hình thức.'))
    } finally {
      setSaving('')
    }
  }

  return (
    <section className="w-full">
      <AdminPageHeader
        eyebrow="Quản lý danh mục & Cơ sở"
        title="Quản lý hình thức đặt khám"
        description="Cấu hình hình thức đặt khám theo từng chi nhánh. Bật/tắt chỉ áp dụng tại cơ sở đang chọn."
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <label className="w-full sm:w-72">
            <span className="mb-1.5 block text-xs font-bold uppercase text-slate-600">
              Chi nhánh
            </span>
            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value)
                setModal(null)
              }}
              disabled={loading || !branches.length}
              className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-xs"
            >
              <option value="">Chọn chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <AdminButton
            variant="primary"
            icon={Plus}
            disabled={!branchId}
            onClick={openCreate}
          >
            Thêm hình thức
          </AdminButton>
        </div>
      </AdminPageHeader>

      {error && (
        <div className="mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded bg-white border border-slate-100"
            />
          ))
        ) : current.length ? (
          current.map((row) => (
            <article
              key={row.id}
              className={`rounded border bg-white p-5 shadow-xs transition-all ${
                row.isEnabled ? 'border-emerald-200' : 'border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-600">
                    {row.code}
                  </span>
                  <h2 className="mt-1.5 font-bold text-slate-900">{row.displayName}</h2>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {row.description || 'Chưa có mô tả.'}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Đường dẫn: {row.route || 'Mặc định'} · Thứ tự: {row.sortOrder}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving === row.id}
                  onClick={() => void toggle(row)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                    row.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  title={row.isEnabled ? 'Bấm để tắt' : 'Bấm để bật'}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      row.isEnabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    row.isEnabled ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {row.isEnabled ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {saving === row.id
                    ? 'Đang lưu...'
                    : row.isEnabled
                    ? 'Đang hoạt động'
                    : 'Đã tắt'}
                </span>
                <div className="flex gap-1.5">
                  <AdminButton
                    variant="secondary"
                    size="xs"
                    icon={Edit2}
                    onClick={() => openEdit(row)}
                  >
                    Sửa
                  </AdminButton>
                  {row.isEnabled && (
                    <AdminButton
                      variant="outline"
                      size="xs"
                      icon={Trash2}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      disabled={saving === row.id}
                      onClick={() => void remove(row)}
                    >
                      Tắt
                    </AdminButton>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="col-span-2 rounded border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
            Chi nhánh chưa có hình thức đặt khám nào.
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <AdminModal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Thêm hình thức mới' : 'Cập nhật hình thức'}
        loading={saving === 'modal'}
      >
        <form onSubmit={submit} className="space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Mã hình thức"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="VD: SPECIALTY"
              disabled={modal === 'edit'}
              className="uppercase"
            />
            <AdminInput
              label="Tên hiển thị"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="VD: Khám theo chuyên khoa"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Đường dẫn (route)"
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              placeholder="VD: /booking/specialty"
            />
            <AdminInput
              label="Thứ tự hiển thị"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
            />
          </div>
          <AdminTextarea
            label="Mô tả ngắn"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả giúp người bệnh dễ dàng lựa chọn hình thức này..."
            rows={2}
          />
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isEnabled}
                onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              Bật hoạt động ngay
            </label>
            <div className="flex gap-2">
              <AdminButton
                variant="secondary"
                disabled={saving === 'modal'}
                onClick={() => setModal(null)}
              >
                Hủy
              </AdminButton>
              <AdminButton
                variant="primary"
                type="submit"
                loading={saving === 'modal'}
              >
                {modal === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
              </AdminButton>
            </div>
          </div>
        </form>
      </AdminModal>
    </section>
  )
}
