import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth.js'
import { clearStaffSession } from '../utils/staffSession.js'
import '../styles/auth.css'

/** Chỉ lưu lựa chọn UI (có/không ghi nhớ), không lưu mật khẩu. */
const REMEMBER_PREF_KEY = 'vitacare_staff_remember_login'
/** Email lần đăng nhập gần nhất — tự điền ô email (không lưu mật khẩu). */
const LAST_EMAIL_KEY = 'vitacare_staff_last_login_email'

function readLastEmail() {
  try {
    return String(localStorage.getItem(LAST_EMAIL_KEY) || '').trim()
  } catch {
    return ''
  }
}

function readRememberPref() {
  try {
    const v = localStorage.getItem(REMEMBER_PREF_KEY)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* ignore */
  }
  return true
}

function userTypeLower(user) {
  return String(user?.userType || user?.role || '').trim().toLowerCase()
}

function redirectPathForUser() {
  return '/dashboard'
}

function isStaffUser(user) {
  const t = userTypeLower(user)
  return t === 'doctor' || t === 'receptionist' || t === 'registration'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState(readLastEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(readRememberPref)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(location.state?.message || '')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const passwordRef = useRef(null)

  useEffect(() => {
    if (email.trim() && passwordRef.current) {
      passwordRef.current.focus()
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    const emailOrPhone = email.trim()
    if (!emailOrPhone || !password) {
      setError('Vui lòng nhập email/số điện thoại và mật khẩu.')
      return
    }

    setLoading(true)
    try {
      const data = await loginApi({ email: emailOrPhone, password })

      clearStaffSession()

      if (!isStaffUser(data?.user)) {
        throw new Error('Chỉ nhân viên/bác sĩ mới được phép đăng nhập tại trang này.')
      }

      const storage = remember ? localStorage : sessionStorage
      storage.setItem('token', data.token)
      storage.setItem('user', JSON.stringify(data.user))

      try {
        localStorage.setItem(REMEMBER_PREF_KEY, remember ? '1' : '0')
        localStorage.setItem(LAST_EMAIL_KEY, emailOrPhone)
      } catch {
        /* ignore */
      }

      navigate(redirectPathForUser(data.user), { replace: true })
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <main className="auth-panel">
        <div className="auth-card">
          <h2>Đăng nhập</h2>
          <p className="auth-card-sub">Nhập thông tin tài khoản nhân viên.</p>

          {info ? (
            <p className="auth-info" role="status">
              {info}
            </p>
          ) : null}

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <input
                id="staff-login-email"
                type="text"
                autoComplete="username"
                placeholder="Nhập email nhân viên"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="auth-field">
              <div className="auth-password-wrap">
                <input
                  ref={passwordRef}
                  id="staff-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-remember-col">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                  />
                  Ghi nhớ đăng nhập
                </label>
      
              </div>
              <button type="button" className="auth-link" disabled>
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Đang xử lý…' : 'Đăng nhập'}
            </button>
          </form>

        </div>
      </main>
    </div>
  )
}
