'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/common/hooks/useAuth'
import {
  AdminButton,
  AdminPageHeader,
  AdminStatCard,
  FilterTabs,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminTableFooter,
  AdminModal,
  StatusBadge,
} from '@/common/components/ui'
import { listReceptionAppointments, recordAppointmentPayment, listCatalog } from '../services/billingService'
import { staffRole } from '@/modules/admin/utils/staffSession'

type AppointmentRow = Record<string, any>
const money = (val: any) => `${Number(val || 0).toLocaleString('vi-VN')} đ`

const TABLE_COLUMNS = [
  'Mã hóa đơn',
  'Bệnh nhân',
  'Dịch vụ & Ngày',
  'Bác sĩ',
  { label: 'Số tiền', align: 'right' as const },
  { label: 'Trạng thái', align: 'center' as const },
  { label: 'Thao tác', align: 'right' as const },
]

export default function BillingPage() {
  const { user, token } = useAuth()
  const isStaff = ['receptionist', 'admin', 'branch_manager'].includes(staffRole(user))

  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedItem, setSelectedItem] = useState<AppointmentRow | null>(null)
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer'>('cash')
  const [payNote, setPayNote] = useState('')
  const [submittingPay, setSubmittingPay] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [appData, branchData] = await Promise.all([
        listReceptionAppointments({ q, status: 'all' }),
        listCatalog('branches').catch(() => []),
      ])
      setAppointments(appData || [])
      setBranches(branchData || [])
    } catch (e: any) {
      setError(e?.message || 'Không tải được danh sách hóa đơn.')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const getPatientName = (it: AppointmentRow) =>
    it.patient?.fullName || it.patient?.name || it.patientProfile?.fullName || 'Bệnh nhân'
  const getPatientPhone = (it: AppointmentRow) =>
    it.patient?.phone || it.patientProfile?.phoneNumber || ''
  const getInvoiceCode = (it: AppointmentRow) =>
    `INV-${(it.invoice?.id || it.id).slice(0, 8).toUpperCase()}`
  const getAmount = (it: AppointmentRow) =>
    Number(it.payment?.amount ?? it.invoice?.totalAmount ?? 0)

  const isPaid = (it: AppointmentRow) => {
    const inv = (it.invoice?.status || '').toUpperCase()
    const pay = (it.payment?.status || '').toLowerCase()
    const wf = (it.workflowStatus || '').toUpperCase()
    return inv === 'PAID' || pay === 'paid' || ['COMPLETED', 'CHECKED_IN', 'CONFIRMED'].includes(wf)
  }
  const isPending = (it: AppointmentRow) =>
    !isPaid(it) && ((it.workflowStatus || '').toUpperCase() === 'HOLD' || it.payment?.status === 'unpaid')
  const isCancelled = (it: AppointmentRow) =>
    (it.workflowStatus || '').toUpperCase() === 'CANCELLED' ||
    (it.invoice?.status || '').toUpperCase() === 'CANCELLED'

  const filtered = useMemo(() => {
    return appointments.filter((it) => {
      const s = q.trim().toLowerCase()
      if (
        s &&
        !getInvoiceCode(it).toLowerCase().includes(s) &&
        !getPatientName(it).toLowerCase().includes(s) &&
        !getPatientPhone(it).toLowerCase().includes(s)
      )
        return false
      if (selectedBranchId && it.branch?.id !== selectedBranchId) return false
      if (statusFilter === 'paid') return isPaid(it)
      if (statusFilter === 'pending') return isPending(it)
      if (statusFilter === 'cancelled') return isCancelled(it)
      return true
    })
  }, [appointments, q, selectedBranchId, statusFilter])

  const stats = useMemo(() => {
    let rev = 0
    let paid = 0
    let pend = 0
    let canc = 0
    filtered.forEach((it) => {
      const amt = getAmount(it)
      if (isPaid(it)) {
        rev += amt
        paid++
      } else if (isPending(it)) pend++
      else if (isCancelled(it)) canc++
    })
    return { total: filtered.length, rev, paid, pend, canc }
  }, [filtered])

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setSubmittingPay(true)
    setError('')
    try {
      await recordAppointmentPayment({
        token,
        appointmentId: selectedItem.id,
        method: payMethod,
        amount: getAmount(selectedItem),
        note: payNote,
      })
      setSelectedItem(null)
      setPayNote('')
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Ghi nhận thanh toán thất bại.')
    } finally {
      setSubmittingPay(false)
    }
  }

  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'paid', label: 'Đã thu', count: stats.paid },
    { id: 'pending', label: 'Chờ thu', count: stats.pend },
    { id: 'cancelled', label: 'Đã hủy', count: stats.canc },
  ]

  return (
    <>
      <AdminPageHeader
        eyebrow="Quản lý tài chính"
        title="Thanh toán & Hóa đơn"
        description="Theo dõi doanh thu, thu tiền trực tiếp và đối soát viện phí."
      >
        <AdminButton
          variant="secondary"
          icon={RefreshCw}
          loading={loading}
          onClick={() => void loadData()}
        >
          Làm mới dữ liệu
        </AdminButton>
      </AdminPageHeader>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Doanh thu đã thu"
          value={money(stats.rev)}
          detail={`${stats.paid} hóa đơn thành công`}
          tone="emerald"
        />
        <AdminStatCard
          label="Đã thanh toán"
          value={stats.paid}
          detail="Hoàn tất"
          tone="slate"
        />
        <AdminStatCard
          label="Chờ thanh toán"
          value={stats.pend}
          detail="Cần thu tại quầy"
          tone="amber"
        />
        <AdminStatCard
          label="Đã hủy / Hoàn tiền"
          value={stats.canc}
          detail="Không ghi nhận thu"
          tone="slate"
        />
      </div>

      <AdminTableCard className="mt-5">
        <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
          <FilterTabs
            tabs={filterTabs}
            active={statusFilter}
            onChange={(id) => setStatusFilter(id)}
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="text-xs rounded border border-slate-200 px-2.5 py-1.5 bg-white"
            >
              <option value="">Tất cả cơ sở</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm mã HĐ, tên, SĐT..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>
          </div>
        </div>

        <AdminTable minWidth="min-w-[850px]">
          <AdminTableHead columns={TABLE_COLUMNS} />
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <AdminTableLoading colSpan={7} message="Đang tải danh sách hóa đơn…" />
            ) : filtered.length === 0 ? (
              <AdminTableEmpty colSpan={7} message="Chưa có dữ liệu hóa đơn phù hợp." />
            ) : (
              filtered.map((it) => {
                const paid = isPaid(it)
                const pending = isPending(it)
                const canc = isCancelled(it)
                const amt = getAmount(it)
                return (
                  <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-900 text-xs">
                      {getInvoiceCode(it)}
                    </td>
                    <td className="px-5 py-3.5">
                      <strong className="text-slate-900 font-semibold block">
                        {getPatientName(it)}
                      </strong>
                      <p className="text-xs text-slate-400 font-mono">{getPatientPhone(it)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <p className="font-medium text-slate-800">
                        {it.servicePackage?.name || it.specialty?.name || 'Khám bệnh'}
                      </p>
                      <p className="text-slate-400">{it.appointmentDate || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                      {it.doctor?.fullName || it.doctor?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 text-xs tabular-nums">
                      {money(amt)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge
                        tone={paid ? 'emerald' : pending ? 'amber' : canc ? 'slate' : 'blue'}
                      >
                        {paid ? 'Đã thu' : pending ? 'Chờ thu' : canc ? 'Đã hủy' : it.workflowStatus}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <AdminButton
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedItem(it)}
                      >
                        Chi tiết
                      </AdminButton>
                      {isStaff && pending && (
                        <AdminButton
                          variant="primary"
                          size="xs"
                          className="ml-1.5"
                          onClick={() => {
                            setSelectedItem(it)
                            setPayMethod('cash')
                          }}
                        >
                          Thu tiền
                        </AdminButton>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </AdminTable>
        <AdminTableFooter total={filtered.length} label="hóa đơn" />
      </AdminTableCard>

      {/* DETAIL & PAYMENT MODAL */}
      <AdminModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        eyebrow="Chi tiết hóa đơn viện phí"
        title={selectedItem ? getInvoiceCode(selectedItem) : ''}
        loading={submittingPay}
      >
        {selectedItem && (
          <div className="space-y-4 text-xs">
            <div className="rounded bg-slate-50/70 p-4 border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Bệnh nhân:</span>
                <strong className="text-slate-800">
                  {getPatientName(selectedItem)} ({getPatientPhone(selectedItem) || '—'})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dịch vụ:</span>
                <span className="font-semibold text-slate-800">
                  {selectedItem.servicePackage?.name || selectedItem.specialty?.name || 'Khám bệnh'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cơ sở:</span>
                <span className="font-semibold text-slate-800">
                  {selectedItem.branch?.name || 'Chi nhánh chính'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tổng tiền:</span>
                <strong className="text-base text-emerald-700 font-extrabold">
                  {money(getAmount(selectedItem))}
                </strong>
              </div>
            </div>

            {isPending(selectedItem) && isStaff && (
              <form onSubmit={handleConfirmPayment} className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Ghi nhận thu tiền trực tiếp
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 rounded border p-2.5 text-xs font-semibold cursor-pointer ${
                      payMethod === 'cash'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      checked={payMethod === 'cash'}
                      onChange={() => setPayMethod('cash')}
                    />{' '}
                    Tiền mặt
                  </label>
                  <label
                    className={`flex items-center gap-2 rounded border p-2.5 text-xs font-semibold cursor-pointer ${
                      payMethod === 'transfer'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      checked={payMethod === 'transfer'}
                      onChange={() => setPayMethod('transfer')}
                    />{' '}
                    Chuyển khoản QR
                  </label>
                </div>
                <input
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Ghi chú thu ngân (nếu có)..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                />
                <AdminButton
                  variant="primary"
                  type="submit"
                  loading={submittingPay}
                  className="w-full py-2.5"
                >
                  Xác nhận đã thu {money(getAmount(selectedItem))}
                </AdminButton>
              </form>
            )}
          </div>
        )}
      </AdminModal>
    </>
  )
}
