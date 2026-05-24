const ONES = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

function capitalizeVi(s) {
  const t = String(s || '').trim()
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function readTwoDigits(n) {
  if (n < 10) return ONES[n]
  if (n === 10) return 'mười'
  if (n < 20) return `mười ${ONES[n - 10]}`
  const tens = Math.floor(n / 10)
  const ones = n % 10
  if (ones === 0) return `${ONES[tens]} mươi`
  if (ones === 1) return `${ONES[tens]} mươi mốt`
  if (ones === 5) return `${ONES[tens]} mươi lăm`
  return `${ONES[tens]} mươi ${ONES[ones]}`
}

function readThreeDigits(n) {
  if (n < 100) return readTwoDigits(n)
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const head = hundreds === 1 ? 'một trăm' : `${ONES[hundreds]} trăm`
  if (rest === 0) return head
  if (rest < 10) return `${head} lẻ ${readTwoDigits(rest)}`
  return `${head} ${readTwoDigits(rest)}`
}

/** Đọc số nguyên dương ≤ 999999 (dùng cho SL đơn thuốc). */
export function numberToVietnamese(n) {
  const num = Math.round(Number(n))
  if (!Number.isFinite(num) || num < 0) return ''
  if (num === 0) return 'không'
  if (num < 1000) return readThreeDigits(num)

  const thousands = Math.floor(num / 1000)
  const rest = num % 1000
  let out = thousands === 1 ? 'một nghìn' : `${readThreeDigits(thousands)} nghìn`
  if (rest === 0) return out
  if (rest < 100) out += ' lẻ'
  else out += ' '
  out += readThreeDigits(rest)
  return out
}

/** Đọc số tiền VND (≤ 999.999.999) — dùng trên hóa đơn. */
export function vndAmountInWords(amount) {
  const num = Math.round(Number(amount))
  if (!Number.isFinite(num) || num < 0) return ''
  if (num === 0) return 'Không đồng'

  function readUpTo999(n) {
    if (n < 1000) return readThreeDigits(n)
    const thousands = Math.floor(n / 1000)
    const rest = n % 1000
    const head = thousands === 1 ? 'một nghìn' : `${readThreeDigits(thousands)} nghìn`
    if (rest === 0) return head
    if (rest < 100) return `${head} lẻ ${readThreeDigits(rest)}`
    return `${head} ${readThreeDigits(rest)}`
  }

  let out = ''
  if (num < 1_000_000) {
    out = readUpTo999(num)
  } else {
    const millions = Math.floor(num / 1_000_000)
    const rest = num % 1_000_000
    const head = millions === 1 ? 'một triệu' : `${readThreeDigits(millions)} triệu`
    if (rest === 0) out = head
    else if (rest < 1000) out = `${head} lẻ ${readUpTo999(rest)}`
    else out = `${head} ${readUpTo999(rest)}`
  }

  return `${capitalizeVi(out)} đồng`
}

/** VD: 10 → "10 (Mười) viên" */
export function formatQuantityVi(qty, unit = 'viên') {
  const n = Number(String(qty ?? '').replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return '—'
  const words = capitalizeVi(numberToVietnamese(n))
  const u = String(unit || 'viên').trim() || 'viên'
  const qtyStr = Number.isInteger(n) ? String(n) : String(n)
  return `${qtyStr} (${words}) ${u}`
}
