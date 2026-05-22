/** Lấy mã vé từ nội dung QR (plain YMA… hoặc URL có ticket/code). */
export function ticketFromQrPayload(text) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  try {
    const u = new URL(raw)
    const q = u.searchParams.get('ticket') || u.searchParams.get('code')
    if (q) return String(q).trim()
  } catch {
    /* không phải URL */
  }
  const m = raw.match(/YMA[a-zA-Z0-9]+/i)
  return (m ? m[0] : raw).trim()
}

export function qrCodeImageUrl(ticket, size = 120) {
  const code = String(ticket || '').trim()
  if (!code || code === '—') return ''
  const n = Math.max(80, Math.min(400, Number(size) || 120))
  return `https://api.qrserver.com/v1/create-qr-code/?size=${n}x${n}&data=${encodeURIComponent(code)}`
}
