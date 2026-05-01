function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Ưu tiên localStorage khi có token (ghi nhớ đăng nhập), không trộn user từ kho khác.
 */
export function getStaffSession() {
  try {
    const lsTok = localStorage.getItem('token')
    if (lsTok) {
      return {
        token: lsTok,
        user: safeParse(localStorage.getItem('user') || 'null'),
      }
    }
    const ssTok = sessionStorage.getItem('token')
    if (ssTok) {
      return {
        token: ssTok,
        user: safeParse(sessionStorage.getItem('user') || 'null'),
      }
    }
    return { token: null, user: null }
  } catch {
    return { token: null, user: null }
  }
}
