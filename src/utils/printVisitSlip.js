import { qrCodeImageUrl } from './ticketQr.js'

function escapeHtml(value) {
  return String(value ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* Một tờ ở Scale 100%. Muốn to hơn: chỉ tăng Scale trình duyệt (vd. 150), tránh phóng kép trong CSS. */
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
    width: 80mm;
    max-width: 80mm;
    padding: 6mm 5mm 7mm;
    border: 1.5px solid #0f172a;
    background: #fff;
    font-size: 12pt;
    line-height: 1.3;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .slip-head {
    text-align: center;
    margin-bottom: 4mm;
    padding-bottom: 3mm;
    border-bottom: 2px solid #0f172a;
  }
  .slip-brand {
    font-weight: 900;
    letter-spacing: 0.12em;
    font-size: 11pt;
  }
  .slip-title {
    margin: 2mm 0 0;
    font-size: 16pt;
    font-weight: 800;
  }
  .slip-meta {
    margin: 2mm 0 0;
    font-size: 10pt;
    color: #334155;
    font-weight: 600;
  }
  .slip-qr {
    text-align: center;
    margin-bottom: 4mm;
    padding-bottom: 3mm;
    border-bottom: 1px dashed #cbd5e1;
  }
  .slip-qr img {
    display: block;
    width: 28mm;
    height: 28mm;
    margin: 0 auto;
  }
  .slip-qr-code {
    margin: 1.5mm 0 0;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.03em;
    word-break: break-all;
  }
  .slip-rows { margin: 0; }
  .slip-row {
    padding: 2.5mm 0;
    border-bottom: 1px dashed #cbd5e1;
  }
  .slip-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .slip-row dt {
    margin: 0 0 1mm;
    font-size: 10pt;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .slip-row dd {
    margin: 0;
    font-size: 14pt;
    font-weight: 800;
    word-break: break-word;
  }
  .slip-row--stt {
    text-align: center;
    padding: 3mm 0 4mm;
    border-bottom: 2px solid #0f172a;
  }
  .slip-row--stt dd {
    font-size: 36pt;
    font-weight: 900;
    color: #0f766e;
    line-height: 1.05;
  }
`

function buildVisitSlipDocument(view) {
  const meta =
    view.ticket && view.ticket !== '—' ? `${escapeHtml(view.examDate)} · ${escapeHtml(view.ticket)}` : escapeHtml(view.examDate)
  const ticketCode = String(view.ticket || '').trim()
  const qrUrl = qrCodeImageUrl(ticketCode, 140)
  const qrBlock = qrUrl
    ? `<div class="slip-qr">
        <img src="${escapeHtml(qrUrl)}" alt="" width="140" height="140" />
        <p class="slip-qr-code">${escapeHtml(ticketCode)}</p>
      </div>`
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
    <header class="slip-head">
      <div class="slip-brand">VITACARE</div>
      <h1 class="slip-title">Phiếu khám</h1>
      <p class="slip-meta">${meta}</p>
    </header>
    ${qrBlock}
    <dl class="slip-rows">
      <div class="slip-row slip-row--stt">
        <dt>Số thứ tự</dt>
        <dd>${escapeHtml(view.queueNumber)}</dd>
      </div>
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
