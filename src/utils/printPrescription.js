import {
  formatRxDosageLabel,
  formatRxDurationLabel,
  formatRxFrequencyLabel,
} from './prescriptionLine.js'
import { rxLineMedicineName } from './medicineLabel.js'
import { formatQuantityVi } from './numberVi.js'

const DEFAULT_CLINIC_PHONE = '1900 1234'

function escapeHtml(value) {
  return String(value ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const PRINT_STYLES = `
  @page {
    size: A4 portrait;
    margin: 12mm;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    font-family: "Times New Roman", Georgia, serif;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .rx-copy {
    position: relative;
    padding: 0;
    page-break-after: always;
    break-after: page;
  }
  .rx-copy:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .rx-hotline {
    position: absolute;
    top: 0;
    right: 0;
    max-width: 55%;
    text-align: right;
    font-size: 10pt;
    font-weight: 700;
    line-height: 1.35;
    color: #0f172a;
  }
  .rx-copy-label {
    font-size: 9pt;
    color: #64748b;
    text-align: right;
    margin-bottom: 2mm;
    padding-top: 12mm;
    font-style: italic;
  }
  .rx-head {
    text-align: center;
    margin-bottom: 5mm;
  }
  .rx-clinic {
    font-size: 13pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .rx-title {
    margin: 2mm 0 0;
    font-size: 18pt;
    font-weight: 800;
    text-decoration: underline;
  }
  .rx-meta {
    margin-top: 2mm;
    font-size: 10pt;
    color: #475569;
  }
  .rx-patient {
    margin: 4mm 0;
    font-size: 11pt;
    line-height: 1.45;
  }
  .rx-patient p { margin: 1mm 0; }
  .rx-patient strong { font-weight: 700; }
  .rx-child-extra {
    margin: 2mm 0 3mm;
    padding: 2mm 3mm;
    border: 1px solid #334155;
    background: #f8fafc;
    font-size: 11pt;
    font-weight: 700;
  }
  .rx-diagnosis {
    margin: 3mm 0 4mm;
    font-size: 11pt;
    line-height: 1.4;
  }
  .rx-copy--exam-only .rx-diagnosis {
    margin: 8mm 0 6mm;
    padding: 4mm 5mm;
    border: 2px solid #0f172a;
    background: #f8fafc;
    font-size: 12.5pt;
    text-align: center;
  }
  .rx-copy--exam-only .rx-diagnosis strong {
    display: block;
    font-size: 11pt;
    margin-bottom: 2mm;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .rx-copy--exam-only .rx-advice {
    margin: 6mm 0;
    padding: 4mm 5mm;
    font-size: 12pt;
    text-align: center;
    border: 1px solid #0f766e;
    background: #f0fdfa;
  }
  .rx-drug-list {
    margin: 0 0 4mm;
    padding: 0 0 0 5mm;
    list-style: decimal;
  }
  .rx-drug {
    margin-bottom: 3.5mm;
    font-size: 11pt;
    line-height: 1.4;
    page-break-inside: avoid;
  }
  .rx-drug-name {
    font-weight: 700;
  }
  .rx-drug-qty {
    font-weight: 600;
  }
  .rx-drug-usage {
    margin-top: 1mm;
    padding-left: 2mm;
    font-size: 10.5pt;
    color: #1e293b;
  }
  .rx-empty {
    font-style: italic;
    color: #64748b;
    padding: 2mm 0;
  }
  .rx-advice {
    font-size: 10.5pt;
    line-height: 1.5;
    margin: 4mm 0;
    padding: 2.5mm 3mm;
    border-left: 3px solid #0f766e;
    background: #f0fdfa;
  }
  .rx-advice-title {
    font-weight: 800;
    margin-bottom: 1.5mm;
  }
  .rx-sign {
    margin-top: 8mm;
    display: flex;
    justify-content: flex-end;
  }
  .rx-sign-box {
    text-align: center;
    min-width: 55mm;
    font-size: 10.5pt;
  }
  .rx-sign-space {
    height: 14mm;
  }
  .rx-hint-screen {
    display: block;
    text-align: center;
    font-family: system-ui, sans-serif;
    font-size: 10pt;
    color: #64748b;
    padding: 8px;
  }
  @media print {
    .rx-hint-screen { display: none !important; }
  }
`

/** In đậm cụm liên quan giờ uống / lời dặn. */
function emphasizeAdviceHtml(text) {
  const raw = String(text || '').trim()
  if (!raw) {
    return '<strong>Uống thuốc đúng giờ</strong>, uống với nước lọc, <strong>không tự ý ngưng thuốc</strong> khi chưa hết đơn.'
  }
  let html = escapeHtml(raw)
  const patterns = [
    /(\d{1,2}\s*giờ)/gi,
    /(cách\s*\d+\s*giờ)/gi,
    /(đúng giờ)/gi,
    /(buổi sáng|buổi trưa|buổi chiều|buổi tối)/gi,
    /(\bsáng\b|\btrưa\b|\bchiều\b|\btối\b)/gi,
    /(trước ăn|sau ăn|khi đói|sau bữa)/gi,
    /(không tự ý ngưng|không ngưng thuốc)/gi,
    /(\d+\s*lần\s*\/\s*ngày|\d+\s*lần\/ngày)/gi,
  ]
  for (const rx of patterns) {
    html = html.replace(rx, '<strong>$1</strong>')
  }
  return html.replace(/\n/g, '<br />')
}

function buildMedicineList(lines) {
  const rows = Array.isArray(lines) ? lines : []
  if (!rows.length) {
    return '<p class="rx-empty">Không có thuốc trong đơn</p>'
  }
  const items = rows
    .map((row) => {
      const qtyLabel = formatQuantityVi(row.qty, row.unit)
      const usageHtml = row.usage
        ? `<div class="rx-drug-usage">${emphasizeAdviceHtml(row.usage)}</div>`
        : ''
      return `<li class="rx-drug">
        <div class="rx-drug-name">${escapeHtml(row.name)} — <span class="rx-drug-qty">Số lượng: ${escapeHtml(qtyLabel)}</span></div>
        ${usageHtml}
      </li>`
    })
    .join('')
  return `<ol class="rx-drug-list">${items}</ol>`
}

function buildHotlineBlock(view) {
  const parts = []
  if (view.clinicPhone) parts.push(`PK: ${escapeHtml(view.clinicPhone)}`)
  if (view.doctorPhone && view.doctorPhone !== view.clinicPhone) {
    parts.push(`BS: ${escapeHtml(view.doctorPhone)}`)
  }
  if (!parts.length) return ''
  return `<div class="rx-hotline">${parts.join('<br />')}</div>`
}

function buildSingleCopy(view, copyLabel) {
  const hasMedicines = Boolean(view.hasMedicines)
  const docTitle = hasMedicines ? 'ĐƠN THUỐC' : 'PHIẾU KHÁM BỆNH'
  const copyClass = hasMedicines ? 'rx-copy' : 'rx-copy rx-copy--exam-only'
  const adviceParts = hasMedicines
    ? [view.treatment, view.notes].filter((x) => String(x || '').trim())
    : []
  const adviceHtml = hasMedicines ? emphasizeAdviceHtml(adviceParts.join('\n')) : ''
  const adviceBlock = hasMedicines
    ? `<div class="rx-advice">
        <div class="rx-advice-title">Lời dặn</div>
        ${adviceHtml}
      </div>`
    : ''
  const symptomsBlock = view.symptoms
    ? hasMedicines
      ? `<br /><strong>Triệu chứng:</strong> ${escapeHtml(view.symptoms)}`
      : `<p style="margin-top:3mm;font-size:11pt;"><strong>Triệu chứng:</strong> ${escapeHtml(view.symptoms)}</p>`
    : ''

  return `
    <section class="${copyClass}">
      ${buildHotlineBlock(view)}
      <p class="rx-copy-label">${escapeHtml(copyLabel)}</p>
      <header class="rx-head">
        <div class="rx-clinic">${escapeHtml(view.clinicName)}</div>
        <h1 class="rx-title">${docTitle}</h1>
        <p class="rx-meta">${escapeHtml(view.examDate)}${view.ticket && view.ticket !== '—' ? ` · ${escapeHtml(view.ticket)}` : ''}</p>
      </header>
      <div class="rx-patient">
        <p><strong>Họ tên:</strong> ${escapeHtml(view.patientName)}</p>
        <p><strong>Mã BN:</strong> ${escapeHtml(view.patientCode)} · <strong>NS:</strong> ${escapeHtml(view.patientDob)} · <strong>GT:</strong> ${escapeHtml(view.patientGender)}</p>
        ${view.patientAddress ? `<p><strong>Địa chỉ:</strong> ${escapeHtml(view.patientAddress)}</p>` : ''}
        ${view.isYoungChild ? `<p class="rx-child-extra"><strong>Cân nặng:</strong> ${escapeHtml(view.patientWeight)} · <strong>Người nhà:</strong> ${escapeHtml(view.parentName)}</p>` : ''}
        <p><strong>Phòng khám:</strong> ${escapeHtml(view.clinicRoom)}</p>
      </div>
      <div class="rx-diagnosis">
        <strong>Chẩn đoán</strong>
        <span>${escapeHtml(view.diagnosis)}</span>
        ${symptomsBlock}
      </div>
      ${hasMedicines ? buildMedicineList(view.lines) : ''}
      ${adviceBlock}
      <div class="rx-sign">
        <div class="rx-sign-box">
          <p>${escapeHtml(view.examDate)}</p>
          <div class="rx-sign-space" aria-hidden="true"></div>
          <p><strong>${escapeHtml(view.doctorName)}</strong></p>
          <p>Bác sĩ khám bệnh</p>
        </div>
      </div>
    </section>`
}

function buildPrescriptionDocument(view) {
  const copy1 = buildSingleCopy(
    view,
    view.hasMedicines ? 'Bản 1 — Lưu hồ sơ phòng khám' : 'Bản 1 — Lưu phòng khám',
  )
  const copy2 = buildSingleCopy(view, view.hasMedicines ? 'Bản 2 — Giao bệnh nhân' : 'Bản 2 — Giao bệnh nhân')
  const pageTitle = view.hasMedicines ? 'Đơn thuốc' : 'Phiếu khám bệnh'
  const hint = view.hasMedicines
    ? 'Đơn thuốc mang ra ngoài — in <strong>02 bản</strong>.'
    : 'Phiếu khám (không kê thuốc) — in <strong>02 bản</strong>.'
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${pageTitle} — ${escapeHtml(view.patientName)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <p class="rx-hint-screen">${hint} Hộp thoại in: đặt <strong>Số bản = 2</strong> nếu được.</p>
  ${copy1}
  ${copy2}
</body>
</html>`
}

function parseRefDate(examAt, appointmentDate) {
  const s = String(examAt || '').trim()
  if (s) {
    const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  }
  if (appointmentDate) {
    const d = appointmentDate instanceof Date ? appointmentDate : new Date(appointmentDate)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

function ageInMonthsAt(dob, refDate) {
  const birth = dob instanceof Date ? dob : new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const ref = refDate instanceof Date ? refDate : new Date(refDate)
  let months = (ref.getFullYear() - birth.getFullYear()) * 12 + (ref.getMonth() - birth.getMonth())
  if (ref.getDate() < birth.getDate()) months -= 1
  return months >= 0 ? months : null
}

function resolveParentName(patient, appointment) {
  return (
    String(
      patient?.guardianName ??
        patient?.parentName ??
        patient?.caregiverName ??
        patient?.motherName ??
        patient?.fatherName ??
        appointment?.guardianName ??
        appointment?.parentName ??
        '',
    ).trim() || '—'
  )
}

export function buildPrescriptionPrintViewFromExam({
  selectedAppt,
  vitals,
  diagnosisIcd,
  prescriptionLines,
  doctorUser,
  clinicName = 'VitaCare Clinic',
  clinicPhone,
}) {
  const p = selectedAppt?.patient
  const genderRaw = String(p?.gender || '').trim()
  let gender = genderRaw || '—'
  if (/^(male|nam)$/i.test(genderRaw)) gender = 'Nam'
  else if (/^(female|nữ|nu)$/i.test(genderRaw)) gender = 'Nữ'

  const first = String(doctorUser?.firstName || '').trim()
  const last = String(doctorUser?.lastName || '').trim()
  const doctorName =
    `${last} ${first}`.trim() ||
    String(doctorUser?.displayName || doctorUser?.fullName || '').trim() ||
    'Bác sĩ'

  const lines = (Array.isArray(prescriptionLines) ? prescriptionLines : [])
    .filter((line) => rxLineMedicineName(line))
    .map((line, i) => ({
      index: i + 1,
      name: rxLineMedicineName(line),
      unit: String(line.unit || '').trim() || 'viên',
      qty: String(line.quantity ?? '').trim() || '',
      usage: [
        formatRxDosageLabel(line),
        formatRxFrequencyLabel(line),
        formatRxDurationLabel(line),
        String(line.note || '').trim(),
      ]
        .filter(Boolean)
        .join(' · '),
    }))

  const code = diagnosisIcd?.code
  const name = diagnosisIcd?.name
  const diagnosis =
    code && name ? `${code} - ${name}` : String(vitals?.diagnosis || '').trim() || '—'

  const refDate = parseRefDate(vitals?.examAt, selectedAppt?.appointmentDate)
  const months = p?.dob ? ageInMonthsAt(p.dob, refDate) : null
  const isYoungChild = months != null && months < 72
  const weightRaw = String(vitals?.weight ?? '').trim()
  const patientWeight =
    weightRaw && weightRaw !== '--' ? `${weightRaw.replace(',', '.')} kg` : '—'

  const phoneEnv = String(import.meta.env.VITE_CLINIC_PHONE || '').trim()

  return {
    hasMedicines: lines.length > 0,
    clinicName,
    clinicPhone: clinicPhone || phoneEnv || DEFAULT_CLINIC_PHONE,
    doctorPhone: String(doctorUser?.phone || doctorUser?.mobile || '').trim(),
    ticket: String(selectedAppt?.ticket || '').trim() || '—',
    examDate: String(vitals?.examAt || '').trim() || '—',
    clinicRoom: String(vitals?.clinicRoom || '').trim() || '—',
    patientName: [p?.lastName, p?.firstName].filter(Boolean).join(' ').trim() || p?.displayName || '—',
    patientCode: String(p?.patientCode || '').trim() || '—',
    patientDob: p?.dob ? formatDobShort(p.dob) : '—',
    patientGender: gender,
    patientAddress: String(p?.address || '').trim(),
    isYoungChild,
    patientWeight,
    parentName: resolveParentName(p, selectedAppt),
    doctorName,
    diagnosis,
    symptoms: String(vitals?.symptoms || '').trim(),
    treatment: String(vitals?.treatment || '').trim(),
    notes: String(vitals?.notes || '').trim(),
    lines,
  }
}

function formatDobShort(iso) {
  const d = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/**
 * Mở hộp thoại in đơn thuốc (2 trang / 2 bản).
 * @param {object} view
 * @param {{ onPrintInvoked?: () => void | Promise<void>, onAfterPrint?: () => void }} [hooks]
 */
export function printPrescription(view, hooks = {}) {
  if (!view) return false

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'In đơn thuốc')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;'

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    iframe.remove()
    return false
  }

  doc.open()
  doc.write(buildPrescriptionDocument(view))
  doc.close()

  const win = iframe.contentWindow
  if (!win) {
    iframe.remove()
    return false
  }

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    iframe.remove()
  }

  win.onafterprint = () => {
    try {
      hooks.onAfterPrint?.()
    } finally {
      cleanup()
    }
  }

  window.setTimeout(() => {
    try {
      win.focus()
      win.print()
      void Promise.resolve(hooks.onPrintInvoked?.()).catch(() => {})
    } catch {
      cleanup()
      return false
    }
    window.setTimeout(cleanup, 6000)
  }, 250)

  return true
}
