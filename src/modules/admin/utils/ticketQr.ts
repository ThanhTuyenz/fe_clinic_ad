/** Lấy mã vé từ nội dung QR (plain mã vé, URL có ticket/code/bookingCode, hoặc token bảo mật). */
export function ticketFromQrPayload(text) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  // 1. Nếu là token check-in bảo mật hoặc mã CCCD có pipe (|) -> giữ nguyên
  if (raw.startsWith('VITACARE_CHECKIN:') || raw.includes('|')) {
    return raw
  }
  // 2. Nếu là URL, trích xuất ticket/code/bookingCode từ query params
  try {
    const u = new URL(raw)
    const q =
      u.searchParams.get('ticket') ||
      u.searchParams.get('code') ||
      u.searchParams.get('bookingCode') ||
      u.searchParams.get('booking_code') ||
      u.searchParams.get('orderCode')
    if (q) return String(q).trim()
  } catch {
    /* không phải URL */
  }
  // 3. Regex nhận diện mã phiếu khám thông dụng
  const m = raw.match(/YMA[a-zA-Z0-9]+/i)
  return (m ? m[0] : raw).trim()
}

export function qrCodeImageUrl(ticket, size = 120) {
  const code = String(ticket || '').trim()
  if (!code || code === '—') return ''
  const n = Math.max(80, Math.min(400, Number(size) || 120))
  return `https://api.qrserver.com/v1/create-qr-code/?size=${n}x${n}&data=${encodeURIComponent(code)}`
}
