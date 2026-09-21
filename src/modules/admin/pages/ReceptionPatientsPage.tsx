'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useAuth } from '@/common/hooks/useAuth'
import { listPatientHistoryReception, listPatientsReception } from '../services/appointments'
import { formatDateVi, genderLabelVi, patientDobValue, patientListDisplayName, receptionStatusMeta, toRegistrationPatient } from '../components/reception/receptionHelpers'
import RoleSidebar from '../components/RoleSidebar'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AdminButton,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminTableFooter,
  AdminModal,
  StatusBadge,
} from '@/common/components/ui'

const PAGE_SIZE = 15

const TABLE_COLUMNS = [
  'Mã BN',
  'Họ và tên',
  'Số điện thoại',
  'Ngày sinh',
  'Giới tính',
  { label: 'Thao tác', align: 'right' as const },
]

export default function ReceptionPatientsPage() {
  const navigate = useNavigate()
  const { user, token, performLogout } = useAuth()

  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({ patientCode: '', name: '', phone: '' })
  const [selected, setSelected] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const load = useCallback(async (p = 1, currentFilters = filters) => {
    setLoading(true)
    setError('')
    try {
      const res = await listPatientsReception({
        page: p,
        pageSize: PAGE_SIZE,
        patientCode: currentFilters.patientCode.trim() || undefined,
        name: currentFilters.name.trim() || undefined,
        phone: currentFilters.phone.trim() || undefined,
      })
      if (Array.isArray(res)) {
        setRows(res)
        setTotal(res.length)
      } else {
        setRows(res?.patients || [])
        setTotal(res?.total || 0)
      }
      setPage(p)
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh bạ bệnh nhân.')
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (!token) return
    void load(1)
  }, [token, load])

  const search = () => {
    void load(1, filters)
  }

  async function openDetail(row: any) {
    setSelected(row)
    setHistory([])
    const patientId = row.id
    if (!patientId) return
    setHistoryLoading(true)
    try {
      const appts = await listPatientHistoryReception({ patientId })
      setHistory(Array.isArray(appts) ? appts : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  function goRegister(row?: any) {
    navigate('/registration', {
      state: row ? { createNew: true, patient: toRegistrationPatient(row) } : { createNew: true },
    })
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Quầy tiếp nhận</p>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Danh bạ bệnh nhân</h1>
            <p className="text-xs text-slate-500">Tìm kiếm thông tin bệnh nhân, tra cứu lịch sử khám và tạo tiếp nhận mới.</p>
          </div>
          <AdminButton
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => goRegister()}
          >
            Tiếp nhận bệnh nhân mới
          </AdminButton>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        <AdminTableCard>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-4 border-b border-slate-200">
            <input
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 text-xs font-medium focus:border-emerald-600 outline-none"
              value={filters.patientCode}
              onChange={(e) => setFilters((s) => ({ ...s, patientCode: e.target.value }))}
              placeholder="Mã BN / Số CCCD"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <input
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 text-xs font-medium focus:border-emerald-600 outline-none"
              value={filters.name}
              onChange={(e) => setFilters((s) => ({ ...s, name: e.target.value }))}
              placeholder="Họ tên bệnh nhân"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <input
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 text-xs font-medium focus:border-emerald-600 outline-none"
              value={filters.phone}
              onChange={(e) => setFilters((s) => ({ ...s, phone: e.target.value }))}
              placeholder="Số điện thoại"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <AdminButton
              variant="primary"
              icon={Search}
              loading={loading}
              onClick={search}
            >
              {loading ? 'Đang tìm…' : 'Tìm kiếm'}
            </AdminButton>
          </div>

          <AdminTable minWidth="min-w-[800px]">
            <AdminTableHead columns={TABLE_COLUMNS} />
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <AdminTableLoading colSpan={6} message="Đang tải danh sách bệnh nhân…" />
              ) : rows.length === 0 ? (
                <AdminTableEmpty colSpan={6} message="Không tìm thấy hồ sơ nào phù hợp." />
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-emerald-700">
                      {row.patientCode || row.nationalId || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <strong className="text-slate-900 block">{patientListDisplayName(row)}</strong>
                      <p className="text-[11px] text-slate-400">{row.email || row.account?.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-600">
                      {row.phone || row.account?.phoneNumber || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {patientDobValue(row) ? formatDateVi(patientDobValue(row)) : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{genderLabelVi(row.gender)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <AdminButton
                        variant="secondary"
                        size="xs"
                        onClick={() => void openDetail(row)}
                        className="mr-2"
                      >
                        Chi tiết
                      </AdminButton>
                      <AdminButton
                        variant="outline"
                        size="xs"
                        onClick={() => goRegister(row)}
                      >
                        Đăng ký khám
                      </AdminButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </AdminTable>

          <AdminTableFooter total={total} label="hồ sơ">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Hiển thị {from}–{to}
              </span>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 disabled:opacity-40 cursor-pointer hover:bg-slate-50 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <span className="font-semibold text-slate-700 text-xs">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((n) => n + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 disabled:opacity-40 cursor-pointer hover:bg-slate-50 text-xs"
              >
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </AdminTableFooter>
        </AdminTableCard>
      </div>

      {/* DETAIL MODAL */}
      <AdminModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        eyebrow="Hồ sơ bệnh nhân"
        title={selected ? patientListDisplayName(selected) : ''}
        maxWidth="xl"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              {[
                ['Mã BN', selected.patientCode || selected.nationalId || '—'],
                ['Họ và tên', patientListDisplayName(selected)],
                ['Ngày sinh', patientDobValue(selected) ? formatDateVi(patientDobValue(selected)) : '—'],
                ['Giới tính', genderLabelVi(selected.gender)],
                ['Điện thoại', selected.phone || selected.account?.phoneNumber || '—'],
                ['Email', selected.email || selected.account?.email || '—'],
                ['CCCD', selected.nationalId || '—'],
                ['Địa chỉ', selected.address || '—'],
              ].map(([l, v]) => (
                <div key={l} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400">{l}</p>
                  <p className="mt-0.5 font-semibold text-slate-800 truncate">{v}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Lịch sử khám bệnh
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5">
                {historyLoading ? (
                  <p className="text-xs text-slate-400">Đang tải lịch sử…</p>
                ) : history.length ? (
                  history.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded bg-slate-50 p-2 text-xs"
                    >
                      <span className="font-mono font-bold text-emerald-700">
                        {item.ticket || item.bookingCode}
                      </span>
                      <span className="text-slate-600">
                        {item.appointmentDate ? formatDateVi(item.appointmentDate) : '—'}{' '}
                        {item.startTime || ''}
                      </span>
                      <span className="font-medium text-slate-700">
                        {item.doctor?.fullName || item.specialty?.name || 'Khám'}
                      </span>
                      <StatusBadge status={String(item.status)}>
                        {receptionStatusMeta(item).label}
                      </StatusBadge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Chưa có lịch sử khám bệnh.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
