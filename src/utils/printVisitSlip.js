import { qrCodeImageUrl } from './ticketQr.js'

function escapeHtml(value) {
  const s = value == null || String(value).trim() === '' ? '—' : String(value)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* Phiếu khám: STT + tên BN nổi bật; QR góc dưới cho máy quét. */
const PRINT_STYLES = `
  @page {
    size: portrait;
    margin: 10mm;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    font-family: system-ui, "Segoe UI", Roboto, Arial, sans-serif;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 0;
  }
  .slip {
    position: relative;
    width: 80mm;
    max-width: 80mm;
    padding: 5mm 5mm 22mm;
    border: 1.5px solid #0f172a;
    background: #fff;
    font-size: 11pt;
    line-height: 1.3;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .slip-stt {
    text-align: center;
    padding: 2mm 0 3mm;
    margin-bottom: 2mm;
    border-bottom: 2px solid #0f172a;
  }
  .slip-stt-label {
    display: block;
    margin: 0 0 1mm;
    font-size: 10pt;
    font-weight: 800;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .slip-stt-num {
    margin: 0;
    font-size: 40pt;
    font-weight: 900;
    color: #0f766e;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .slip-patient {
    text-align: center;
    margin-bottom: 3mm;
    padding-bottom: 2.5mm;
    border-bottom: 1px dashed #cbd5e1;
  }
  .slip-patient-label {
    display: block;
    margin: 0 0 1mm;
    font-size: 9pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .slip-patient-name {
    margin: 0;
    font-size: 15pt;
    font-weight: 800;
    line-height: 1.25;
    word-break: break-word;
  }
  .slip-head {
    text-align: center;
    margin-bottom: 3mm;
    padding-bottom: 2mm;
    border-bottom: 1px solid #e2e8f0;
  }
  .slip-brand {
    font-weight: 900;
    letter-spacing: 0.12em;
    font-size: 9pt;
    color: #0f766e;
  }
  .slip-title {
    margin: 1mm 0 0;
    font-size: 11pt;
    font-weight: 800;
    color: #334155;
  }
  .slip-meta {
    margin: 1.5mm 0 0;
    font-size: 9pt;
    color: #64748b;
    font-weight: 600;
  }
  .slip-rows { margin: 0; }
  .slip-row {
    padding: 2mm 0;
    border-bottom: 1px dashed #e2e8f0;
  }
  .slip-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .slip-row dt {
    margin: 0 0 0.5mm;
    font-size: 8.5pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .slip-row dd {
    margin: 0;
    font-size: 12pt;
    font-weight: 800;
    word-break: break-word;
  }
  .slip-qr-corner {
    position: absolute;
    right: 3mm;
    bottom: 3mm;
    width: 20mm;
    text-align: center;
  }
  .slip-qr-corner img {
    display: block;
    width: 18mm;
    height: 18mm;
    margin: 0 auto;
  }
  .slip-qr-code {
    margin: 0.5mm 0 0;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    word-break: break-all;
    color: #475569;
    line-height: 1.2;
  }
`

function buildVisitSlipDocument(view) {
  const meta =
    view.ticket && view.ticket !== '—'
      ? `${escapeHtml(view.examDate)} · ${escapeHtml(view.ticket)}`
      : escapeHtml(view.examDate)
  const ticketCode = String(view.ticket || '').trim()
  const qrUrl = qrCodeImageUrl(ticketCode, 100)
  const qrBlock = qrUrl
    ? `<aside class="slip-qr-corner" aria-label="Mã QR lịch hẹn">
        <img src="${escapeHtml(qrUrl)}" alt="" width="100" height="100" />
        <p class="slip-qr-code">${escapeHtml(ticketCode)}</p>
      </aside>`
    : ''

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Phiếu khám</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <article class="slip">
    <div class="slip-stt">
      <span class="slip-stt-label">Số thứ tự</span>
      <p class="slip-stt-num">${escapeHtml(view.queueNumber)}</p>
    </div>
    <div class="slip-patient">
      <span class="slip-patient-label">Bệnh nhân</span>
      <p class="slip-patient-name">${escapeHtml(view.patientName)}</p>
    </div>
    <header class="slip-head">
      <div class="slip-brand">VITACARE</div>
      <h1 class="slip-title">Phiếu khám</h1>
      <p class="slip-meta">${meta}</p>
    </header>
    <dl class="slip-rows">
      <div class="slip-row">
        <dt>Phòng khám</dt>
        <dd>${escapeHtml(view.clinicRoom)}</dd>
      </div>
      <div class="slip-row">
        <dt>Bác sĩ</dt>
        <dd>${escapeHtml(view.doctorName)}</dd>
      </div>
      <div class="slip-row">
        <dt>Giờ khám</dt>
        <dd>${escapeHtml(view.examTime)}</dd>
      </div>
    </dl>
    ${qrBlock}
  </article>
</body>
</html>`
}

/** In phiếu khám trong khung riêng — căn giữa tờ, không dính góc trang app. */
export function printVisitSlip(view) {
  if (!view) return false

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'In phiếu khám')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    iframe.remove()
    return false
  }

  doc.open()
  doc.write(buildVisitSlipDocument(view))
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

  win.onafterprint = cleanup
  window.setTimeout(() => {
    try {
      win.focus()
      win.print()
    } catch {
      cleanup()
      return
    }
    window.setTimeout(cleanup, 4000)
  }, 200)

  return true
}
