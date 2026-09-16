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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <main className="w-full max-w-md">
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đăng nhập</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">Nhập thông tin tài khoản nhân viên phòng khám.</p>
          </div>

          {info ? (
            <p className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-xs text-blue-800" role="status">
              {info}
            </p>
          ) : null}

          {error ? (
            <p className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium" role="alert">
              {error}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} method="post" action="#" noValidate className="space-y-4">
            <div>
              <label htmlFor="staff-login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email hoặc Tên tài khoản
              </label>
              <input
                id="staff-login-email"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Nhập email nhân viên"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="staff-login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative block">
                <input
                  id="staff-login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-3.5 pr-14 py-2.5 text-sm bg-white border border-slate-300 rounded placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors disabled:opacity-50 cursor-pointer"
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

            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap text-xs">
              <div>
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading}
                  />
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <button type="button" className="text-slate-400 cursor-not-allowed font-medium" disabled>
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Đang xử lý…' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
