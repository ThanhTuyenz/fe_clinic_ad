function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function normalizeToken(raw) {
  const t = String(raw || '').trim()
  if (!t || t === 'null' || t === 'undefined') return ''
  return t
}

/** Kiểm tra JWT hết hạn (không verify chữ ký — chỉ đọc claim exp). */
export function isJwtExpired(token) {
  try {
    const parts = normalizeToken(token).split('.')
    if (parts.length !== 3) return true
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64))
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function clearStaffSession() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  } catch {
    /* ignore */
  }
}

export function staffRole(user) {
  return String(user?.userType || user?.role || '').trim().toLowerCase()
}

/** Tiếp đón hoặc đăng ký — được gọi API danh sách BN, đặt lịch quầy, … */
export function isReceptionStaff(user) {
  const r = staffRole(user)
  return r === 'receptionist' || r === 'registration'
}

function readPair(storage) {
  const token = normalizeToken(storage.getItem('token'))
  if (!token) return null
  if (isJwtExpired(token)) {
    storage.removeItem('token')
    storage.removeItem('user')
    return null
  }
  return {
    token,
    user: safeParse(storage.getItem('user') || 'null'),
  }
}

/**
 * Ưu tiên localStorage (ghi nhớ đăng nhập). Bỏ token hết hạn / không phải JWT.
 */
export function getStaffSession() {
  try {
    const fromLs = readPair(localStorage)
    if (fromLs) return fromLs
    const fromSs = readPair(sessionStorage)
    if (fromSs) return fromSs
    return { token: null, user: null }
  } catch {
    return { token: null, user: null }
  }
}
