'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Building2, Users, Shield, SlidersHorizontal, Server, ArrowRight, UserCheck, Clock, Phone, MapPin, Cpu, Database, Layers, AlertTriangle, RefreshCw, LockKeyhole } from 'lucide-react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { apiClient, unwrapApiData } from '@/lib/api-client'

type DashboardData = {
  checkedAt: string
  summary: {
    branchesCount: number; managersCount: number; chainManagersCount: number
    doctorsCount: number; staffCount: number; lockedAccountsCount: number; errorCount24h: number
  }
  services: Record<'database' | 'redis' | 'outbox', {
    name: string; status: string; latency?: string; pendingCount?: number; failedCount?: number
  }>
  recentWarnings: { id: string; eventType: string; status: string; attempts: number; createdAt: string }[]
}
type Branch = { id: string; code: string; name: string; address?: string; phoneNumber?: string; operatingHours?: string; isActive: boolean }
const formatTime = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa cập nhật'
const panel = 'min-w-0 rounded border border-slate-200 bg-white'
const heading = 'flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-800'

export default function SystemAdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [branchesLoaded, setBranchesLoaded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const messages: string[] = []
    const [logsRes, branchesRes] = await Promise.allSettled([
      apiClient.get('/stats/system-logs'),
      apiClient.get('/admin/catalog/branches'),
    ])
    if (logsRes.status === 'fulfilled') setData(unwrapApiData(logsRes.value.data))
    else messages.push('Không tải được dữ liệu giám sát hệ thống.')
    if (branchesRes.status === 'fulfilled') {
      const result = unwrapApiData(branchesRes.value.data)
      setBranches(Array.isArray(result) ? result : result?.items ?? [])
      setBranchesLoaded(true)
    } else messages.push('Không tải được danh sách chi nhánh.')
    setErrors(messages)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])
  const summary = data?.summary
  const count = (value?: number) => value == null ? '—' : value
  const outbox = data?.services?.outbox
  const shortcuts = [
    { path: '/staff', title: 'Tài khoản & Nhân sự', description: 'Tài khoản toàn chuỗi và chi nhánh', icon: UserCheck, color: 'bg-blue-50 text-blue-700' },
    { path: '/roles-permissions', title: 'Vai trò & Phân quyền', description: 'Ma trận phân quyền truy cập', icon: Shield, color: 'bg-violet-50 text-violet-700' },
    { path: '/system-logs', title: 'Nhật ký & Lỗi hệ thống', description: 'Nhật ký truy cập và sự kiện hệ thống', icon: Server, color: 'bg-rose-50 text-rose-700' },
    { path: '/integrations', title: 'Cấu hình tích hợp', description: 'Thanh toán, Email, SMS và Push', icon: SlidersHorizontal, color: 'bg-amber-50 text-amber-700' },
  ]
  const metrics = [
    { title: 'Chi nhánh hoạt động', value: summary ? `${summary.branchesCount} cơ sở` : '—', detail: 'Cơ sở đang được kích hoạt', icon: Building2, color: 'bg-blue-50 text-blue-700' },
    { title: 'Tài khoản quản lý', value: summary ? `${summary.managersCount + summary.chainManagersCount} tài khoản` : '—', detail: summary ? `${summary.chainManagersCount} Toàn chuỗi · ${summary.managersCount} Chi nhánh` : 'Chưa có dữ liệu', icon: UserCheck, color: 'bg-violet-50 text-violet-700' },
    { title: 'Bác sĩ & Nhân sự', value: summary ? `${summary.doctorsCount + summary.staffCount} nhân sự` : '—', detail: summary ? `${summary.doctorsCount} Bác sĩ · ${summary.staffCount} Lễ tân` : 'Chưa có dữ liệu', icon: Users, color: 'bg-slate-100 text-slate-700' },
    { title: 'Sự kiện lỗi / cảnh báo', value: summary ? `${summary.errorCount24h} sự kiện` : '—', detail: 'Outbox tạo trong 24 giờ qua, còn lỗi', icon: AlertTriangle, color: 'bg-rose-50 text-rose-700' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600"><Server className="h-3.5 w-3.5" />Quản trị hệ thống · Toàn hệ thống</span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống phòng khám</h1>
          <p className="mt-1 text-xs text-slate-500">Giám sát tài khoản, chi nhánh và các dịch vụ kỹ thuật VitaCare Clinic.</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </button>
          <span className="text-[10px] text-slate-500">Cập nhật: {formatTime(data?.checkedAt)}</span>
        </div>
      </div>

      {errors.length > 0 && <div role="alert" className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{errors.join(' ')} {data && 'Dữ liệu giám sát đang giữ lần tải thành công gần nhất.'}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ title, value, detail, icon: Icon, color }) => (
          <div key={title} className={`${panel} p-4`}>
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">{title}</span><span className={`grid h-8 w-8 shrink-0 place-items-center rounded ${color}`}><Icon className="h-4 w-4" /></span></div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
            <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <section className={`${panel} overflow-hidden`}>
            <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3"><h2 className={heading}><Building2 className="h-4 w-4 text-blue-600" />Cơ sở & Chi nhánh</h2></div>
            {!branchesLoaded ? <p className="p-6 text-center text-xs text-slate-500">{loading ? 'Đang tải chi nhánh...' : 'Chưa tải được dữ liệu chi nhánh.'}</p> : branches.length === 0 ? <p className="p-6 text-center text-xs text-slate-500">Chưa có chi nhánh.</p> :
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {branches.map(b => <div key={b.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2"><span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{b.code || 'BRC'}</span><h3 className="break-words text-xs font-bold text-slate-900">{b.name}</h3></div>
                    <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${b.isActive ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{b.isActive ? 'Hoạt động' : 'Tạm ngừng'}</span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0" />{b.address || 'Chưa cập nhật địa chỉ'}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    {b.phoneNumber && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.phoneNumber}</span>}
                    {b.operatingHours && <span className="flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" />{b.operatingHours}</span>}
                  </div>
                </div>)}
              </div>}
          </section>

          <section className={`${panel} p-4`}>
            <h2 className={heading}><Server className="h-4 w-4 text-slate-600" />Tình trạng hạ tầng kỹ thuật</h2>
            <div className="mt-3 divide-y divide-slate-100 text-xs">
              {(['database', 'redis'] as const).map(key => {
                const service = data?.services?.[key]
                const Icon = key === 'database' ? Database : Cpu
                const online = service?.status === 'ONLINE'
                const label = !service ? 'Chưa có dữ liệu' : online ? 'Trực tuyến' : service.status === 'STANDBY' ? 'Đã tắt / Bypass' : service.status === 'DEGRADED' ? 'Suy giảm' : 'Mất kết nối'
                return <div key={key} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><span className="flex items-center gap-2 text-slate-600"><Icon className="h-3.5 w-3.5 shrink-0 text-blue-600" />{service?.name || (key === 'database' ? 'PostgreSQL (Prisma ORM)' : 'Redis Cache & Pub/Sub')}</span><span className={`text-[11px] font-semibold ${online ? 'text-blue-700' : !service || service.status === 'STANDBY' ? 'text-slate-500' : 'text-rose-600'}`}>{label}{online && service?.latency ? ` (${service.latency})` : ''}</span></div>
              })}
              <div className="flex flex-wrap items-center justify-between gap-2 py-2.5"><span className="flex items-center gap-2 text-slate-600"><Layers className="h-3.5 w-3.5 text-violet-600" />Hàng đợi sự kiện (Outbox)</span><span className="text-[11px] font-semibold text-slate-700">{outbox ? `${outbox.pendingCount} chờ · ${outbox.failedCount} thất bại` : 'Chưa có dữ liệu'}</span></div>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Trạng thái tại lần cập nhật gần nhất. Số lượng Outbox không xác nhận worker đang chạy.</p>
          </section>

          <section className={`${panel} overflow-hidden`}>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3"><h2 className={heading}><AlertTriangle className="h-4 w-4 text-amber-600" />Cảnh báo gần đây</h2><button type="button" onClick={() => navigate('/system-logs')} className="shrink-0 text-[11px] font-semibold text-blue-700 hover:underline">Xem nhật ký</button></div>
            {!data ? <p className="p-4 text-xs text-slate-500">Chưa có dữ liệu cảnh báo.</p> : !data.recentWarnings?.length ? <p className="p-4 text-xs text-slate-500">Không có sự kiện Outbox đang lỗi hoặc chờ thử lại.</p> :
              <div className="divide-y divide-slate-100">{data.recentWarnings.map(w => <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0"><p className="break-all text-xs font-semibold text-slate-800">{w.eventType}</p><p className="mt-1 text-[10px] text-slate-500">{formatTime(w.createdAt)} · {w.attempts} lần thử</p></div>
                <span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">{w.status === 'FAILED' ? 'Thất bại' : 'Chờ thử lại'}</span>
              </div>)}</div>}
          </section>
        </div>

        <div className="min-w-0 space-y-4">
          <section className={`${panel} p-4`}>
            <h2 className={heading}><Shield className="h-4 w-4 text-violet-600" />Lối tắt quản trị hệ thống</h2>
            <div className="mt-3 space-y-2">{shortcuts.map(({ path, title, description, icon: Icon, color }) => <button type="button" key={path} onClick={() => navigate(path)} className="flex w-full items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50/50 p-2.5 text-left hover:bg-slate-100">
              <div className="flex min-w-0 items-center gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded ${color}`}><Icon className="h-4 w-4" /></span><div><span className="block text-xs font-bold text-slate-800">{title}</span><span className="text-[10px] text-slate-500">{description}</span></div></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>)}</div>
          </section>
          <section className={`${panel} p-4`}>
            <h2 className={heading}><LockKeyhole className="h-4 w-4 text-amber-600" />Tài khoản & Bảo mật</h2>
            <div className="mt-3 flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-2.5"><span className="text-xs text-slate-600">Tài khoản đang bị khóa</span><span className="text-lg font-bold text-slate-900">{count(summary?.lockedAccountsCount)}</span></div>
            <p className="mt-2 text-[10px] text-slate-500">Toàn hệ thống, không gồm tài khoản đã xóa.</p>
            <button type="button" onClick={() => navigate('/staff')} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">Quản lý tài khoản<ArrowRight className="h-3.5 w-3.5" /></button>
          </section>
        </div>
      </div>
    </div>
  )
}
