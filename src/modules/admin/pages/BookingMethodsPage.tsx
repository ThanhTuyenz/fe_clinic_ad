'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiErrorMessage } from '@/lib/api-client'
import { createCatalog, listCatalog, updateCatalog } from '../services/systemCatalog'

const TYPES = [
  ['SPECIALTY_EXAM', 'Đặt khám theo chuyên khoa', 'Chọn chuyên khoa, dịch vụ, bác sĩ và thời gian khám.'],
  ['HEALTH_PACKAGE', 'Gói khám sức khỏe', 'Đăng ký gói khám theo phòng và ngày tổ chức.'],
  ['CONSULTATION', 'Tư vấn khám bệnh', 'Tư vấn ban đầu với bác sĩ chuyên khoa.'],
  ['AFTER_HOURS', 'Đặt khám ngoài giờ', 'Khám ngoài khung giờ hành chính.'],
] as const

type Branch = { id: string; name: string }
type BookingMethod = {
  id: string
  branchId: string
  type: string
  displayName: string
  description?: string | null
  isEnabled: boolean
  sortOrder: number
}

export default function BookingMethodsPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [methods, setMethods] = useState<BookingMethod[]>([])
  const [branchId, setBranchId] = useState('')
  const [saving, setSaving] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState('')

  async function load() {
    setLoading(true)
    setError('')

    try {
      const branchRows = await listCatalog('branches') as Branch[]
      setBranches(branchRows)
      setBranchId((current) => {
        if (branchRows.some((branch) => branch.id === current)) return current
        return branchRows[0]?.id ?? ''
      })

      try {
        setMethods(await listCatalog('booking-methods') as BookingMethod[])
      } catch (methodError) {
        setMethods([])
        setError(apiErrorMessage(methodError, 'Không tải được cấu hình hình thức đặt khám.'))
      }
    } catch (branchError) {
      setBranches([])
      setBranchId('')
      setError(apiErrorMessage(branchError, 'Không tải được danh sách chi nhánh.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const current = useMemo(
    () => methods.filter((method) => method.branchId === branchId),
    [methods, branchId],
  )
  const missingTypes = useMemo(
    () => TYPES.filter(([type]) => !current.some((method) => method.type === type)),
    [current],
  )

  async function toggle(type: string, displayName: string, description: string) {
    if (!branchId) return
    const row = current.find((method) => method.type === type)
    setSaving(type)
    setError('')

    try {
      if (row) {
        const nextEnabled = !row.isEnabled
        setMethods((items) => items.map((item) => item.id === row.id ? { ...item, isEnabled: nextEnabled } : item))
        try {
          const updated = await updateCatalog('booking-methods', row.id, { ...row, isEnabled: nextEnabled }) as BookingMethod
          setMethods((items) => items.map((item) => item.id === row.id ? { ...item, ...updated } : item))
        } catch (updateError) {
          setMethods((items) => items.map((item) => item.id === row.id ? row : item))
          throw updateError
        }
      } else {
        const created = await createCatalog('booking-methods', {
          branchId,
          type,
          displayName,
          description,
          isEnabled: true,
          sortOrder: TYPES.findIndex((method) => method[0] === type) + 1,
        }) as BookingMethod
        setMethods((items) => [...items, created])
      }
    } catch (saveError) {
      setError(apiErrorMessage(saveError, 'Không lưu được cấu hình.'))
    } finally {
      setSaving('')
    }
  }

  async function addMethod() {
    const definition = TYPES.find(([type]) => type === newType)
    if (!definition) return
    await toggle(...definition)
    setNewType('')
    setShowAdd(false)
  }

  return (
    <section className="w-full">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý hệ thống</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Quản lý hình thức đặt khám</h1>
          <p className="mt-1 text-sm text-slate-500">Bật hoặc tắt hình thức bệnh nhân được phép sử dụng tại từng cơ sở.</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
          <label className="block w-full lg:w-[320px]">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">Chi nhánh áp dụng</span>
            <select
              value={branchId}
              onChange={(event) => { setBranchId(event.target.value); setShowAdd(false); setNewType('') }}
              disabled={loading || branches.length === 0}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
            >
              {loading && <option value="">Đang tải chi nhánh...</option>}
              {!loading && branches.length === 0 && <option value="">Chưa có chi nhánh</option>}
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <button
            type="button"
            disabled={!branchId || loading}
            onClick={() => setShowAdd((visible) => !visible)}
            className="h-11 shrink-0 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Thêm hình thức
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {showAdd && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
          <h2 className="font-bold text-slate-900">Thêm hình thức cho chi nhánh</h2>
          {missingTypes.length ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                value={newType}
                onChange={(event) => setNewType(event.target.value)}
                className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Chọn hình thức chưa được cấu hình</option>
                {missingTypes.map(([type, name]) => <option key={type} value={type}>{name}</option>)}
              </select>
              <button
                type="button"
                disabled={!newType || Boolean(saving)}
                onClick={() => void addMethod()}
                className="h-11 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Đang thêm...' : 'Thêm vào chi nhánh'}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setNewType('') }} className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-600">Hủy</button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Chi nhánh đã có đủ 4 hình thức chuẩn. Bạn có thể bật hoặc tắt từng hình thức bên dưới.</p>
          )}
        </div>
      )}

      {!loading && branches.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Chưa có chi nhánh để cấu hình hình thức đặt khám.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {TYPES.map(([type, name, description]) => {
            const row = current.find((method) => method.type === type)
            const enabled = row?.isEnabled ?? false
            return (
              <article key={type} className={`rounded-xl border bg-white p-5 ${enabled ? 'border-emerald-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{type}</span>
                    <h2 className="mt-1 font-bold text-slate-900">{name}</h2>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`${enabled ? 'Tắt' : 'Bật'} ${name}`}
                    disabled={!branchId || saving === type}
                    onClick={() => void toggle(type, name, description)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <p className={`mt-4 text-xs font-bold ${enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {saving === type ? 'Đang cập nhật...' : !row ? 'Chưa được cấu hình tại chi nhánh' : enabled ? 'Đang hiển thị trên website' : 'Đã tắt tại chi nhánh này'}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
