'use client'

import { useState } from 'react'
import SystemCatalogCrudPage from './SystemCatalogCrudPage'

export default function BookingPackagesPage() {
  const [tab, setTab] = useState<'branch-specialties' | 'room-specialties' | 'service-packages'>('service-packages')
  return <div>
    <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-200">
      <button onClick={() => setTab('service-packages')} className={`px-4 py-3 text-sm font-bold ${tab === 'service-packages' ? 'border-b-2 border-emerald-700 text-emerald-700' : 'text-slate-500'}`}>Gói dịch vụ và lịch hoạt động</button>
      <button onClick={() => setTab('branch-specialties')} className={`px-4 py-3 text-sm font-bold ${tab === 'branch-specialties' ? 'border-b-2 border-emerald-700 text-emerald-700' : 'text-slate-500'}`}>Chuyên khoa theo cơ sở</button>
      <button onClick={() => setTab('room-specialties')} className={`px-4 py-3 text-sm font-bold ${tab === 'room-specialties' ? 'border-b-2 border-emerald-700 text-emerald-700' : 'text-slate-500'}`}>Phòng theo chuyên khoa</button>
    </div>
    <SystemCatalogCrudPage resource={tab} />
  </div>
}
