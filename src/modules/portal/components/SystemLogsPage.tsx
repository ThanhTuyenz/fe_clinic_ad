'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Loader2,
  Database,
  Cpu,
  Shield,
  Layers,
  ArrowUpRight,
  Eye,
  X,
  FileCode,
  LogIn,
  User,
  Clock,
  Phone,
  Mail,
  Building2,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/common/hooks/useAuth'
import { apiClient, unwrapApiData } from '@/lib/api-client'
import {
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  AdminTableFooter,
} from '@/common/components/ui'

interface LogItem {
  id: string
  type: 'AUDIT' | 'OUTBOX' | 'LOGIN'
  action: string
  targetType: string
  targetId: string
  metadata?: any
  actorName: string
  actorRole: string
  status: string
  error?: string | null
  createdAt: string
}

interface LoginItem {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string
  role: string
  status: string
  loginAt: string
  branchName: string
  branchCode: string
}

const ROLE_BADGES: Record<string, { label: string; badge: string }> = {
  ADMIN: { label: 'Quản trị viên', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
  BRANCH_MANAGER: { label: 'Quản lý chi nhánh', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  DOCTOR: { label: 'Bác sĩ', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  RECEPTIONIST: { label: 'Tiếp đón / Thu ngân', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  PATIENT: { label: 'Bệnh nhân', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
}

export default function SystemLogsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'LOGINS' | 'ALL' | 'ERRORS' | 'AUDIT' | 'OUTBOX'>('LOGINS')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/stats/system-logs')
      const payload = unwrapApiData(res.data)
      setData(payload)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải nhật ký hệ thống')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchLogs()
    }
  }, [token])

  // Lọc nhật ký đăng nhập
  const filteredLogins: LoginItem[] = useMemo(() => {
    const list: LoginItem[] = data?.recentLogins || data?.data?.recentLogins || []
    if (!searchTerm.trim()) return list
    const term = searchTerm.toLowerCase()
    return list.filter((u) => {
      const matchName = u.fullName?.toLowerCase().includes(term)
      const matchEmail = u.email?.toLowerCase().includes(term)
      const matchPhone = u.phone?.toLowerCase().includes(term)
      const matchBranch = u.branchName?.toLowerCase().includes(term)
      const matchRole = u.role?.toLowerCase().includes(term)
      return matchName || matchEmail || matchPhone || matchBranch || matchRole
    })
  }, [data, searchTerm])

  // Lọc sự kiện nhật ký hệ thống (Audit / Outbox / Errors)
  const filteredLogs: LogItem[] = useMemo(() => {
    const list: LogItem[] = data?.logs || data?.data?.logs || []
    return list.filter((log) => {
      if (activeTab === 'ERRORS') {
        const isErr = log.status === 'ERROR' || log.status === 'FAILED' || Boolean(log.error)
        if (!isErr) return false
      } else if (activeTab === 'AUDIT') {
        if (log.type !== 'AUDIT' && log.type !== 'LOGIN') return false
      } else if (activeTab === 'OUTBOX') {
        if (log.type !== 'OUTBOX') return false
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchAction = log.action?.toLowerCase().includes(term)
        const matchTarget = log.targetType?.toLowerCase().includes(term)
        const matchActor = log.actorName?.toLowerCase().includes(term)
        const matchError = log.error?.toLowerCase().includes(term)
        if (!matchAction && !matchTarget && !matchActor && !matchError) return false
      }
      return true
    })
  }, [data, activeTab, searchTerm])

  const summary = data?.summary || data?.data?.summary || {
    branchesCount: 0,
    managersCount: 0,
    doctorsCount: 0,
    staffCount: 0,
    bookingMethodsCount: 0,
    totalLogs: (data?.logs || data?.data?.logs || []).length,
    errorCount: (data?.logs || data?.data?.logs || []).filter((l: any) => l.status === 'ERROR' || l.status === 'FAILED').length,
    recentLoginsCount: (data?.recentLogins || data?.data?.recentLogins || []).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <Server className="w-3.5 h-3.5 text-slate-500" /> Giám sát & Vận hành
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Nhật ký đăng nhập & Hoạt động hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi phiên truy cập của người dùng, kiểm toán thay đổi dữ liệu và cảnh báo sự cố kỹ thuật.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 rounded bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Dịch vụ nền & Hạ tầng kết nối */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded bg-purple-50 text-purple-700">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800">Nhật ký đăng nhập</h2>
                <p className="text-[11px] text-slate-500">{summary.recentLoginsCount || 0} phiên gần nhất</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              Bảo mật
            </span>
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded bg-emerald-50 text-emerald-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800">Cơ sở dữ liệu</h2>
                <p className="text-[11px] text-slate-500">{data?.services?.database?.name || 'PostgreSQL (Prisma ORM)'}</p>
              </div>
            </div>
            {data?.services?.database?.status === 'ONLINE' ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Trực tuyến {data?.services?.database?.latency && `(${data.services.database.latency})`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                <AlertTriangle className="w-3 h-3" /> Ngoại tuyến
              </span>
            )}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded bg-emerald-50 text-emerald-700">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800">Redis Cache & Pub/Sub</h2>
                <p className="text-[11px] text-slate-500">{data?.services?.redis?.name || 'Bộ nhớ tạm & Session'}</p>
              </div>
            </div>
            {data?.services?.redis?.status === 'ONLINE' ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Hoạt động {data?.services?.redis?.latency && `(${data.services.redis.latency})`}
              </span>
            ) : data?.services?.redis?.status === 'STANDBY' ? (
              <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" /> Chế độ chờ (Bypass)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                <AlertTriangle className="w-3 h-3" /> Mất kết nối
              </span>
            )}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded bg-blue-50 text-blue-700">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800">Transactional Outbox</h2>
                <p className="text-[11px] text-slate-500">{data?.services?.outbox?.name || 'Đồng bộ sự kiện nền'}</p>
              </div>
            </div>
            {(data?.services?.outbox?.failedCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                <AlertTriangle className="w-3 h-3" /> {data.services.outbox.failedCount} lỗi
              </span>
            ) : (data?.services?.outbox?.pendingCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                <Loader2 className="w-3 h-3 animate-spin" /> {data.services.outbox.pendingCount} đang xử lý
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Đang chạy
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs bộ lọc và ô tìm kiếm */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('LOGINS')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'LOGINS'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Nhật ký đăng nhập ({summary.recentLoginsCount || filteredLogins.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Tất cả sự kiện ({summary.totalLogs})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ERRORS')}
            className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'ERRORS'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Lỗi & Cảnh báo ({summary.errorCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Kiểm toán (Audit Log)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OUTBOX')}
            className={`rounded px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'OUTBOX'
                ? 'bg-blue-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Sự kiện nền (Outbox)
          </button>
        </div>

        <div className="relative min-w-[260px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'LOGINS'
                ? 'Tìm theo tên, email, sđt, chi nhánh...'
                : 'Tìm theo sự kiện, tác nhân, lỗi...'
            }
            className="w-full rounded border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* NỘI DUNG BẢNG: TAB NHẬT KÝ ĐĂNG NHẬP */}
      {activeTab === 'LOGINS' ? (
        <AdminTableCard>
          <AdminTable minWidth="min-w-[850px]">
            <AdminTableHead
              columns={[
                'Thời điểm đăng nhập',
                'Tài khoản / Người dùng',
                'Số điện thoại',
                'Vai trò hệ thống',
                'Cơ sở / Chi nhánh',
                'Trạng thái tài khoản',
                { label: 'Kênh truy cập', align: 'right' },
              ]}
            />
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <AdminTableLoading colSpan={7} message="Đang tải nhật ký đăng nhập…" />
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-rose-600">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                    <p className="text-xs font-semibold">{error}</p>
                  </td>
                </tr>
              ) : filteredLogins.length === 0 ? (
                <AdminTableEmpty colSpan={7} message="Không tìm thấy lịch sử đăng nhập nào phù hợp." />
              ) : (
                filteredLogins.map((item) => {
                  const roleKey = String(item.role || '').toUpperCase()
                  const roleMeta = ROLE_BADGES[roleKey] || {
                    label: item.role,
                    badge: 'bg-slate-50 text-slate-700 border-slate-200',
                  }
                  const initials = (item.fullName || item.email || 'U')
                    .split(/\s+/)
                    .slice(-2)
                    .map((x) => x[0])
                    .join('')
                    .toUpperCase()

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Thời điểm */}
                      <td className="px-3.5 sm:px-5 py-3 whitespace-nowrap text-slate-700 tabular-nums font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {item.loginAt
                              ? new Date(item.loginAt).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : 'Chưa ghi nhận'}
                          </span>
                        </div>
                      </td>

                      {/* Tài khoản / Người dùng */}
                      <td className="px-3.5 sm:px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded bg-emerald-100 text-[11px] font-bold text-emerald-800 shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {item.fullName}
                            </span>
                            {item.email && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{item.email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Số điện thoại */}
                      <td className="px-3.5 sm:px-5 py-3 text-slate-600 whitespace-nowrap tabular-nums">
                        {item.phone ? (
                          <span className="flex items-center gap-1 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Vai trò */}
                      <td className="px-3.5 sm:px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold ${roleMeta.badge}`}
                        >
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Cơ sở */}
                      <td className="px-3.5 sm:px-5 py-3 text-slate-700 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.branchName}</span>
                        </span>
                      </td>

                      {/* Trạng thái tài khoản */}
                      <td className="px-3.5 sm:px-5 py-3 whitespace-nowrap">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            <Lock className="w-3 h-3" /> Bị khóa
                          </span>
                        )}
                      </td>

                      {/* Kênh */}
                      <td className="px-3.5 sm:px-5 py-3 text-right whitespace-nowrap text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          Web Portal
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </AdminTable>
          <AdminTableFooter total={filteredLogins.length} label="lượt đăng nhập" />
        </AdminTableCard>
      ) : (
        /* NỘI DUNG BẢNG: TAB SỰ KIỆN / OUTBOX / LỖI HỆ THỐNG */
        <AdminTableCard>
          <AdminTable minWidth="min-w-[850px]">
            <AdminTableHead
              columns={[
                'Thời gian',
                'Phân loại',
                'Sự kiện / Hành động',
                'Đối tượng',
                'Tác nhân',
                'Trạng thái',
                { label: 'Chi tiết', align: 'right' },
              ]}
            />
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <AdminTableLoading colSpan={7} message="Đang tải nhật ký hệ thống…" />
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-rose-600">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                    <p className="text-xs font-semibold">{error}</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <AdminTableEmpty colSpan={7} message="Không tìm thấy sự kiện hoặc lỗi nào phù hợp với bộ lọc hiện tại." />
              ) : (
                filteredLogs.map((log) => {
                  const isError = log.status === 'ERROR' || log.status === 'FAILED' || Boolean(log.error)
                  const isAudit = log.type === 'AUDIT' || log.type === 'LOGIN'
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isError ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-3.5 sm:px-5 py-3 text-slate-600 whitespace-nowrap tabular-nums">
                        {new Date(log.createdAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3.5 sm:px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                            log.type === 'LOGIN'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : isAudit
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="px-3.5 sm:px-5 py-3">
                        <div className="font-bold text-slate-900 truncate max-w-[240px]">
                          {log.action}
                        </div>
                        {log.error && (
                          <div className="text-[11px] text-rose-600 mt-0.5 truncate max-w-[320px]">
                            Lỗi: {log.error}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 sm:px-5 py-3 text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{log.targetType}</span>
                        {log.targetId && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                            #{log.targetId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 sm:px-5 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.actorName}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                          {log.actorRole}
                        </div>
                      </td>
                      <td className="px-3.5 sm:px-5 py-3 whitespace-nowrap">
                        {isError ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            <XCircle className="w-3.5 h-3.5" /> Lỗi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 sm:px-5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </AdminTable>
          <AdminTableFooter total={filteredLogs.length} label="sự kiện nhật ký" />
        </AdminTableCard>
      )}

      {/* Modal chi tiết Log */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">Chi tiết sự kiện nhật ký</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-slate-500">Mã sự kiện:</span>
                <p className="font-bold text-slate-800 break-all">{selectedLog.id}</p>
              </div>
              <div>
                <span className="text-slate-500">Thời gian ghi nhận:</span>
                <p className="font-bold text-slate-800">
                  {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Hành động:</span>
                <p className="font-bold text-slate-800">{selectedLog.action}</p>
              </div>
              <div>
                <span className="text-slate-500">Tác nhân thực hiện:</span>
                <p className="font-bold text-slate-800">
                  {selectedLog.actorName} ({selectedLog.actorRole})
                </p>
              </div>
            </div>

            {selectedLog.error && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>Chi tiết lỗi hệ thống:</span>
                </div>
                <p className="font-mono text-[11px] break-all">{selectedLog.error}</p>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Dữ liệu Metadata / Payload:</span>
              <pre className="rounded bg-slate-900 text-slate-100 p-3 text-[11px] font-mono overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
