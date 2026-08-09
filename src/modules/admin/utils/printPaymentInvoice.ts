function escapeHtml(value) {
  const s = value == null || String(value).trim() === '' ? '—' : String(value)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const PRINT_STYLES = `
  @page {
    size: portrait;
    margin: 10mm;
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
  body {
    display: flex;
    justify-content: center;
    padding: 4mm 0;
  }
  .inv {
    width: 80mm;
    max-width: 80mm;
    border: 1.5px solid #0f172a;
    padding: 5mm;
    font-size: 10.5pt;
    line-height: 1.35;
    page-break-inside: avoid;
  }
  .inv-brand {
    text-align: center;
    font-weight: 900;
    letter-spacing: 0.14em;
    font-size: 11pt;
    color: #0f766e;
  }
  .inv-title {
    text-align: center;
    margin: 2mm 0 1mm;
    font-size: 13pt;
    font-weight: 800;
    text-transform: uppercase;
  }
  .inv-meta {
    text-align: center;
    font-size: 9pt;
    color: #475569;
    margin-bottom: 3mm;
    padding-bottom: 2mm;
    border-bottom: 1px solid #cbd5e1;
  }
  .inv-amount-box {
    text-align: center;
    margin: 3mm 0;
    padding: 2.5mm;
    border: 2px solid #0f766e;
    background: #f0fdfa;
  }
  .inv-amount-label {
    font-size: 9pt;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
  }
  .inv-amount-value {
    margin: 1mm 0 0;
    font-size: 18pt;
    font-weight: 900;
    color: #0f766e;
  }
  .inv-amount-words {
    margin-top: 1.5mm;
    font-size: 9.5pt;
    font-style: italic;
    color: #334155;
  }
  .inv-rows { margin: 0; }
  .inv-row {
    display: flex;
    justify-content: space-between;
    gap: 2mm;
    padding: 1.5mm 0;
    border-bottom: 1px dashed #e2e8f0;
    font-size: 9.5pt;
  }
  .inv-row dt {
    margin: 0;
    flex: 0 0 38%;
    font-weight: 600;
    color: #64748b;
  }
  .inv-row dd {
    margin: 0;
    flex: 1;
    text-align: right;
    font-weight: 700;
    word-break: break-word;
  }
  .inv-foot {
    margin-top: 3mm;
    padding-top: 2mm;
    border-top: 1px solid #cbd5e1;
    font-size: 8.5pt;
    color: #64748b;
    text-align: center;
  }
  .inv-sign {
    margin-top: 5mm;
    display: flex;
    justify-content: space-between;
    gap: 4mm;
    font-size: 9pt;
  }
  .inv-sign div {
    flex: 1;
    text-align: center;
  }
  .inv-sign strong {
    display: block;
    margin-bottom: 12mm;
    font-weight: 700;
  }
`

function buildPaymentInvoiceDocument(view) {
  const noteRow = view.note
    ? `<div class="inv-row"><dt>Ghi chú</dt><dd>${escapeHtml(view.note)}</dd></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Hóa đơn ${escapeHtml(view.invoiceNo)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <article class="inv">
    <div class="inv-brand">VITACARE</div>
    <h1 class="inv-title">Hóa đơn thu phí khám</h1>
    <p class="inv-meta">
      Số: <strong>${escapeHtml(view.invoiceNo)}</strong><br />
      ${escapeHtml(view.paidAt)}
    </p>
    <div class="inv-amount-box">
      <div class="inv-amount-label">Tổng thanh toán</div>
      <p class="inv-amount-value">${escapeHtml(view.amountFormatted)}</p>
      <p class="inv-amount-words">(${escapeHtml(view.amountInWords)})</p>
    </div>
    <dl class="inv-rows">
      <div class="inv-row"><dt>Mã lịch</dt><dd>${escapeHtml(view.ticket)}</dd></div>
      <div class="inv-row"><dt>Bệnh nhân</dt><dd>${escapeHtml(view.patientName)}</dd></div>
      <div class="inv-row"><dt>Mã BN</dt><dd>${escapeHtml(view.patientCode)}</dd></div>
      <div class="inv-row"><dt>Nội dung</dt><dd>Phí khám bệnh</dd></div>
      <div class="inv-row"><dt>Bác sĩ</dt><dd>${escapeHtml(view.doctorName)}</dd></div>
      <div class="inv-row"><dt>Chuyên khoa</dt><dd>${escapeHtml(view.specialtyName)}</dd></div>
      <div class="inv-row"><dt>Ngày khám</dt><dd>${escapeHtml(view.examDate)} ${escapeHtml(view.examTime)}</dd></div>
      <div class="inv-row"><dt>Phòng / STT</dt><dd>${escapeHtml(view.clinicRoom)} · ${escapeHtml(view.queueNumber)}</dd></div>
      <div class="inv-row"><dt>Hình thức</dt><dd>${escapeHtml(view.methodLabel)}</dd></div>
      <div class="inv-row"><dt>Thu ngân</dt><dd>${escapeHtml(view.paidBy)}</dd></div>
      ${noteRow}
    </dl>
    <div class="inv-sign">
      <div><strong>Người nộp tiền</strong><em>(ký, ghi rõ họ tên)</em></div>
      <div><strong>Thu ngân</strong><em>(ký, đóng dấu)</em></div>
    </div>
    <p class="inv-foot">Phiếu in từ hệ thống — không có giá trị thay hóa đơn GTGT nếu chưa xuất theo quy định.</p>
  </article>
</body>
</html>`
}

/** In hóa đơn thu phí khám (khổ 80mm). */
export function printPaymentInvoice(view) {
  if (!view) return false

  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'In hóa đơn')
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
  doc.write(buildPaymentInvoiceDocument(view))
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

/** In hóa đơn trước, sau đó in phiếu khám (nếu có). */
export function printPaymentThenVisitSlip({ invoice, visitSlip, printVisitSlip }) {
  if (!invoice && !visitSlip) return false
  if (invoice && printPaymentInvoice(invoice)) {
    if (visitSlip && typeof printVisitSlip === 'function') {
      window.setTimeout(() => printVisitSlip(visitSlip), 650)
    }
    return true
  }
  if (visitSlip && typeof printVisitSlip === 'function') {
    return printVisitSlip(visitSlip)
  }
  return false
}
