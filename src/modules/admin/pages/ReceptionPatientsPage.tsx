'use client'

import { useCallback, useEffect, useState } from 'react'
import RoleSidebar from '../components/RoleSidebar'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useStaffLogout } from '@/common/hooks/useStaffLogout'
import { apiErrorMessage } from '@/lib/api-client'
import { listPatientHistoryReception, listPatientsReception } from '../services/appointments'
import { getStaffSession, isReceptionStaff } from '../utils/staffSession'
import {
  formatDateVi,
  genderLabelVi,
  patientDobValue,
  patientListDisplayName,
  receptionStatusMeta,
  toRegistrationPatient,
} from '../components/reception/receptionHelpers'
import { PlusIcon, SearchIcon } from '../components/reception/ReceptionIcons'

const PAGE_SIZE = 10

const EMPTY_FILTERS = { patientCode: '', name: '', phone: '' }

export default function ReceptionPatientsPage() {
  const { performLogout } = useStaffLogout()
  const navigate = useNavigate()
  const { token, user } = getStaffSession()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const load = useCallback(async (nextPage: number, nextFilters: typeof EMPTY_FILTERS) => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const data = await listPatientsReception({
        page: nextPage,
        pageSize: PAGE_SIZE,
        patientCode: nextFilters.patientCode.trim() || undefined,
        name: nextFilters.name.trim() || undefined,
        phone: nextFilters.phone.trim() || undefined,
      })
      setRows(data.patients || [])
      setTotal(Number(data.total || 0))
    } catch (cause) {
      setRows([])
      setTotal(0)
      setError(apiErrorMessage(cause, 'Không tải được danh sách bệnh nhân.'))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
    } else if (!isReceptionStaff(user)) {
      navigate('/dashboard', { replace: true })
    }
  }, [token, user, navigate])

  useEffect(() => {
    void load(page, applied)
  }, [load, page, applied])

  function search() {
    setPage(1)
    setApplied({ ...filters })
  }

  async function openDetail(row: any) {
    setSelected(row)
    setHistory([])
    const patientId = String(row?.id || '').trim()
    if (!patientId) return
    setHistoryLoading(true)
    try {
      const appointments = await listPatientHistoryReception({ patientId })
      setHistory(Array.isArray(appointments) ? appointments : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  function goRegister(row?: any) {
    if (row) {
      navigate('/registration', { state: { createNew: true, patient: toRegistrationPatient(row) } })
      return
    }
    navigate('/registration', { state: { createNew: true } })
  }

  if (!token || !user) return null

  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0
  const to = Math.min(page * PAGE_SIZE, total)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col pl-0 md:pl-[232px] transition-all">
      <RoleSidebar role="receptionist" active="patients" user={user} onLogout={performLogout} />

      <div className="flex-1 p-5 md:p-6 max-w-[1600px] w-full mx-auto flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quầy tiếp nhận</p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Bệnh nhân</h1>
            <p className="text-xs text-slate-500 mt-0.5">Tìm hồ sơ tại quầy, xem lịch sử và đăng ký khám. Không khóa hay xóa hồ sơ từ màn này.</p>
          </div>
          <button
            type="button"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm border border-emerald-600 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98]"
            onClick={() => goRegister()}
          >
            <PlusIcon className="w-4 h-4 text-white" />
            <span>Thêm bệnh nhân / Đăng ký khám</span>
          </button>
        </div>

        {error ? (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">{error}</div>
        ) : null}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-4 border-b border-slate-200">
            <input
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 text-xs font-medium"
              value={filters.patientCode}
              onChange={(e) => setFilters((s) => ({ ...s, patientCode: e.target.value }))}
              placeholder="Mã BN / CCCD"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <input
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 text-xs font-medium"
              value={filters.name}
              onChange={(e) => setFilters((s) => ({ ...s, name: e.target.value }))}
              placeholder="Họ tên bệnh nhân"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <input
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 text-xs font-medium"
              value={filters.phone}
              onChange={(e) => setFilters((s) => ({ ...s, phone: e.target.value }))}
              placeholder="Số điện thoại"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <button
              type="button"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              onClick={search}
              disabled={loading}
            >
              <SearchIcon className="w-4 h-4 text-white" />
              {loading ? 'Đang tìm…' : 'Tìm kiếm'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  {['Mã BN', 'Họ tên', 'Liên hệ', 'Ngày sinh', 'Giới tính', 'Thao tác'].map((label) => (
                    <th key={label} className="px-5 py-3">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-400">Đang tải danh sách bệnh nhân…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-400">Không có bệnh nhân phù hợp.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-emerald-700">{row.patientCode || row.nationalId || '—'}</td>
                      <td className="px-5 py-3">
                        <b className="text-slate-900">{patientListDisplayName(row)}</b>
                        <p className="mt-1 text-xs text-slate-400">{row.email || row.account?.email || '—'}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{row.phone || row.account?.phoneNumber || '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{patientDobValue(row) ? formatDateVi(patientDobValue(row)) : '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{genderLabelVi(row.gender)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button type="button" onClick={() => void openDetail(row)} className="mr-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          Chi tiết
                        </button>
                        <button type="button" onClick={() => goRegister(row)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                          Đăng ký khám
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs text-slate-500">
            <span>{total ? `Hiển thị ${from}–${to} / ${total} hồ sơ` : 'Không có hồ sơ'}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button>
              <span>Trang {page}/{totalPages}</span>
              <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((n) => n + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button>
            </div>
          </footer>
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="my-6 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Hồ sơ bệnh nhân</p>
                <h2 className="mt-1 font-bold text-slate-900">{patientListDisplayName(selected)}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-xl text-slate-400">×</button>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ['Mã BN', selected.patientCode || selected.nationalId || '—'],
                ['Họ và tên', patientListDisplayName(selected)],
                ['Ngày sinh', patientDobValue(selected) ? formatDateVi(patientDobValue(selected)) : '—'],
                ['Giới tính', genderLabelVi(selected.gender)],
                ['Số điện thoại', selected.phone || selected.account?.phoneNumber || '—'],
                ['Email', selected.email || selected.account?.email || '—'],
                ['CCCD', selected.nationalId || '—'],
                ['Địa chỉ', selected.address || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Lịch sử khám</p>
              <div className="mt-3 space-y-2">
                {historyLoading ? (
                  <p className="text-sm text-slate-400">Đang tải lịch sử…</p>
                ) : history.length ? (
                  history.slice(0, 8).map((item) => (
                    <p key={item.id} className="text-sm text-slate-700">
                      <span className="font-mono text-xs text-emerald-700">{item.ticket || item.bookingCode}</span>
                      {' · '}
                      {item.appointmentDate ? formatDateVi(item.appointmentDate) : '—'}
                      {item.startTime ? ` ${item.startTime}` : ''}
                      {' · '}
                      {item.doctor?.fullName || item.specialty?.name || 'Lịch khám'}
                      {' · '}
                      {receptionStatusMeta(item).label}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Chưa có lịch khám.</p>
                )}
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t px-5 py-4">
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-4 py-2 text-sm">Đóng</button>
              <button type="button" onClick={() => goRegister(selected)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Đăng ký khám</button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
