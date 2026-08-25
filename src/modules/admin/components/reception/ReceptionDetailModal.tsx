'use client'

import React from 'react'
import {
  appointmentSourceLabel,
  appointmentSourceTitle,
  appointmentSourceValue,
} from '../../utils/appointmentSource'
import {
  ageFromDobField,
  doctorDisplayName,
  doctorSpecialtyDisplay,
  formatDateTimeVi,
  formatDateVi,
  formatDob,
  formatExamTimeLine,
  formatPaidByLine,
  formatVnd,
  patientListDisplayName,
  paymentMethodLabel,
  receptionStatusMeta,
  sourceCreatorLabel,
} from './receptionHelpers'
import { CheckCircleIcon, CloseIcon, PrinterIcon } from './ReceptionIcons'

interface ReceptionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  activeDetail: any
  detailStatus: string
  canEditStatus: boolean
  pastSlotDetail: boolean
  canFinishConfirm: boolean
  hasClinicRoom: boolean
  isPaid: boolean
  consultationFee: number
  paymentMethod: string
  setPaymentMethod: (val: string) => void
  paymentSaving: boolean
  handleRecordPayment: () => void
  paymentErr: string
  clinicRoomDraft: string
  setClinicRoomDraft: (val: string) => void
  handleClinicRoomChange: (newRoomId: string) => void
  clinicRooms: any[]
  clinicRoomsErr: string
  visitQueueDraft: string
  setVisitQueueDraft: (val: string) => void
  saving: boolean
  handleFinishConfirm: () => void
  handleCancelAppointment: () => void
  openRegistrationFromActive: () => void
  printInvoiceDisabled: boolean
  printSlipDisabled: boolean
  printBothDisabled: boolean
  printInvoiceOnly: () => void
  printSlipOnly: () => void
  printBothFromDetail: () => void
  saveMsg: string
  saveErr: string
  visitErr: string
  detailErr: string
}

export default function ReceptionDetailModal({
  isOpen,
  onClose,
  activeDetail,
  canEditStatus,
  pastSlotDetail,
  canFinishConfirm,
  hasClinicRoom,
  isPaid,
  consultationFee,
  paymentMethod,
  setPaymentMethod,
  paymentSaving,
  handleRecordPayment,
  paymentErr,
  clinicRoomDraft,
  handleClinicRoomChange,
  clinicRooms,
  clinicRoomsErr,
  visitQueueDraft,
  setVisitQueueDraft,
  saving,
  handleFinishConfirm,
  handleCancelAppointment,
  openRegistrationFromActive,
  printInvoiceDisabled,
  printSlipDisabled,
  printBothDisabled,
  printInvoiceOnly,
  printSlipOnly,
  printBothFromDetail,
  saveMsg,
  saveErr,
  visitErr,
  detailErr,
}: ReceptionDetailModalProps) {
  if (!isOpen || !activeDetail) return null

  const patient = activeDetail.patient
  const doctor = activeDetail.doctor
  const statusMeta = receptionStatusMeta(activeDetail)

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-7 border border-slate-200 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="reception-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
              {activeDetail.ticket || '—'}
            </span>
            <div>
              <h2 id="reception-modal-title" className="text-lg font-bold text-slate-900 leading-none">
                {patientListDisplayName(patient)}
              </h2>
              <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
                Chi tiết hồ sơ tiếp nhận & điều phối
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pastSlotDetail ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Quá giờ slot
              </span>
            ) : null}
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300"
              title={appointmentSourceTitle(activeDetail)}
            >
              {appointmentSourceLabel(activeDetail)}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                statusMeta.tone === 'booked'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : statusMeta.tone === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : statusMeta.tone === 'cancelled'
                  ? 'bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {statusMeta.label}
            </span>

            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all ml-2 cursor-pointer border border-slate-200"
              onClick={onClose}
              aria-label="Đóng"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thông báo kết quả / lỗi */}
        {saveMsg ? (
          <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-medium">
            {saveMsg}
          </div>
        ) : null}
        {saveErr ? (
          <div className="mb-4 px-4 py-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
            {saveErr}
          </div>
        ) : null}
        {visitErr ? (
          <div className="mb-4 px-4 py-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
            {visitErr}
          </div>
        ) : null}
        {detailErr ? (
          <div className="mb-4 px-4 py-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
            {detailErr}
          </div>
        ) : null}

        {pastSlotDetail ? (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl font-medium">
            Khung giờ hẹn đã kết thúc. Bạn có thể bấm <strong>Từ chối / Hủy</strong> nếu bệnh nhân không đến.
          </div>
        ) : null}

        {/* 2 Cột: Thông tin bệnh nhân & Thông tin khám */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Bệnh nhân */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Thông tin bệnh nhân
            </h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Mã bệnh nhân</dt>
                <dd className="font-mono font-bold text-slate-900">{patient?.patientCode || patient?.id || '—'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Số điện thoại</dt>
                <dd className="font-semibold text-slate-900">{patient?.phone || '—'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Ngày sinh / Tuổi</dt>
                <dd className="font-semibold text-slate-900">
                  {formatDob(patient?.dateOfBirth)}
                  {ageFromDobField(patient?.dateOfBirth) ? ` (${ageFromDobField(patient.dateOfBirth)} tuổi)` : ''}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Giới tính</dt>
                <dd className="font-semibold text-slate-900">
                  {patient?.gender === 'male' || patient?.gender === 'MALE'
                    ? 'Nam'
                    : patient?.gender === 'female' || patient?.gender === 'FEMALE'
                    ? 'Nữ'
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 font-medium">Địa chỉ</dt>
                <dd className="font-semibold text-slate-900 text-right max-w-[220px] truncate">{patient?.address || '—'}</dd>
              </div>
            </dl>
          </section>

          {/* Thông tin khám */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Thông tin khám bệnh
            </h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Ngày khám</dt>
                <dd className="font-bold text-slate-900">{formatDateVi(activeDetail.appointmentDate)}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Khung giờ</dt>
                <dd className="font-bold text-emerald-700">
                  {formatExamTimeLine(activeDetail.startTime, activeDetail.endTime)}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Bác sĩ phụ trách</dt>
                <dd className="font-bold text-slate-900">{doctorDisplayName(doctor)}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Chuyên khoa</dt>
                <dd className="font-semibold text-slate-700">{doctorSpecialtyDisplay(doctor)}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <dt className="text-slate-500 font-medium">Người tạo</dt>
                <dd className="font-semibold text-slate-700">{sourceCreatorLabel(activeDetail)}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500 font-medium">Ghi chú</dt>
                <dd className="font-semibold text-slate-900 text-right max-w-[220px] truncate">{activeDetail.note || '—'}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* 2 Khối: Thu phí khám & Điều phối phòng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Thu Phí */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Thu phí khám ban đầu
              </h3>
              <div className="flex items-baseline justify-between p-3 bg-white border border-slate-300 rounded-xl mb-3">
                <span className="text-xs font-semibold text-slate-600">Số tiền phí khám:</span>
                <strong className="text-xl font-extrabold text-emerald-700">{formatVnd(consultationFee)}</strong>
              </div>

              {isPaid ? (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl space-y-1.5 text-xs text-emerald-950 font-medium">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-700" />
                    <span>Đã thu phí thành công</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Phương thức: <strong>{paymentMethodLabel(activeDetail.payment?.method)}</strong> ·{' '}
                    {formatDateTimeVi(activeDetail.payment?.paidAt)}
                  </p>
                  {activeDetail.payment?.paidBy ? (
                    <p className="text-[11px] text-emerald-800">
                      Thu ngân: <strong>{formatPaidByLine(activeDetail.payment.paidBy)}</strong>
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Phương thức thu tiền:
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 shadow-xs"
                      value={paymentMethod}
                      disabled={!canEditStatus || paymentSaving}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="transfer">Chuyển khoản</option>
                      <option value="momo">Ví MoMo</option>
                      <option value="card">Thẻ POS</option>
                    </select>
                  </div>

                  {paymentErr ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg font-semibold">
                      {paymentErr}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm border border-emerald-600 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    disabled={!canEditStatus || !hasClinicRoom || paymentSaving}
                    onClick={handleRecordPayment}
                  >
                    {paymentSaving ? 'Đang xử lý…' : 'Thu tiền & Tự động xác nhận'}
                  </button>

                  {!hasClinicRoom && canEditStatus ? (
                    <p className="text-[11px] text-amber-700 font-bold">
                      ⚠️ Vui lòng chọn phòng khám trước khi thu phí.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          {/* Điều Phối & Xác Nhận */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Điều phối phòng & Xác nhận
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Phòng khám <span className="text-rose-600">*</span>
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 shadow-xs"
                value={clinicRoomDraft}
                disabled={!canEditStatus}
                onChange={(e) => handleClinicRoomChange(e.target.value)}
              >
                <option value="">-- Chọn phòng khám --</option>
                {clinicRooms.map((r) => (
                  <option key={r.id || r.roomID} value={String(r.id || r.roomID)}>
                    {r.name} {r.roomNumber ? `(${r.roomNumber})` : ''}
                  </option>
                ))}
              </select>
              {clinicRoomsErr ? <span className="text-[11px] text-rose-700 font-bold">{clinicRoomsErr}</span> : null}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Số thứ tự khám (STT)
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 shadow-xs"
                placeholder="Tự động cấp khi chọn phòng"
                value={visitQueueDraft}
                disabled={!canEditStatus}
                onChange={(e) => setVisitQueueDraft(e.target.value)}
              />
            </div>

            {/* Các nút hành động */}
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm border border-emerald-600 transition-all cursor-pointer disabled:opacity-40 active:scale-[0.98]"
                disabled={!canFinishConfirm || saving}
                onClick={handleFinishConfirm}
              >
                {saving ? 'Đang lưu…' : 'Hoàn tất xác nhận'}
              </button>

              <button
                type="button"
                className="py-2 px-3 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-xs"
                disabled={!canEditStatus || saving}
                onClick={handleCancelAppointment}
              >
                Từ chối / Hủy
              </button>

              <button
                type="button"
                className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                onClick={openRegistrationFromActive}
              >
                Phiếu đăng ký
              </button>
            </div>

            {/* In ấn */}
            <div className="pt-3 border-t border-slate-200">
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">In ấn hồ sơ:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 transition-all cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center gap-1.5"
                  disabled={printBothDisabled}
                  onClick={printBothFromDetail}
                >
                  <PrinterIcon className="w-3.5 h-3.5 text-slate-600" />
                  <span>In cả hai</span>
                </button>
                <button
                  type="button"
                  className="py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
                  disabled={printSlipDisabled}
                  onClick={printSlipOnly}
                >
                  In phiếu khám
                </button>
                <button
                  type="button"
                  className="py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
                  disabled={printInvoiceDisabled}
                  onClick={printInvoiceOnly}
                >
                  In hóa đơn
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
