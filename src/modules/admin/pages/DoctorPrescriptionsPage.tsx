'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/common/hooks/useAuth'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import RoleSidebar from '../components/RoleSidebar'
import { listDoctorPrescriptions } from '../services/medicalVisits'
import { printPrescription } from '../utils/printPrescription'

const dateKey = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
const viDateTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—'
const genderLabel = (value) => String(value || '').toUpperCase() === 'MALE' ? 'Nam' : String(value || '').toUpperCase() === 'FEMALE' ? 'Nữ' : '—'

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth()
  const { performLogout } = useStaffLogout()
  const now = new Date()
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30)
  const [from, setFrom] = useState(dateKey(monthAgo)), [to, setTo] = useState(dateKey(now)), [query, setQuery] = useState('')
  const [items, setItems] = useState([]), [selectedId, setSelectedId] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const selected = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId])

  const load = async () => { setLoading(true); setError(''); try { const data = await listDoctorPrescriptions({ from, to, q: query.trim() || undefined }); const rows = data?.items || []; setItems(rows); setSelectedId((id) => rows.some((item) => item.id === id) ? id : rows[0]?.id || '') } catch (e) { setError(e?.message || 'Không tải được đơn thuốc.') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])

  const print = () => {
    if (!selected) return
    const primary = selected.diagnosis?.find((item) => item.isPrimary) || selected.diagnosis?.[0]
    printPrescription({
      hasMedicines: selected.items.length > 0, clinicName: selected.branch?.name || 'VitaCare Clinic', doctorName: selected.doctorName,
      ticket: selected.appointment?.bookingCode || '—', examDate: viDateTime(selected.issuedAt || selected.visit?.createdAt), clinicRoom: '—',
      patientName: selected.patient?.fullName || '—', patientCode: selected.recordCode || '—', patientDob: selected.patient?.dateOfBirth ? new Date(selected.patient.dateOfBirth).toLocaleDateString('vi-VN') : '—', patientGender: genderLabel(selected.patient?.gender), patientAddress: selected.patient?.address || '',
      diagnosis: primary ? `${primary.code} - ${primary.name}` : '—', symptoms: selected.visit?.symptoms || '', treatment: selected.visit?.treatmentPlan || '', notes: '',
      lines: selected.items.map((item, index) => ({ index: index + 1, name: `${item.medicineName}${item.strength ? ` ${item.strength}` : ''}`, unit: item.unit || '', qty: String(item.quantity), usage: [item.dosageAmount, item.frequencyPerDay ? `${item.frequencyPerDay} lần/ngày` : '', item.durationDays ? `${item.durationDays} ngày` : '', item.instructions].filter(Boolean).join(' · ') })),
    })
  }

  return <div className="tcl-shell"><RoleSidebar role="doctor" active="prescription" user={user} onLogout={performLogout}/><main className="min-h-screen bg-[#f3faef] p-6 text-slate-900"><div className="mx-auto max-w-6xl"><header className="mb-5"><h1 className="text-3xl font-black">Đơn thuốc đã kê</h1><p className="mt-1 text-sm text-slate-500">Tra cứu, xem chi tiết và in lại đơn thuốc của bác sĩ.</p></header>
    <form className="mb-5 grid gap-3 border border-emerald-100 bg-white p-4 md:grid-cols-[1fr_170px_170px_auto]" onSubmit={(e) => { e.preventDefault(); void load() }}><label className="text-sm font-bold">Bệnh nhân hoặc mã hồ sơ<input className="mt-2 w-full border border-slate-300 p-2.5 font-normal" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập tên hoặc mã hồ sơ"/></label><label className="text-sm font-bold">Từ ngày<input type="date" className="mt-2 w-full border border-slate-300 p-2.5 font-normal" value={from} onChange={(e) => setFrom(e.target.value)}/></label><label className="text-sm font-bold">Đến ngày<input type="date" className="mt-2 w-full border border-slate-300 p-2.5 font-normal" value={to} onChange={(e) => setTo(e.target.value)}/></label><button className="self-end bg-emerald-700 px-5 py-2.5 font-bold text-white">Tìm kiếm</button></form>
    {error ? <div className="mb-4 bg-red-50 p-3 text-red-700">{error}</div> : null}<section className="grid gap-5 lg:grid-cols-[380px_1fr]"><div className="space-y-2">{loading ? <div className="bg-white p-8 text-center text-slate-500">Đang tải…</div> : items.length === 0 ? <div className="bg-white p-8 text-center text-slate-500">Không có đơn thuốc trong khoảng ngày này.</div> : items.map((item) => <button key={item.id} className={`w-full border p-4 text-left ${selected?.id === item.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}`} onClick={() => setSelectedId(item.id)}><div className="flex justify-between gap-3"><b>{item.patient?.fullName}</b><span className="text-xs text-slate-500">{viDateTime(item.issuedAt || item.createdAt)}</span></div><p className="mt-1 text-xs text-slate-500">{item.recordCode} · {item.items.length} thuốc</p></button>)}</div>
    <div>{selected ? <article className="border border-emerald-100 bg-white"><header className="flex items-center justify-between gap-4 bg-emerald-50 p-5"><div><h2 className="text-xl font-black">{selected.patient?.fullName}</h2><p className="text-sm text-slate-500">Mã hồ sơ: {selected.recordCode} · {genderLabel(selected.patient?.gender)}</p></div><button className="bg-emerald-700 px-5 py-2.5 font-bold text-white" onClick={print}>In lại đơn</button></header><div className="p-5"><p className="mb-4 text-sm"><b>Chẩn đoán:</b> {(selected.diagnosis?.find((item) => item.isPrimary) || selected.diagnosis?.[0])?.code || '—'} {(selected.diagnosis?.find((item) => item.isPrimary) || selected.diagnosis?.[0])?.name || ''}</p><div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="bg-slate-50 text-left"><th className="p-3">Thuốc</th><th className="p-3">Số lượng</th><th className="p-3">Cách dùng</th></tr></thead><tbody>{selected.items.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-bold">{item.medicineName} {item.strength}</td><td className="p-3">{item.quantity} {item.unit}</td><td className="p-3">{[item.dosageAmount, item.frequencyPerDay ? `${item.frequencyPerDay} lần/ngày` : '', item.durationDays ? `${item.durationDays} ngày` : '', item.instructions].filter(Boolean).join(' · ')}</td></tr>)}</tbody></table></div></div></article> : null}</div></section>
  </div></main></div>
}
