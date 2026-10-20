'use client'

import { useEffect, useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import { listCatalog, updateCatalog } from '../services/catalogService'
import { usePermission } from '@/common/hooks/usePermission'
import { AppPermission } from '@/common/constants/permissions.constant'
import { money, ReceptionDay, formatReceptionSchedule } from '../types/catalog.types'
import PackageBranchSchedulesField from '../components/PackageBranchSchedulesField'

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
  const [editing, setEditing] = useState<any>(null)
  const [scheduleDays, setScheduleDays] = useState<ReceptionDay[]>([])
  const [scheduleError, setScheduleError] = useState('')
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([])

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

  const branchMethods = methods.filter((m) => m.branchId === branchId && ['SPECIALTY_EXAM', 'AFTER_HOURS', 'HEALTH_PACKAGE'].includes(m.code))
  const deployedIds = (pkg: any): string[] => [...new Set<string>([
    ...(pkg.branchBookingMethods || []).filter((l: any) => l.branchBookingMethod?.branchId === branchId).map((l: any) => l.branchBookingMethodId),
    ...(pkg.branchBookingMethod?.branchId === branchId ? [pkg.branchBookingMethodId] : []),
  ])]

  const saveSchedule = async () => {
    if (!editing || !canUpdate || saving) return
    setSaving(editing.id); setScheduleError('')
    try {
      await updateCatalog('branch-packages', editing.id, {
        branchId,
        branchBookingMethodIds: selectedMethodIds,
        schedules: selectedMethodIds.length ? scheduleDays.map(({ dayOfWeek, sessions }) => ({ dayOfWeek, sessions })) : [],
      })
      setPackages(await listCatalog('service-packages'))
      setEditing(null)
    } catch (e: any) {
      setScheduleError(e?.response?.data?.message || 'Không lưu được lịch tiếp nhận.')
    } finally { setSaving(null) }
  }

  const filtered = packages.filter((p) => `${p.name} ${p.code}`.toLowerCase().includes(q.trim().toLowerCase()))

  return <div>
    <h1 className="text-2xl font-bold text-slate-950">Gói khám tại chi nhánh</h1>
    <p className="mt-2 text-sm text-slate-500">Quản lý ngày và buổi tiếp nhận từng gói tại chi nhánh. Nội dung và giá gói do quản lý chuỗi thiết lập dùng chung.</p>
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
        <thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Gói khám</th><th className="p-4">Giá chuẩn</th><th className="p-4">Lịch tiếp nhận tại chi nhánh</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={3} className="p-8 text-center text-slate-500">Đang tải dữ liệu…</td></tr> : filtered.map((pkg) => <tr key={pkg.id} className="border-t border-slate-100">
            <td className="p-4"><p className="font-semibold">{pkg.name}</p><p className="text-xs text-slate-500">{pkg.code}{!pkg.isActive && ' · Đã ngừng hoạt động'}</p></td>
            <td className="p-4 whitespace-nowrap">{money(pkg.price)}</td>
            <td className="p-4"><div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {branchMethods.filter((method) => deployedIds(pkg).includes(method.id)).map((method) => <span key={method.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{method.displayName}{(!method.isEnabled || !method.bookingMethodIsActive) && ' (đã ngừng hoạt động)'}</span>)}
                  {!deployedIds(pkg).length && <span className="text-xs text-slate-500">Chưa áp dụng tại chi nhánh</span>}
                </div>
                <p className="text-xs text-slate-500">{formatReceptionSchedule((pkg.receptionSchedules || []).filter((day: ReceptionDay) => day.branchId === branchId))}</p>
              </div>
              <button type="button" disabled={!canUpdate || saving !== null || !branchId || (!pkg.isActive && !deployedIds(pkg).length)}
                onClick={() => {
                  setEditing(pkg)
                  setSelectedMethodIds(deployedIds(pkg))
                  setScheduleDays((pkg.receptionSchedules || []).filter((day: ReceptionDay) => day.branchId === branchId).map((day: ReceptionDay) => ({ branchId, dayOfWeek: day.dayOfWeek, sessions: [...day.sessions] })))
                  setScheduleError('')
                }}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">Thiết lập lịch</button>
              {saving === pkg.id && <LoaderCircle aria-label="Đang lưu" className="h-4 w-4 animate-spin text-emerald-700" />}
            </div></td>
          </tr>)}
          {!loading && !filtered.length && <tr><td colSpan={3} className="p-8 text-center text-slate-500">Không có gói khám phù hợp.</td></tr>}
        </tbody>
      </table>
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs" onClick={() => { if (!saving) setEditing(null) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="reception-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3"><h2 id="reception-title" className="font-bold text-slate-900">{editing.name} · {branches.find((branch) => branch.id === branchId)?.name}</h2>
          <button aria-label="Đóng" disabled={!!saving} onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div>
        {scheduleError && <p role="alert" className="mb-3 text-sm text-rose-700">{scheduleError}</p>}
        <PackageBranchSchedulesField
          branches={branches.filter((branch) => branch.id === branchId)}
          methods={branchMethods.map((method) => ({ ...method, isEnabled: editing.isActive && method.isEnabled }))}
          methodIds={selectedMethodIds}
          onMethodsChange={setSelectedMethodIds}
          value={scheduleDays}
          onChange={setScheduleDays}
          disabled={!!saving}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button disabled={!!saving} onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Hủy</button>
          <button disabled={!!saving} onClick={() => void saveSchedule()} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Lưu thiết lập</button>
        </div>
      </section>
    </div>}
  </div>
}
