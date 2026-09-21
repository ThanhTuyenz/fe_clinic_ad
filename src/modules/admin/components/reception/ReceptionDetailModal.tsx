'use client'

import React, { useState } from 'react'
import { CheckCircle2, X, Printer, Pencil, Loader2, AlertCircle } from 'lucide-react'
import {
  appointmentSourceLabel,
  appointmentSourceTitle,
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
import { updatePatientProfileByStaff } from '../../services/checkIn'

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
  handleManualCheckIn?: () => void
  onMarkCompleted?: () => void
  onPatientProfileUpdated?: (updatedPatient: any) => void
}

function InfoRow({ label, value, isMono, isHighlight, isLast }: { label: string; value: React.ReactNode; isMono?: boolean; isHighlight?: boolean; isLast?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${isLast ? '' : 'border-b border-slate-100'}`}>
      <dt className="text-slate-500 font-medium text-xs">{label}</dt>
      <dd className={`text-xs font-semibold max-w-[220px] text-right truncate ${isMono ? 'font-mono' : ''} ${isHighlight ? 'text-emerald-700 font-bold' : 'text-slate-900'}`}>
        {value || '—'}
      </dd>
    </div>
  )
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
  handleManualCheckIn,
  onMarkCompleted,
  onPatientProfileUpdated,
}: ReceptionDetailModalProps) {
  const [isEditingPatient, setIsEditingPatient] = useState(false)
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    nationalId: '',
    healthInsuranceNumber: '',
    address: '',
  })
  const [patientSaving, setPatientSaving] = useState(false)
  const [patientSaveErr, setPatientSaveErr] = useState('')

  if (!isOpen || !activeDetail) return null

  const { patient, doctor } = activeDetail
  const statusMeta = receptionStatusMeta(activeDetail)

  const handleOpenEditPatient = () => {
    if (!patient) return
    const rawDob = patient.dateOfBirth ? String(patient.dateOfBirth).slice(0, 10) : ''
    const rawGender = String(patient.gender || 'male').toLowerCase()
    setPatientForm({
      fullName: patient.fullName || patient.name || '',
      phone: patient.phone || patient.phoneNumber || '',
      dateOfBirth: rawDob,
      gender: rawGender.includes('fe') || rawGender.includes('nữ') ? 'female' : rawGender.includes('other') || rawGender.includes('khác') ? 'other' : 'male',
      nationalId: patient.nationalId || '',
      healthInsuranceNumber: patient.healthInsuranceNumber || '',
      address: patient.address || '',
    })
    setPatientSaveErr('')
    setIsEditingPatient(true)
  }

  const handleSavePatient = async () => {
    const patientId = patient?.id
    if (!patientId) {
      setPatientSaveErr('Không tìm thấy thông tin hồ sơ bệnh nhân.')
      return
    }
    if (!patientForm.fullName.trim()) {
      setPatientSaveErr('Vui lòng nhập họ và tên bệnh nhân.')
      return
    }

    try {
      setPatientSaving(true)
      setPatientSaveErr('')
      const genderUpper = patientForm.gender.toUpperCase()
      const payload: Record<string, any> = {
        fullName: patientForm.fullName.trim(),
        gender: ['MALE', 'FEMALE', 'OTHER'].includes(genderUpper) ? genderUpper : undefined,
        phoneNumber: patientForm.phone.trim() || undefined,
        nationalId: patientForm.nationalId.trim() || undefined,
        healthInsuranceNumber: patientForm.healthInsuranceNumber.trim() || undefined,
        address: patientForm.address.trim() || undefined,
        ...(patientForm.dateOfBirth ? { dateOfBirth: patientForm.dateOfBirth } : {}),
      }

      const updated = await updatePatientProfileByStaff(patientId, payload)
      if (activeDetail.patient) {
        Object.assign(activeDetail.patient, {
          ...payload,
          name: patientForm.fullName.trim(),
          phone: patientForm.phone.trim(),
          dateOfBirth: patientForm.dateOfBirth,
          gender: patientForm.gender,
          ...(updated && typeof updated === 'object' ? updated : {}),
        })
      }
      onPatientProfileUpdated?.(updated || activeDetail.patient)
      setIsEditingPatient(false)
    } catch (err: any) {
      setPatientSaveErr(err?.message || 'Không thể lưu thông tin bệnh nhân.')
    } finally {
      setPatientSaving(false)
    }
  }

  const statusToneClasses = {
    booked: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  }[statusMeta.tone as string] || 'bg-amber-50 text-amber-700 border-amber-200'

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-2xl max-w-4xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
              {activeDetail.ticket || '—'}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {patientListDisplayName(patient)}
              </h2>
              <span className="text-xs text-slate-500 font-medium">Chi tiết hồ sơ tiếp nhận & điều phối</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pastSlotDetail && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Quá giờ slot
              </span>
            )}
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
              title={appointmentSourceTitle(activeDetail)}
            >
              {appointmentSourceLabel(activeDetail)}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusToneClasses}`}>
              {statusMeta.label}
            </span>
            <button
              type="button"
              className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition ml-2 cursor-pointer border border-slate-200"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {saveMsg && <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium">{saveMsg}</div>}
        {(saveErr || visitErr || detailErr) && (
          <div className="mb-4 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveErr || visitErr || detailErr}</span>
          </div>
        )}
        {pastSlotDetail && (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded font-medium">
            Khung giờ hẹn đã kết thúc. Bạn có thể bấm <strong>Từ chối / Hủy</strong> nếu bệnh nhân không đến.
          </div>
        )}

        {/* 2 Cột: Thông tin bệnh nhân & Thông tin khám */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <section className="bg-slate-50 border border-slate-200/80 rounded p-4">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông tin bệnh nhân</h3>
              {patient?.id && (
                <button
                  type="button"
                  onClick={handleOpenEditPatient}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Sửa thông tin
                </button>
              )}
            </div>
            <dl>
              <InfoRow label="Mã bệnh nhân" value={patient?.patientCode || patient?.id} isMono />
              <InfoRow label="Họ và tên" value={patient?.fullName || patient?.name} />
              <InfoRow label="Số điện thoại" value={patient?.phone} />
              <InfoRow
                label="Ngày sinh / Tuổi"
                value={`${formatDob(patient?.dateOfBirth)}${ageFromDobField(patient?.dateOfBirth) ? ` (${ageFromDobField(patient?.dateOfBirth)} tuổi)` : ''}`}
              />
              <InfoRow
                label="Giới tính"
                value={patient?.gender?.toLowerCase().includes('fe') || patient?.gender?.toLowerCase().includes('nữ') ? 'Nữ' : patient?.gender ? 'Nam' : '—'}
              />
              <InfoRow label="Số CCCD" value={patient?.nationalId} isMono />
              <InfoRow label="Mã BHYT" value={patient?.healthInsuranceNumber} isMono />
              <InfoRow label="Địa chỉ" value={patient?.address} isLast />
            </dl>
          </section>

          <section className="bg-slate-50 border border-slate-200/80 rounded p-4">
            <div className="mb-2 pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông tin khám bệnh</h3>
            </div>
            <dl>
              <InfoRow label="Ngày khám" value={formatDateVi(activeDetail.appointmentDate)} />
              <InfoRow label="Khung giờ" value={formatExamTimeLine(activeDetail.startTime, activeDetail.endTime)} isHighlight />
              <InfoRow label="Bác sĩ phụ trách" value={doctorDisplayName(doctor)} />
              <InfoRow label="Chuyên khoa" value={activeDetail.specialty?.name || activeDetail.servicePackage?.name || doctorSpecialtyDisplay(doctor)} />
              <InfoRow
                label="Dịch vụ / Gói khám"
                value={activeDetail.servicePackage?.name || (doctor ? 'Khám với bác sĩ' : activeDetail.bookingMethod?.name)}
                isHighlight
              />
              <InfoRow label="Người tạo" value={sourceCreatorLabel(activeDetail)} />
              <InfoRow label="Ghi chú" value={activeDetail.note} isLast />
            </dl>
          </section>
        </div>

        {/* 2 Khối: Thu phí & Điều phối */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-slate-50 border border-slate-200/80 rounded p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Thu phí khám ban đầu</h3>
              <div className="flex items-baseline justify-between p-3 bg-white border border-slate-200 rounded mb-3">
                <span className="text-xs font-medium text-slate-600">Số tiền phí khám:</span>
                <strong className="text-xl font-extrabold text-emerald-700">{formatVnd(consultationFee)}</strong>
              </div>

              {isPaid ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded space-y-1.5 text-xs text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Đã thu phí thành công</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Phương thức: <strong>{paymentMethodLabel(activeDetail.payment?.method)}</strong> · {formatDateTimeVi(activeDetail.payment?.paidAt)}
                  </p>
                  {activeDetail.payment?.paidBy && (
                    <p className="text-[11px] text-emerald-700">
                      Thu ngân: <strong>{formatPaidByLine(activeDetail.payment.paidBy)}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Phương thức thu tiền:</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
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

                  {paymentErr && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-semibold">
                      {paymentErr}
                    </div>
                  )}

                  <button
                    type="button"
                    className="w-full py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    disabled={!canEditStatus || !hasClinicRoom || paymentSaving}
                    onClick={handleRecordPayment}
                  >
                    {paymentSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý…</> : 'Thu tiền & Tự động xác nhận'}
                  </button>

                  {!hasClinicRoom && canEditStatus && (
                    <p className="text-[11px] text-amber-700 font-medium">⚠️ Vui lòng chọn phòng khám trước khi thu phí.</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="bg-slate-50 border border-slate-200/80 rounded p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Điều phối phòng & Xác nhận</h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Phòng khám <span className="text-rose-600">*</span>
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
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
              {clinicRoomsErr && <span className="text-[11px] text-rose-700 font-medium">{clinicRoomsErr}</span>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Số thứ tự khám (STT)</label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                placeholder="Tự động cấp khi chọn phòng"
                value={visitQueueDraft}
                disabled={!canEditStatus}
                onChange={(e) => setVisitQueueDraft(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {activeDetail?.workflowStatus === 'CHECKED_IN' ? (
                <>
                  <div className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold flex items-center justify-center">
                    ✓ Đã Check-in {visitQueueDraft ? `(STT: ${visitQueueDraft})` : ''}
                  </div>
                  {onMarkCompleted && (
                    <button
                      type="button"
                      className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-40"
                      disabled={saving}
                      onClick={onMarkCompleted}
                    >
                      Khám xong
                    </button>
                  )}
                  <button
                    type="button"
                    className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded transition cursor-pointer"
                    onClick={openRegistrationFromActive}
                  >
                    Phiếu đăng ký
                  </button>
                </>
              ) : activeDetail?.workflowStatus === 'CONFIRMED' ? (
                <>
                  {handleManualCheckIn && (
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-50"
                      disabled={saving}
                      onClick={handleManualCheckIn}
                    >
                      {saving ? 'Đang xử lý…' : 'Xác nhận'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded transition cursor-pointer"
                    onClick={openRegistrationFromActive}
                  >
                    Phiếu đăng ký
                  </button>
                  <button
                    type="button"
                    className="py-2 px-3 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded transition cursor-pointer disabled:opacity-40"
                    disabled={saving}
                    onClick={handleCancelAppointment}
                  >
                    Hủy lịch
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex-1 py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded transition cursor-pointer disabled:opacity-40"
                    disabled={!canFinishConfirm || saving}
                    onClick={handleFinishConfirm}
                  >
                    {saving ? 'Đang lưu…' : 'Hoàn tất xác nhận'}
                  </button>
                  <button
                    type="button"
                    className="py-2 px-3 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded transition cursor-pointer disabled:opacity-40"
                    disabled={!canEditStatus || saving}
                    onClick={handleCancelAppointment}
                  >
                    Từ chối / Hủy
                  </button>
                  <button
                    type="button"
                    className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded transition cursor-pointer"
                    onClick={openRegistrationFromActive}
                  >
                    Phiếu đăng ký
                  </button>
                </>
              )}
            </div>

            {/* In ấn */}
            <div className="pt-3 border-t border-slate-200">
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">In ấn hồ sơ:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  disabled={printBothDisabled}
                  onClick={printBothFromDetail}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>In cả hai</span>
                </button>
                <button
                  type="button"
                  className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition cursor-pointer disabled:opacity-40"
                  disabled={printSlipDisabled}
                  onClick={printSlipOnly}
                >
                  In phiếu khám
                </button>
                <button
                  type="button"
                  className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700 transition cursor-pointer disabled:opacity-40"
                  disabled={printInvoiceDisabled}
                  onClick={printInvoiceOnly}
                >
                  In hóa đơn
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Modal Chỉnh sửa hồ sơ bệnh nhân */}
        {isEditingPatient && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded p-5 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Pencil className="w-4 h-4 text-emerald-700" />
                  Chỉnh sửa thông tin bệnh nhân
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingPatient(false)}
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {patientSaveErr && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-medium">
                  {patientSaveErr}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={patientForm.fullName}
                    onChange={(e) => setPatientForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={patientForm.dateOfBirth}
                    onChange={(e) => setPatientForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số CCCD / Hộ chiếu</label>
                  <input
                    type="text"
                    value={patientForm.nationalId}
                    onChange={(e) => setPatientForm((p) => ({ ...p, nationalId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Mã thẻ BHYT</label>
                  <input
                    type="text"
                    value={patientForm.healthInsuranceNumber}
                    onChange={(e) => setPatientForm((p) => ({ ...p, healthInsuranceNumber: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs uppercase font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ cư trú</label>
                  <input
                    type="text"
                    value={patientForm.address}
                    onChange={(e) => setPatientForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditingPatient(false)}
                  className="flex-1 py-2 px-3 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSavePatient}
                  disabled={patientSaving || !patientForm.fullName.trim()}
                  className="flex-1 py-2 px-3 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {patientSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu…</> : 'Lưu thông tin'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
