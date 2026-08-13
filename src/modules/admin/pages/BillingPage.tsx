'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/common/hooks/useAuth'
import { listReceptionAppointments } from '../services/appointments'
import { recordAppointmentPayment } from '../services/payments'
import { listCatalog } from '../services/systemCatalog'
import { staffRole } from '../utils/staffSession'

type AppointmentRow = {
  id: string
  ticket?: string
  bookingCode?: string
  createdAt?: string
  appointmentDate?: string
  startTime?: string
  endTime?: string
  status?: string
  workflowStatus?: string
  patient?: {
    id?: string
    fullName?: string
    name?: string
    phone?: string
    email?: string
  }
  patientProfile?: {
    id?: string
    fullName?: string
    phoneNumber?: string
    email?: string
  }
  doctor?: {
    id?: string
    fullName?: string
    name?: string
    department?: string
    specialtyName?: string
  }
  specialty?: {
    id?: string | number
    name?: string
  }
  servicePackage?: {
    id?: string
    code?: string
    name?: string
  }
  branch?: {
    id?: string
    code?: string
    name?: string
  }
  payment?: {
    status?: string
    paid?: boolean
    amount?: number
    method?: string
    paidAt?: string
  }
  invoice?: {
    id?: string
    totalAmount?: number | string
    status?: string
    paidAt?: string
    payments?: any[]
  }
}

const money = (val: any) => `${Number(val || 0).toLocaleString('vi-VN')} đ`

export default function BillingPage() {
  const { user, token } = useAuth()
  const role = staffRole(user)
  const isCashierOrStaff = ['cashier', 'receptionist', 'admin', 'branch_manager'].includes(role)

  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
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
      setError(e?.message || 'Không tải được danh sách hóa đơn thanh toán.')
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const getPatientName = (item: AppointmentRow) =>
    item.patient?.fullName || item.patient?.name || item.patientProfile?.fullName || 'Bệnh nhân'

  const getPatientPhone = (item: AppointmentRow) =>
    item.patient?.phone || item.patientProfile?.phoneNumber || ''

  const getInvoiceCode = (item: AppointmentRow) => {
    const rawId = item.invoice?.id || item.id
    return `INV-${rawId.slice(0, 8).toUpperCase()}`
  }

  const getInvoiceAmount = (item: AppointmentRow) =>
    Number(item.payment?.amount ?? item.invoice?.totalAmount ?? 0)

  const isInvoicePaid = (item: AppointmentRow) => {
    const invStatus = (item.invoice?.status || '').toUpperCase()
    const payStatus = (item.payment?.status || '').toLowerCase()
    const wfStatus = (item.workflowStatus || '').toUpperCase()
    return invStatus === 'PAID' || payStatus === 'paid' || ['COMPLETED', 'CHECKED_IN', 'IN_EXAMINATION'].includes(wfStatus)
  }

  const isInvoicePending = (item: AppointmentRow) => {
    const wfStatus = (item.workflowStatus || '').toUpperCase()
    return !isInvoicePaid(item) && (wfStatus === 'PENDING_PAYMENT' || item.payment?.status === 'unpaid')
  }

  const isInvoiceCancelled = (item: AppointmentRow) => {
    const wfStatus = (item.workflowStatus || '').toUpperCase()
    const invStatus = (item.invoice?.status || '').toUpperCase()
    return wfStatus === 'CANCELLED' || invStatus === 'CANCELLED'
  }

  const filtered = useMemo(() => {
    return appointments.filter((item) => {
      const search = q.trim().toLowerCase()
      const invCode = getInvoiceCode(item).toLowerCase()
      const patientName = getPatientName(item).toLowerCase()
      const phone = getPatientPhone(item).toLowerCase()

      const matchSearch =
        !search || invCode.includes(search) || patientName.includes(search) || phone.includes(search)

      const matchBranch = !selectedBranchId || item.branch?.id === selectedBranchId

      const paid = isInvoicePaid(item)
      const pending = isInvoicePending(item)
      const cancelled = isInvoiceCancelled(item)

      let matchStatus = true
      if (statusFilter === 'paid') matchStatus = paid
      else if (statusFilter === 'pending') matchStatus = pending
      else if (statusFilter === 'cancelled') matchStatus = cancelled

      return matchSearch && matchBranch && matchStatus
    })
  }, [appointments, q, selectedBranchId, statusFilter])

  const stats = useMemo(() => {
    let totalRevenue = 0
    let paidCount = 0
    let pendingCount = 0
    let cancelledCount = 0

    filtered.forEach((item) => {
      const amount = getInvoiceAmount(item)
      if (isInvoicePaid(item)) {
        totalRevenue += amount
        paidCount++
      } else if (isInvoicePending(item)) {
        pendingCount++
      } else if (isInvoiceCancelled(item)) {
        cancelledCount++
      }
    })

    return {
      total: filtered.length,
      totalRevenue,
      paidCount,
      pendingCount,
      cancelledCount,
    }
  }, [filtered])

  const handleConfirmPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedItem) return
    setSubmittingPay(true)
    setError('')
    try {
      await recordAppointmentPayment({
        token,
        appointmentId: selectedItem.id,
        method: payMethod,
        amount: getInvoiceAmount(selectedItem),
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

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý tài chính</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Thanh toán & Hóa đơn</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi doanh thu, hóa đơn thu tiền và lịch sử giao dịch tại cơ sở.</p>
        </div>
        <button
          onClick={() => void loadData()}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* KPI Stats */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Doanh thu đã thu</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">{loading ? '—' : money(stats.totalRevenue)}</p>
          <p className="mt-1 text-xs text-slate-500">{stats.paidCount} hóa đơn đã hoàn tất</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hóa đơn đã thu</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{loading ? '—' : stats.paidCount}</p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Thanh toán thành công</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Chờ thanh toán</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">{loading ? '—' : stats.pendingCount}</p>
          <p className="mt-1 text-xs text-amber-700 font-medium">Cần thu tiền tại quầy / Online</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Đã hủy / Hoàn tiền</p>
          <p className="mt-2 text-2xl font-extrabold text-rose-600">{loading ? '—' : stats.cancelledCount}</p>
          <p className="mt-1 text-xs text-slate-400">Không thực hiện</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo Mã hóa đơn, Tên bệnh nhân, SĐT..."
              className="w-full max-w-sm rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />

            {/* Branch Selector Dropdown */}
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Mã hóa đơn</th>
                <th className="px-5 py-3.5">Bệnh nhân</th>
                <th className="px-5 py-3.5">Dịch vụ</th>
                <th className="px-5 py-3.5">Bác sĩ phụ trách</th>
                <th className="px-5 py-3.5 text-right">Số tiền</th>
                <th className="px-5 py-3.5 text-center">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    Đang tải danh sách hóa đơn…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                    Chưa có dữ liệu hóa đơn phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const invCode = getInvoiceCode(item)
                  const patientName = getPatientName(item)
                  const patientPhone = getPatientPhone(item)

                  const serviceName =
                    item.servicePackage?.name || item.specialty?.name || 'Khám chuyên khoa'
                  const doctorName =
                    item.doctor?.fullName || item.doctor?.name || 'Chưa phân công'

                  const paid = isInvoicePaid(item)
                  const pending = isInvoicePending(item)
                  const cancelled = isInvoiceCancelled(item)

                  const rawMethod = item.payment?.method || item.invoice?.payments?.[0]?.method
                  const methodText = rawMethod ? String(rawMethod).toUpperCase().replace('_', ' ') : (paid ? 'ONLINE' : 'CHỜ THU')

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-mono font-bold text-emerald-900">
                        {invCode}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{patientName}</p>
                        {patientPhone ? <p className="text-xs text-slate-500 font-mono">{patientPhone}</p> : null}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">{serviceName}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.appointmentDate ? `${item.appointmentDate} (${item.startTime || '08:00'})` : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{doctorName}</p>
                        {item.doctor?.department && (
                          <p className="text-[11px] text-slate-400">{item.doctor.department}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-extrabold text-slate-900">
                        {money(getInvoiceAmount(item))}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {paid ? (
                          <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                            Đã thanh toán
                          </span>
                        ) : pending ? (
                          <span className="inline-block rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                            Chờ thanh toán
                          </span>
                        ) : cancelled ? (
                          <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                            Đã hủy
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                            {item.workflowStatus}
                          </span>
                        )}
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {methodText}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                        >
                          Chi tiết
                        </button>
                        {isCashierOrStaff && pending && (
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              setPayMethod('cash')
                            }}
                            className="ml-2 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                          >
                            Thu tiền
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Tổng cộng {filtered.length} hóa đơn trong danh sách
        </footer>
      </section>

      {/* Invoice Detail / Cashier Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4">
          <div className="my-6 w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden border border-slate-100">
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chi tiết hóa đơn thanh toán</h3>
                <p className="text-xs font-mono font-semibold text-emerald-800 mt-0.5">
                  {getInvoiceCode(selectedItem)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-lg font-bold text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </header>

            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/80">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Bệnh nhân:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{getPatientName(selectedItem)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Số điện thoại:</span>
                    <p className="font-bold text-slate-900 font-mono mt-0.5">{getPatientPhone(selectedItem)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Dịch vụ / Gói:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {selectedItem.servicePackage?.name || selectedItem.specialty?.name || 'Khám chuyên khoa'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Bác sĩ phụ trách:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {selectedItem.doctor?.fullName || selectedItem.doctor?.name || 'Chưa phân công'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Chi nhánh:</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {selectedItem.branch?.name || 'VitaCare Trung tâm'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Ngày đặt lịch:</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {selectedItem.appointmentDate ? `${selectedItem.appointmentDate}` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">Tổng tiền cần thanh toán</span>
                  <p className="text-[11px] text-slate-500">Đã bao gồm tất cả các khoản phí</p>
                </div>
                <span className="text-2xl font-black text-emerald-800">
                  {money(getInvoiceAmount(selectedItem))}
                </span>
              </div>

              {/* Form Thu Tiền dành cho Cashier / Receptionist nếu Hóa đơn chưa thanh toán */}
              {isInvoicePending(selectedItem) && isCashierOrStaff && (
                <form onSubmit={handleConfirmPayment} className="space-y-3 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Ghi nhận thu tiền trực tiếp
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={payMethod === 'cash'}
                        onChange={() => setPayMethod('cash')}
                      />
                      Tiền mặt (Cash)
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={payMethod === 'transfer'}
                        onChange={() => setPayMethod('transfer')}
                      />
                      Chuyển khoản (Bank Transfer)
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600">Ghi chú thanh toán</label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="Nhập ghi chú thu tiền (không bắt buộc)..."
                      className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-normal outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="rounded-md border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPay}
                      className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                    >
                      {submittingPay ? 'Đang ghi nhận…' : 'Xác nhận đã thu tiền'}
                    </button>
                  </div>
                </form>
              )}

              {!isInvoicePending(selectedItem) && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="rounded-md bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
