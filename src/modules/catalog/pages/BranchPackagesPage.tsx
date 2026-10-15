'use client'

import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { listCatalog, updateCatalog } from '../services/catalogService'
import { usePermission } from '@/common/hooks/usePermission'
import { AppPermission } from '@/common/constants/permissions.constant'
import { money } from '../types/catalog.types'

export default function BranchPackagesPage() {
  const { hasPermission } = usePermission()
  const canUpdate = hasPermission(AppPermission.SERVICE_UPDATE)
  const [packages, setPackages] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [branchId, setBranchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listCatalog('service-packages'), listCatalog('branches'), listCatalog('booking-methods')])
      .then(([p, b, m]) => {
        if (!active) return
        setPackages(p); setBranches(b); setMethods(m); setBranchId(b[0]?.id || '')
      })
      .catch(() => { if (active) setError('Không tải được danh sách gói khám tại chi nhánh.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const branchMethods = methods.filter((m) => m.branchId === branchId)
  const deployedIds = (pkg: any): string[] => [...new Set<string>([
    ...(pkg.branchBookingMethods || []).filter((l: any) => l.branchBookingMethod?.branchId === branchId).map((l: any) => l.branchBookingMethodId),
    ...(pkg.branchBookingMethod?.branchId === branchId ? [pkg.branchBookingMethodId] : []),
  ])]

  const toggle = async (pkg: any, methodId: string, enabled: boolean) => {
    if (!canUpdate) return
    const ids = deployedIds(pkg)
    const next = enabled ? [...new Set([...ids, methodId])] : ids.filter((id) => id !== methodId)
    setSaving(pkg.id); setError('')
    try {
      await updateCatalog('branch-packages', pkg.id, { branchId, branchBookingMethodIds: next })
      setPackages(await listCatalog('service-packages'))
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không cập nhật được gói khám tại chi nhánh.')
    } finally { setSaving(null) }
  }

  const filtered = packages.filter((p) => `${p.name} ${p.code}`.toLowerCase().includes(q.trim().toLowerCase()))

  return <div>
    <h1 className="text-2xl font-bold text-slate-950">Gói khám tại chi nhánh</h1>
    <p className="mt-2 text-sm text-slate-500">Chọn hình thức nhận đặt cho từng gói khám. Nội dung và giá gói do quản trị viên thiết lập dùng chung.</p>
    {error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
    <div className="mt-5 flex flex-wrap gap-3">
      <select aria-label="Chi nhánh" disabled={loading || saving !== null} value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
        {!branches.length && <option value="">Chưa được phân công chi nhánh</option>}
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <input aria-label="Tìm gói khám" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên hoặc mã gói khám" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </div>
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Gói khám</th><th className="p-4">Giá chuẩn</th><th className="p-4">Hình thức nhận đặt tại chi nhánh</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={3} className="p-8 text-center text-slate-500">Đang tải dữ liệu…</td></tr> : filtered.map((pkg) => <tr key={pkg.id} className="border-t border-slate-100">
            <td className="p-4"><p className="font-semibold">{pkg.name}</p><p className="text-xs text-slate-500">{pkg.code}{!pkg.isActive && ' · Đã ngừng hoạt động'}</p></td>
            <td className="p-4 whitespace-nowrap">{money(pkg.price)}</td>
            <td className="p-4"><div className="flex flex-wrap items-center gap-3">
              {branchMethods.map((m) => {
                const checked = deployedIds(pkg).includes(m.id)
                const available = pkg.isActive && m.isEnabled && m.bookingMethod?.isActive !== false
                return <label key={m.id} className="flex items-center gap-2"><input type="checkbox" checked={checked} disabled={!canUpdate || saving !== null || (!available && !checked)} onChange={(e) => void toggle(pkg, m.id, e.target.checked)} className="accent-emerald-700" />{m.displayName}{!m.isEnabled && ' (tạm dừng)'}</label>
              })}
              {!branchMethods.length && <span className="text-slate-500">Chi nhánh chưa có hình thức đặt khám.</span>}
              {saving === pkg.id && <LoaderCircle aria-label="Đang lưu" className="h-4 w-4 animate-spin text-emerald-700" />}
            </div></td>
          </tr>)}
          {!loading && !filtered.length && <tr><td colSpan={3} className="p-8 text-center text-slate-500">Không có gói khám phù hợp.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
