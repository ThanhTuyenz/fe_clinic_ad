'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiErrorMessage } from '@/lib/api-client'
import { listUsers, updateUser } from '../services/users'
import { listPatientHistoryReception, listPatientsReception } from '../services/appointments'
import {
  formatDateVi,
  patientListDisplayName,
} from '../components/reception/receptionHelpers'

type PatientAccount = {
  id: string
  fullName?: string
  email?: string
  phoneNumber?: string
  role?: string
  status?: string
  isBlocked?: boolean
  createdAt?: string
  profiles?: any[]
}

function isPatientRole(row: any) {
  return String(row?.role || row?.userType || '').toLowerCase() === 'patient'
}

function genderLabel(value: unknown) {
  const raw = String(value || '').toUpperCase()
  if (raw === 'MALE' || raw === 'NAM') return 'Nam'
  if (raw === 'FEMALE' || raw === 'NỮ' || raw === 'NU') return 'Nữ'
  return value ? String(value) : '—'
}

function profileList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.patients)) return data.patients
  if (Array.isArray(data?.rows)) return data.rows
  return []
}

export default function AdminPatientsPage() {
  const [rows, setRows] = useState<PatientAccount[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<PatientAccount | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [savingId, setSavingId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, profilesRes] = await Promise.all([
        listUsers({ limit: 100, isDeleted: false }),
        listPatientsReception({ page: 1, pageSize: 100 }).catch(() => null),
      ])
      const profiles = profileList(profilesRes)
      const byAccount = new Map<string, any[]>()
      for (const profile of profiles) {
        const accountId = String(profile.accountId || profile.account?.id || '')
        if (!accountId) continue
        const current = byAccount.get(accountId) || []
        current.push(profile)
        byAccount.set(accountId, current)
      }
      setRows(
        usersRes.data.filter(isPatientRole).map((user: any) => ({
          ...user,
          profiles: byAccount.get(user.id) || [],
        })),
      )
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không tải được danh sách bệnh nhân.'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter === 'blocked' && !row.isBlocked) return false
      if (statusFilter === 'active' && row.isBlocked) return false
      if (!term) return true
      const profileText = (row.profiles || [])
        .map((profile) => `${profile.fullName || ''} ${profile.phone || profile.phoneNumber || ''} ${profile.patientCode || ''} ${profile.nationalId || ''}`)
        .join(' ')
      return `${row.fullName || ''} ${row.email || ''} ${row.phoneNumber || ''} ${profileText}`.toLowerCase().includes(term)
    })
  }, [rows, query, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    blocked: rows.filter((row) => row.isBlocked).length,
    active: rows.filter((row) => !row.isBlocked).length,
  }), [rows])

  async function openDetail(row: PatientAccount) {
    setSelected(row)
    setHistory([])
    const profileId = row.profiles?.find((profile) => profile.isMainProfile)?.id || row.profiles?.[0]?.id
    if (!profileId) return
    setHistoryLoading(true)
    try {
      const appointments = await listPatientHistoryReception({ patientId: profileId })
      setHistory(Array.isArray(appointments) ? appointments.slice(0, 5) : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function toggleBlocked(row: PatientAccount) {
    const next = !row.isBlocked
    if (!confirm(next ? `Bạn chắc muốn khóa tài khoản ${row.fullName || row.email}?` : `Mở khóa tài khoản ${row.fullName || row.email}?`)) return
    setSavingId(row.id)
    setError('')
    try {
      await updateUser(row.id, { isBlocked: next })
      setRows((items) => items.map((item) => (item.id === row.id ? { ...item, isBlocked: next } : item)))
      setSelected((current) => (current?.id === row.id ? { ...current, isBlocked: next } : current))
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Không cập nhật được tài khoản bệnh nhân.'))
    } finally {
      setSavingId('')
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý người dùng</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Bệnh nhân</h1>
          <p className="mt-1 text-sm text-slate-500">Tìm hồ sơ và khóa tài khoản khi cần. Đăng ký bệnh nhân mới thực hiện tại quầy.</p>
        </div>
        <button onClick={() => void load()} className="rounded-md border px-3 py-2 text-xs font-bold">
          Làm mới
        </button>
      </div>

      {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          ['Tổng tài khoản', stats.total, 'text-slate-900'],
          ['Đang hoạt động', stats.active, 'text-emerald-700'],
          ['Đã khóa', stats.blocked, 'text-rose-600'],
        ].map(([label, value, tone]) => (
          <article key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`mt-2 text-2xl font-extrabold ${tone}`}>{loading ? '—' : value}</p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên, email, SĐT hoặc mã hồ sơ..."
            className="min-w-[240px] flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'blocked')}
            className="rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="blocked">Đã khóa</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                {['Bệnh nhân', 'Liên hệ', 'Hồ sơ', 'Trạng thái', 'Thao tác'].map((label) => (
                  <th key={label} className="px-5 py-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                    Đang tải danh sách bệnh nhân…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                    Không có bệnh nhân phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-5 py-3">
                      <b className="text-slate-900">{row.fullName || 'Chưa cập nhật'}</b>
                      <p className="mt-1 text-xs text-slate-400">{row.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{row.phoneNumber || row.profiles?.[0]?.phone || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{row.profiles?.length || 0} hồ sơ</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${row.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {row.isBlocked ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button onClick={() => void openDetail(row)} className="mr-2 rounded border px-3 py-1.5 text-xs">
                        Chi tiết
                      </button>
                      <button
                        onClick={() => void toggleBlocked(row)}
                        disabled={savingId === row.id}
                        className={`rounded border px-3 py-1.5 text-xs disabled:opacity-50 ${row.isBlocked ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}`}
                      >
                        {savingId === row.id ? 'Đang lưu…' : row.isBlocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t px-5 py-3 text-xs text-slate-400">Tổng cộng {filtered.length} tài khoản bệnh nhân</footer>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="my-6 w-full max-w-2xl rounded-lg bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Hồ sơ bệnh nhân</p>
                <h2 className="mt-1 font-bold text-slate-900">{selected.fullName || selected.email}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-xl text-slate-400">
                ×
              </button>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ['Họ và tên', selected.fullName || '—'],
                ['Email', selected.email || '—'],
                ['Số điện thoại', selected.phoneNumber || '—'],
                ['Trạng thái', selected.isBlocked ? 'Đã khóa' : 'Hoạt động'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="border-t px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Hồ sơ khám</p>
              <div className="mt-3 space-y-2">
                {(selected.profiles || []).length ? (
                  selected.profiles!.map((profile) => (
                    <article key={profile.id} className="rounded-md border border-slate-100 px-3 py-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {patientListDisplayName(profile)}
                        {profile.isMainProfile ? <span className="ml-2 text-[10px] font-bold text-emerald-700">Hồ sơ chính</span> : null}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {genderLabel(profile.gender)} · {profile.dateOfBirth || profile.dob ? formatDateVi(profile.dateOfBirth || profile.dob) : '—'} · {profile.phone || profile.phoneNumber || selected.phoneNumber || '—'}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Chưa có hồ sơ khám gắn với tài khoản này.</p>
                )}
              </div>
            </div>

            <div className="border-t px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lịch gần đây</p>
              <div className="mt-3 space-y-2">
                {historyLoading ? (
                  <p className="text-sm text-slate-400">Đang tải lịch sử…</p>
                ) : history.length ? (
                  history.map((item) => (
                    <p key={item.id} className="text-sm text-slate-700">
                      <span className="font-mono text-xs text-emerald-700">{item.ticket || item.bookingCode}</span>
                      {' · '}
                      {item.appointmentDate ? formatDateVi(item.appointmentDate) : '—'}
                      {' · '}
                      {item.doctor?.fullName || item.specialty?.name || 'Lịch khám'}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Chưa có lịch khám.</p>
                )}
              </div>
            </div>

            <footer className="flex justify-end gap-2 border-t px-5 py-4">
              <button type="button" onClick={() => setSelected(null)} className="rounded border px-4 py-2 text-sm">
                Đóng
              </button>
              <button
                type="button"
                disabled={savingId === selected.id}
                onClick={() => void toggleBlocked(selected)}
                className={`rounded px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${selected.isBlocked ? 'bg-emerald-700' : 'bg-amber-600'}`}
              >
                {savingId === selected.id ? 'Đang lưu…' : selected.isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
