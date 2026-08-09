import { vndAmountInWords } from './numberVi'

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function formatDateVi(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function formatDateTimeVi(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function formatVnd(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('vi-VN')} đ`
}

function paymentMethodLabel(method) {
  const m = String(method || '').trim().toLowerCase()
  if (m === 'cash') return 'Tiền mặt'
  if (m === 'transfer') return 'Chuyển khoản'
  return '—'
}

function patientDisplayName(p) {
  if (!p) return '—'
  const dn = String(p.displayName || '').trim()
  if (dn) return dn
  const last = String(p.lastName || '').trim()
  const first = String(p.firstName || '').trim()
  return `${last} ${first}`.trim() || '—'
}

function doctorDisplayName(d) {
  if (!d) return '—'
  const name = String(d.displayName || '').trim()
  if (name) return name
  const last = String(d.lastName || '').trim()
  const first = String(d.firstName || '').trim()
  return `${last} ${first}`.trim() || '—'
}

function formatExamTimeLine(start, end) {
  const s = String(start || '').trim().slice(0, 5)
  if (!s) return '—'
  const e = String(end || '').trim().slice(0, 5)
  return e && e !== s ? `${s} – ${e}` : s
}

/**
 * Dữ liệu in hóa đơn thu phí khám.
 * @param {object} detail — appointment detail (đã có payment paid)
 * @param {object} [overrides] — clinicRoom, visitQueueNumber
 */
export function buildPaymentInvoiceView(detail, overrides = {}) {
  if (!detail) return null
  const payment = detail.payment
  if (String(payment?.status || '').toLowerCase() !== 'paid') return null

  const amount = Number(payment.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null

  const ticket = String(detail.ticket || '').trim() || '—'
  const invoiceNo = String(payment.invoiceNo || '').trim() || ticket

  return {
    invoiceNo,
    ticket,
    patientName: patientDisplayName(detail.patient),
    patientCode: String(detail.patient?.patientCode || '').trim() || '—',
    patientPhone: String(detail.patient?.phone || '').trim() || '—',
    doctorName: doctorDisplayName(detail.doctor),
    specialtyName:
      String(detail.doctor?.specialtyName || detail.doctor?.specialty || '').trim() || '—',
    examDate: formatDateVi(detail.appointmentDate),
    examTime: formatExamTimeLine(detail.startTime, detail.endTime),
    clinicRoom: String(overrides.clinicRoom ?? detail.clinicRoom ?? '').trim() || '—',
    queueNumber:
      overrides.visitQueueNumber != null && overrides.visitQueueNumber !== ''
        ? String(overrides.visitQueueNumber)
        : detail.visitQueueNumber != null && detail.visitQueueNumber !== ''
          ? String(detail.visitQueueNumber)
          : '—',
    amount,
    amountFormatted: formatVnd(amount),
    amountInWords: vndAmountInWords(amount),
    methodLabel: paymentMethodLabel(payment.method),
    paidAt: formatDateTimeVi(payment.paidAt),
    paidBy:
      String(payment.paidBy?.displayName || payment.paidBy?.email || '').trim() || '—',
    note: String(payment.note || '').trim(),
  }
}
