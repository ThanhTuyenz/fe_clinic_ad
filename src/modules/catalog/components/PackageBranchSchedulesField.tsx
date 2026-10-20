'use client'

import { useState } from 'react'
import PackageSchedulesField from './PackageSchedulesField'
import { ReceptionDay } from '../types/catalog.types'

interface Props {
  branches: { id: string; name: string }[]
  value: ReceptionDay[]
  onChange: (schedules: ReceptionDay[]) => void
  disabled?: boolean
  methods: { id: string; branchId: string; code: string; displayName: string; isEnabled: boolean; bookingMethodIsActive: boolean }[]
  methodIds: string[]
  onMethodsChange: (ids: string[]) => void
}

export default function PackageBranchSchedulesField({ branches, value, onChange, disabled, methods, methodIds, onMethodsChange }: Props) {
  const [selectedId, setSelectedId] = useState('')
  const branchId = branches.some((branch) => branch.id === selectedId) ? selectedId : branches[0]?.id
  if (!branchId) return null
  const days = value.filter((day) => day.branchId === branchId)
  const branchMethods = methods.filter((method) => method.branchId === branchId && ['SPECIALTY_EXAM', 'AFTER_HOURS', 'HEALTH_PACKAGE'].includes(method.code))
  const selectedMethods = branchMethods.filter((method) => methodIds.includes(method.id))
  const weekendOnly = selectedMethods.length > 0 && selectedMethods.every((method) => method.code === 'AFTER_HOURS')

  return <div className="sm:col-span-2 space-y-3">
    {branches.length > 1 && <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-slate-700">Lịch của cơ sở</span>
      <select aria-label="Cơ sở thiết lập lịch" value={branchId} disabled={disabled} onChange={(event) => setSelectedId(event.target.value)} className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs">
        {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
      </select>
    </div>}
    <fieldset disabled={disabled} className="rounded-lg border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold">Hình thức khám tại {branches.find((branch) => branch.id === branchId)?.name}</legend>
      <div className="flex flex-wrap gap-4">
        {branchMethods.map((method) => {
          const selected = methodIds.includes(method.id)
          const available = method.isEnabled && method.bookingMethodIsActive
          return <label key={method.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected} disabled={!available && !selected} onChange={() => onMethodsChange(selected ? methodIds.filter((id) => id !== method.id) : [...methodIds, method.id])} className="accent-emerald-700" />
            {method.displayName}{!available && ' (đã ngừng hoạt động)'}
          </label>
        })}
        {!branchMethods.length && <p className="text-sm text-slate-500">Chi nhánh chưa cấu hình hình thức khám cho gói dịch vụ.</p>}
      </div>
    </fieldset>
    <PackageSchedulesField key={branchId} value={days} weekendOnly={weekendOnly} disabled={disabled || !selectedMethods.length} onChange={(next) => onChange([
      ...value.filter((day) => day.branchId !== branchId),
      ...next.map((day) => ({ ...day, branchId })),
    ])} />
  </div>
}
