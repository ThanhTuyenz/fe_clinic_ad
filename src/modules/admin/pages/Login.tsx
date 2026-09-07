'use client'

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from '@/common/hooks/useNextNavigation'
import { useAuth } from '../../../common/hooks/useAuth'
import { login as loginApi } from '../services/auth'

function readLastEmail() {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('staff_remember_email') || ''
    } catch {
      return ''
    }
  }
  return ''
}

function readRememberPref() {
  if (typeof window !== 'undefined') {
    try {
      const pref = localStorage.getItem('staff_remember_pref')
      return pref !== null ? pref === 'true' : true
    } catch {
      return true
    }
  }
  return true
}

function userTypeLower(user) {
  return String(user?.userType || user?.role || '').trim().toLowerCase()
}

function redirectPathForUser(user) {
  if (userTypeLower(user) === 'pharmacist') return '/pharmacy'
  return '/dashboard'
}

function isStaffUser(user) {
  const t = userTypeLower(user)
  return ['admin', 'branch_manager', 'doctor', 'receptionist', 'registration', 'pharmacist', 'cashier'].includes(t)
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(location.state?.message || '')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const savedEmail = readLastEmail()
    const savedRemember = readRememberPref()
    if (savedEmail) {
      setEmail(savedEmail)
    }
    setRemember(savedRemember)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    const emailOrPhone = email.trim()
    if (!emailOrPhone || !password) {
      setError('Vui lòng nhập email và mật khẩu.')
      return
    }

    setLoading(true)
    try {
      const data = await loginApi({ email: emailOrPhone, password })

      if (!isStaffUser(data?.user)) {
        throw new Error('Chỉ nhân viên/bác sĩ mới được phép đăng nhập tại trang này.')
      }

      if (typeof window !== 'undefined') {
        try {
          if (remember) {
            localStorage.setItem('staff_remember_email', emailOrPhone)
            localStorage.setItem('staff_remember_pref', 'true')
          } else {
            localStorage.removeItem('staff_remember_email')
            localStorage.setItem('staff_remember_pref', 'false')
          }
        } catch {
          // ignore storage errors
        }
      }

      login({ token: data.token, user: data.user, remember })

      const returnPath = String(location.state?.from || '')
      navigate(returnPath.startsWith('/') ? returnPath : redirectPathForUser(data.user), { replace: true })
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

          <form onSubmit={handleSubmit} method="post" action="#" noValidate>
            <div className="auth-field">
              <input
                id="staff-login-email"
                name="username"
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
                  id="staff-login-password"
                  name="password"
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
