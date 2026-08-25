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

interface ReceptionDetailPaneProps {
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

export default function ReceptionDetailPane({
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
}: ReceptionDetailPaneProps) {
  if (!activeDetail) {
    return (
      <main className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl mb-3 text-slate-400">
          📋
        </div>
        <h2 className="text-base font-bold text-slate-700">Chọn lịch hẹn để xem chi tiết</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Dùng danh sách bên trái để chọn hoặc bấm Quét QR để tải nhanh hồ sơ tiếp nhận.
        </p>
      </main>
    )
  }

  const patient = activeDetail.patient
  const doctor = activeDetail.doctor
  const statusMeta = receptionStatusMeta(activeDetail)

  return (
    <main className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 overflow-y-auto h-[calc(100vh-160px)]">
      {/* Header chi tiết */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {activeDetail.ticket || '—'}
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1">{patientListDisplayName(patient)}</h2>
        </div>
        <div className="flex items-center gap-2">
          {pastSlotDetail ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
              Quá giờ slot
            </span>
          ) : null}
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
            title={appointmentSourceTitle(activeDetail)}
          >
            {appointmentSourceLabel(activeDetail)}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              statusMeta.tone === 'booked'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : statusMeta.tone === 'completed'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : statusMeta.tone === 'cancelled'
                ? 'bg-slate-100 text-slate-600'
                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
            }`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Thông báo */}
      {saveMsg ? (
        <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>{saveMsg}</span>
        </div>
      ) : null}
      {saveErr ? (
        <div className="mb-4 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {saveErr}
        </div>
      ) : null}
      {visitErr ? (
        <div className="mb-4 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {visitErr}
        </div>
      ) : null}
      {detailErr ? (
        <div className="mb-4 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {detailErr}
        </div>
      ) : null}

      {pastSlotDetail ? (
        <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl">
          Khung giờ hẹn đã kết thúc. Bạn có thể bấm <strong>Từ chối / Hủy</strong> nếu bệnh nhân không đến.
        </div>
      ) : null}

      {/* 2 Cột: Thông tin bệnh nhân & Thông tin khám */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Bệnh nhân */}
        <section className="bg-slate-50/70 border border-slate-100 rounded-xl p-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Thông tin bệnh nhân</h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Mã bệnh nhân</dt>
              <dd className="font-mono font-semibold text-slate-800">{patient?.patientCode || patient?.id || '—'}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Số điện thoại</dt>
              <dd className="font-medium text-slate-800">{patient?.phone || '—'}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Ngày sinh / Tuổi</dt>
              <dd className="font-medium text-slate-800">
                {formatDob(patient?.dateOfBirth)}
                {ageFromDobField(patient?.dateOfBirth) ? ` (${ageFromDobField(patient.dateOfBirth)} tuổi)` : ''}
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Giới tính</dt>
              <dd className="font-medium text-slate-800">
                {patient?.gender === 'male' || patient?.gender === 'MALE'
                  ? 'Nam'
                  : patient?.gender === 'female' || patient?.gender === 'FEMALE'
                  ? 'Nữ'
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Địa chỉ</dt>
              <dd className="font-medium text-slate-800 text-right max-w-[200px] truncate">{patient?.address || '—'}</dd>
            </div>
          </dl>
        </section>

        {/* Thông tin khám */}
        <section className="bg-slate-50/70 border border-slate-100 rounded-xl p-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Thông tin khám bệnh</h3>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Ngày khám</dt>
              <dd className="font-semibold text-slate-800">{formatDateVi(activeDetail.appointmentDate)}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Khung giờ</dt>
              <dd className="font-semibold text-slate-800">
                {formatExamTimeLine(activeDetail.startTime, activeDetail.endTime)}
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Bác sĩ</dt>
              <dd className="font-semibold text-emerald-700">{doctorDisplayName(doctor)}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Chuyên khoa</dt>
              <dd className="font-medium text-slate-800">{doctorSpecialtyDisplay(doctor)}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <dt className="text-slate-500">Người tạo</dt>
              <dd className="font-medium text-slate-800">{sourceCreatorLabel(activeDetail)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Ghi chú</dt>
              <dd className="font-medium text-slate-800 text-right max-w-[200px] truncate">{activeDetail.note || '—'}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* 2 Khối Thao tác: Thu phí khám & Điều phối phòng khám */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khối Thu Phí */}
        <section className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Phí khám ban đầu</h3>
            <div className="flex items-baseline justify-between p-3 bg-white border border-slate-200/70 rounded-xl mb-3">
              <span className="text-xs font-semibold text-slate-500">Số tiền:</span>
              <strong className="text-lg font-extrabold text-emerald-700">{formatVnd(consultationFee)}</strong>
            </div>

            {isPaid ? (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl space-y-1 text-xs text-emerald-900">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Đã thu phí thành công
                </div>
                <p className="text-[11px] text-emerald-700">
                  Phương thức: {paymentMethodLabel(activeDetail.payment?.method)} ·{' '}
                  {formatDateTimeVi(activeDetail.payment?.paidAt)}
                </p>
                {activeDetail.payment?.paidBy ? (
                  <p className="text-[11px] text-emerald-700">
                    Thu ngân: {formatPaidByLine(activeDetail.payment.paidBy)}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phương thức thu:</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
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
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                    {paymentErr}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  disabled={!canEditStatus || !hasClinicRoom || paymentSaving}
                  onClick={handleRecordPayment}
                >
                  {paymentSaving ? 'Đang xử lý…' : 'Thu tiền & Tự động xác nhận'}
                </button>

                {!hasClinicRoom && canEditStatus ? (
                  <p className="text-[11px] text-amber-600 font-medium">⚠️ Vui lòng chọn phòng khám trước khi thu phí.</p>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* Khối Điều Phối Phòng & Xác Nhận */}
        <section className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Điều phối & Xác nhận</h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Phòng khám <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
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
            {clinicRoomsErr ? <span className="text-[11px] text-rose-600">{clinicRoomsErr}</span> : null}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Số thứ tự khám (STT)</label>
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
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
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40"
              disabled={!canFinishConfirm || saving}
              onClick={handleFinishConfirm}
            >
              {saving ? 'Đang lưu…' : 'Hoàn tất xác nhận'}
            </button>

            <button
              type="button"
              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40"
              disabled={!canEditStatus || saving}
              onClick={handleCancelAppointment}
            >
              Từ chối / Hủy
            </button>

            <button
              type="button"
              className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              onClick={openRegistrationFromActive}
            >
              Mở phiếu đăng ký
            </button>
          </div>

          {/* In ấn */}
          <div className="pt-3 border-t border-slate-200/60">
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">In ấn tài liệu:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-40"
                disabled={printBothDisabled}
                onClick={printBothFromDetail}
              >
                In cả hai (HĐ + Phiếu)
              </button>
              <button
                type="button"
                className="py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-40"
                disabled={printSlipDisabled}
                onClick={printSlipOnly}
              >
                In phiếu khám
              </button>
              <button
                type="button"
                className="py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-40"
                disabled={printInvoiceDisabled}
                onClick={printInvoiceOnly}
              >
                In hóa đơn
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
