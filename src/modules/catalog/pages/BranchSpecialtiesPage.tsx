'use client'

import { useState } from 'react'
import SystemCatalogCrudPage from './SystemCatalogCrudPage'

export default function BranchSpecialtiesPage() {
  const [tab, setTab] = useState<'branch-specialties' | 'room-specialties'>('branch-specialties')
  return <div>
    <div className="mb-5 flex gap-2 border-b border-slate-200" role="tablist" aria-label="Chuyên khoa tại chi nhánh">
      {([['branch-specialties', 'Chuyên khoa tại chi nhánh'], ['room-specialties', 'Phân công phòng khám']] as const).map(([id, label]) => (
        <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-t-lg px-4 py-3 text-sm font-bold cursor-pointer ${tab === id ? 'border-b-2 border-emerald-700 text-emerald-700' : 'text-slate-500'}`}>{label}</button>
      ))}
    </div>
    <SystemCatalogCrudPage key={tab} resource={tab} />
  </div>
}
