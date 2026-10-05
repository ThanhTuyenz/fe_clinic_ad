'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { useAuth } from '@/common/hooks/useAuth'
import { listPatientHistoryReception, listPatientsReception } from '@/modules/admin/services/appointments'
import { formatDateVi, genderLabelVi, patientDobValue, patientListDisplayName, receptionStatusMeta, toRegistrationPatient } from '../components/receptionHelpers'
import RoleSidebar, { StaffMobileHeader } from '@/modules/admin/components/RoleSidebar'
import { Plus, Search, ChevronLeft, ChevronRight, X, Loader2, RotateCcw, RefreshCw } from 'lucide-react'
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
  const [page, setPage] = useState(1)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [gender, setGender] = useState('')
  const [hasInsurance, setHasInsurance] = useState('')
  const [sortBy, setSortBy] = useState('')

  const [selected, setSelected] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Tải danh bạ bệnh nhân vào client (tập 300 bệnh nhân mới nhất)
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listPatientsReception({
        page: 1,
        pageSize: 300,
      })
      const items = Array.isArray(res) ? res : res?.patients || []
      setRows(items)
      setPage(1)
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh bạ bệnh nhân.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    void load()
  }, [token, load])

  // Lọc dữ liệu client-side tức thì (0ms) với useMemo
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    let result = rows.filter((r) => {
      // 1. Lọc giới tính
      if (gender && String(r.gender || '').toUpperCase() !== gender) {
        return false
      }

      // 2. Lọc BHYT
      if (hasInsurance === 'yes' && !r.healthInsuranceNumber) {
        return false
      }
      if (hasInsurance === 'no' && r.healthInsuranceNumber) {
        return false
      }

      // 3. Tìm kiếm tức thì theo Mã BN, CCCD, Họ tên, SĐT, Email
      if (!q) return true

      const pCode = String(r.patientCode || '').toLowerCase()
      const cccd = String(r.nationalId || '').toLowerCase()
      const name = String(patientListDisplayName(r) || '').toLowerCase()
      const phone = String(r.phone || r.account?.phoneNumber || '').toLowerCase()
      const email = String(r.email || r.account?.email || '').toLowerCase()

      return (
        pCode.includes(q) ||
        cccd.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q)
      )
    })

    // 4. Sắp xếp
    if (sortBy === 'name_desc') {
      result = [...result].sort((a, b) =>
        patientListDisplayName(b).localeCompare(patientListDisplayName(a), 'vi')
      )
    } else if (sortBy === 'created_desc') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
    } else if (sortBy === 'created_asc') {
      result = [...result].sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      )
    } else {
      // Mặc định: Tên A -> Z
      result = [...result].sort((a, b) =>
        patientListDisplayName(a).localeCompare(patientListDisplayName(b), 'vi')
      )
    }

    return result
  }, [rows, searchTerm, gender, hasInsurance, sortBy])

  // Tự động về trang 1 khi đổi bộ lọc
  useEffect(() => {
    setPage(1)
  }, [searchTerm, gender, hasInsurance, sortBy])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0
  const to = Math.min(page * PAGE_SIZE, total)

  const hasActiveFilters = Boolean(searchTerm || gender || hasInsurance || sortBy)

  const resetFilters = () => {
    setSearchTerm('')
    setGender('')
    setHasInsurance('')
    setSortBy('')
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

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col lg:pl-[244px] transition-all">
      <RoleSidebar
        role="receptionist"
        active="patients"
        user={user}
        onLogout={performLogout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <StaffMobileHeader onOpenMenu={() => setMobileMenuOpen(true)} roleTitle="Lễ tân & Tiếp nhận" />

      <div className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-[1600px] w-full mx-auto flex flex-col">
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
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
            {error}
          </div>
        )}

        <AdminTableCard>
          <div className="p-3 sm:p-4 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-2.5 bg-white">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Ô tìm kiếm thông minh */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Mã BN, CCCD, họ tên, số điện thoại..."
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 transition-all shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer transition-colors"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Lọc Giới tính */}
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer shadow-2xs"
              >
                <option value="">Tất cả giới tính</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>

              {/* Lọc BHYT */}
              <select
                value={hasInsurance}
                onChange={(e) => setHasInsurance(e.target.value)}
                className="py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer shadow-2xs"
              >
                <option value="">Tất cả BHYT</option>
                <option value="yes">Có thẻ BHYT</option>
                <option value="no">Chưa có BHYT</option>
              </select>

              {/* Sắp xếp */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer shadow-2xs"
              >
                <option value="">Tên A → Z</option>
                <option value="name_desc">Tên Z → A</option>
                <option value="created_desc">Mới đăng ký nhất</option>
                <option value="created_asc">Cũ nhất</option>
              </select>

              {/* Nút đặt lại */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded cursor-pointer transition-colors shadow-2xs"
                  title="Đặt lại tất cả bộ lọc"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              )}

              {/* Nút làm mới */}
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                title="Làm mới danh sách từ máy chủ"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Trạng thái tải / Số lượng */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {loading ? (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Đang tải dữ liệu…</span>
                </span>
              ) : (
                <span>
                  Tìm thấy <strong className="text-slate-800 font-semibold">{total}</strong> bệnh nhân
                </span>
              )}
            </div>
          </div>

          <AdminTable minWidth="min-w-[800px]">
            <AdminTableHead columns={TABLE_COLUMNS} />
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <AdminTableLoading colSpan={6} message="Đang tải danh sách bệnh nhân…" />
              ) : paginatedRows.length === 0 ? (
                <AdminTableEmpty colSpan={6} message="Không tìm thấy hồ sơ nào phù hợp." />
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-emerald-700 text-xs">
                      {row.patientCode || row.nationalId || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <strong className="text-xs font-semibold text-slate-900 block">{patientListDisplayName(row)}</strong>
                      <p className="text-[11px] text-slate-400">{row.email || row.account?.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-600">
                      {row.phone || row.account?.phoneNumber || '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {patientDobValue(row) ? formatDateVi(patientDobValue(row)) : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{genderLabelVi(row.gender)}</td>
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
                className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40 cursor-pointer hover:bg-slate-50 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <span className="font-semibold text-slate-700 text-xs">
                Trang {page}/{totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40 cursor-pointer hover:bg-slate-50 text-xs"
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
                <div key={l} className="bg-slate-50 p-2.5 rounded border border-slate-100">
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
