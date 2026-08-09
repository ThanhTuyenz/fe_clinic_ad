/**
 * Compatibility session for legacy screens.
 * Authentication lives exclusively in httpOnly cookies; nothing is persisted in Web Storage.
 */
let runtimeSession: { token: string | null; user: any } = { token: null, user: null }

export function clearStaffSession() {
  runtimeSession = { token: null, user: null }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('staff-session-changed'))
}

export function saveStaffSession({ user }: { token?: string; user: any; remember?: boolean }) {
  if (!user) throw new Error('Dữ liệu phiên đăng nhập không hợp lệ.')
  runtimeSession = { token: 'cookie-session', user }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('staff-session-changed'))
}

export function setRuntimeStaffSession(user: any) {
  runtimeSession = user ? { token: 'cookie-session', user } : { token: null, user: null }
}

export function staffRole(user: any) {
  return String(user?.userType || user?.role || '').trim().toLowerCase()
}

export function isReceptionStaff(user: any) {
  const role = staffRole(user)
  return role === 'receptionist' || role === 'registration'
}

export function getStaffSession() {
  return runtimeSession
}
