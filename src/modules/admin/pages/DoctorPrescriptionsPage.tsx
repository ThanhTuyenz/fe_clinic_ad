'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/common/hooks/useAuth'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import RoleSidebar from '../components/RoleSidebar'
import { listDoctorPrescriptions } from '../services/medicalVisits'
import { printPrescription } from '../utils/printPrescription'
import { Printer, Search, FileText, Calendar } from 'lucide-react'
import { AdminButton, AdminPageHeader } from '@/common/components/ui'

const dateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
const viDateTime = (value: any) => value ? new Date(value).toLocaleString('vi-VN') : '—'
const genderLabel = (value: any) => String(value || '').toUpperCase() === 'MALE' ? 'Nam' : String(value || '').toUpperCase() === 'FEMALE' ? 'Nữ' : '—'

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth()
  const { performLogout } = useStaffLogout()
  const now = new Date()
  const monthAgo = new Date(now)
  monthAgo.setDate(monthAgo.getDate() - 30)

  const [from, setFrom] = useState(dateKey(monthAgo))
  const [to, setTo] = useState(dateKey(now))
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selected = useMemo(() => items.find((item) => item.id === selectedId) || items[0] || null, [items, selectedId])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listDoctorPrescriptions({ from, to, q: query.trim() || undefined })
      const rows = data?.items || []
      setItems(rows)
      setSelectedId((id) => rows.some((item: any) => item.id === id) ? id : rows[0]?.id || '')
    } catch (e: any) {
      setError(e?.message || 'Không tải được đơn thuốc.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const print = () => {
    if (!selected) return
    const primary = selected.diagnosis?.find((item: any) => item.isPrimary) || selected.diagnosis?.[0]
    printPrescription({
      hasMedicines: selected.items?.length > 0,
      clinicName: selected.branch?.name || 'VitaCare Clinic',
      doctorName: selected.doctorName,
      ticket: selected.appointment?.bookingCode || '—',
      examDate: viDateTime(selected.issuedAt || selected.visit?.createdAt),
      clinicRoom: '—',
      patientName: selected.patient?.fullName || '—',
      patientCode: selected.recordCode || '—',
      patientDob: selected.patient?.dateOfBirth ? new Date(selected.patient.dateOfBirth).toLocaleDateString('vi-VN') : '—',
      patientGender: genderLabel(selected.patient?.gender),
      patientAddress: selected.patient?.address || '',
      diagnosis: primary ? `${primary.code} - ${primary.name}` : '—',
      symptoms: selected.visit?.symptoms || '',
      treatment: selected.visit?.treatmentPlan || '',
      notes: '',
      lines: (selected.items || []).map((item: any, index: number) => ({
        index: index + 1,
        name: `${item.medicineName}${item.strength ? ` ${item.strength}` : ''}`,
        unit: item.unit || '',
        qty: String(item.quantity),
        usage: [item.dosageAmount, item.frequencyPerDay ? `${item.frequencyPerDay} lần/ngày` : '', item.durationDays ? `${item.durationDays} ngày` : '', item.instructions].filter(Boolean).join(' · '),
      })),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 relative pl-0 md:pl-[232px]">
      <RoleSidebar role="doctor" active="prescription" user={user} onLogout={performLogout} />
      <main className="p-6 max-w-7xl mx-auto">
        <AdminPageHeader
          title="Đơn thuốc đã kê"
          description="Tra cứu, xem chi tiết và in lại đơn thuốc của bác sĩ."
          className="mb-6"
        />

        <form
          className="mb-6 grid gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs md:grid-cols-[1fr_170px_170px_auto]"
          onSubmit={(e) => { e.preventDefault(); void load() }}
        >
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Bệnh nhân hoặc mã hồ sơ</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập tên hoặc mã hồ sơ"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Từ ngày</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Đến ngày</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <AdminButton
            type="submit"
            variant="primary"
            icon={Search}
            className="self-end"
          >
            Tìm kiếm
          </AdminButton>
        </form>

        {error && <div className="mb-4 bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-700">{error}</div>}

        <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <div className="space-y-2.5">
            {loading ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">Đang tải…</div>
            ) : items.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">Không có đơn thuốc trong khoảng ngày này.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  className={`w-full p-3.5 rounded-xl border text-left transition cursor-pointer ${selected?.id === item.id ? 'border-emerald-500 bg-emerald-50/50 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-bold text-xs text-slate-900">{item.patient?.fullName || 'Bệnh nhân'}</span>
                    <span className="text-[11px] text-slate-500">{viDateTime(item.issuedAt || item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.recordCode} · {item.items?.length || 0} thuốc</p>
                </button>
              ))
            )}
          </div>

          <div>
            {selected ? (
              <article className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
                <header className="flex items-center justify-between gap-4 bg-emerald-50/60 border-b border-slate-200 p-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selected.patient?.fullName}</h2>
                    <p className="text-xs text-slate-500">Mã hồ sơ: {selected.recordCode} · {genderLabel(selected.patient?.gender)}</p>
                  </div>
                  <AdminButton
                    variant="primary"
                    icon={Printer}
                    onClick={print}
                  >
                    In lại đơn
                  </AdminButton>
                </header>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-500">Chẩn đoán:</span>{' '}
                    <strong>{(selected.diagnosis?.find((item: any) => item.isPrimary) || selected.diagnosis?.[0])?.code || '—'}</strong>{' '}
                    {(selected.diagnosis?.find((item: any) => item.isPrimary) || selected.diagnosis?.[0])?.name || ''}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                          <th className="pb-2">Thuốc</th>
                          <th className="pb-2">Số lượng</th>
                          <th className="pb-2">Cách dùng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selected.items || []).map((item: any) => (
                          <tr key={item.id}>
                            <td className="py-2.5 font-bold text-slate-900">{item.medicineName} {item.strength}</td>
                            <td className="py-2.5 text-slate-700">{item.quantity} {item.unit}</td>
                            <td className="py-2.5 text-slate-600">
                              {[item.dosageAmount, item.frequencyPerDay ? `${item.frequencyPerDay} lần/ngày` : '', item.durationDays ? `${item.durationDays} ngày` : '', item.instructions].filter(Boolean).join(' · ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
