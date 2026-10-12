'use client'

import React, { useEffect, useState } from 'react'
import {
  Building2,
  Users,
  Shield,
  SlidersHorizontal,
  Server,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Loader2,
  Cpu,
  Database,
  Layers,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import { apiClient, unwrapApiData } from '@/lib/api-client'

export default function SystemAdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [logsRes, branchesRes] = await Promise.allSettled([
          apiClient.get('/stats/system-logs'),
          apiClient.get('/admin/catalog/branches'),
        ])
        if (logsRes.status === 'fulfilled') {
          setData(unwrapApiData(logsRes.value.data))
        }
        if (branchesRes.status === 'fulfilled') {
          const resData = branchesRes.value.data
          const bList = Array.isArray(resData)
            ? resData
            : Array.isArray(resData?.items)
            ? resData.items
            : Array.isArray(resData?.data?.items)
            ? resData.data.items
            : Array.isArray(resData?.data)
            ? resData.data
            : []
          setBranches(bList)
        }
      } catch (err) {
        console.error('Failed to load system dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const branchList = Array.isArray(branches) ? branches : []
  const summary = data?.summary || {
    branchesCount: branchList.length,
    managersCount: 0,
    doctorsCount: 0,
    staffCount: 0,
    bookingMethodsCount: 0,
    errorCount: 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              <Server className="w-3.5 h-3.5 text-emerald-700" /> Quản trị hệ thống
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              Toàn hệ thống
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Tổng quan hệ thống phòng khám
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát quy mô chi nhánh, tài khoản điều hành và tình trạng dịch vụ kỹ thuật VitaCare Clinic.
          </p>
        </div>
      </div>

      {/* KPI Cards: Hệ thống & Hạ tầng */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Thẻ 1: Chi nhánh */}
        <div className="rounded border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cơ sở & Chi nhánh</span>
            <div className="grid h-8 w-8 place-items-center rounded bg-emerald-50 text-emerald-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? '—' : `${summary.branchesCount || branches.length} cơ sở`}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Đang tiếp nhận và vận hành</span>
          </p>
        </div>

        {/* Thẻ 2: Quản lý chi nhánh */}
        <div className="rounded border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Quản lý chi nhánh</span>
            <div className="grid h-8 w-8 place-items-center rounded bg-blue-50 text-blue-700">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? '—' : `${summary.managersCount} tài khoản`}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>Phụ trách điều hành cơ sở</span>
          </p>
        </div>

        {/* Thẻ 3: Đội ngũ Bác sĩ & Nhân viên */}
        <div className="rounded border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bác sĩ & Nhân sự</span>
            <div className="grid h-8 w-8 place-items-center rounded bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? '—' : `${summary.doctorsCount + summary.staffCount} nhân sự`}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {summary.doctorsCount} Bác sĩ · {summary.staffCount} Lễ tân / Điều dưỡng
          </p>
        </div>

        {/* Thẻ 4: Hình thức đặt khám */}
        <div className="rounded border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hình thức đặt khám</span>
            <div className="grid h-8 w-8 place-items-center rounded bg-purple-50 text-purple-700">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? '—' : `${summary.bookingMethodsCount} phương thức`}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            <span>Kênh tiếp nhận toàn hệ thống</span>
          </p>
        </div>
      </div>

      {/* Grid: Danh sách chi nhánh & Lối tắt quản trị & Trạng thái dịch vụ kỹ thuật */}
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] items-start">
        {/* Cột trái: Danh sách chi nhánh cơ sở + Trạng thái hạ tầng kỹ thuật */}
        <div className="space-y-6">
          {/* Card: Cơ sở & Chi nhánh phòng khám */}
          <div className="rounded border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Cơ sở & Chi nhánh phòng khám
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/branches')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                <span className="text-xs">Đang tải danh sách chi nhánh...</span>
              </div>
            ) : branchList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa có chi nhánh nào trong hệ thống.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {branchList.slice(0, 5).map((b) => (
                  <div key={b.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {b.code || 'BRC'}
                          </span>
                          <h3 className="font-bold text-slate-900 text-xs truncate">{b.name}</h3>
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{b.address || 'Chưa cập nhật địa chỉ'}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                          {b.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{b.phoneNumber}</span>
                            </span>
                          )}
                          {b.operatingHours && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{b.operatingHours}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Trạng thái hạ tầng kỹ thuật */}
          <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-700" />
                Tình trạng Hạ tầng Kỹ thuật
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">Thời gian thực</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-2 text-slate-600">
                  <Database className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{data?.services?.database?.name || 'PostgreSQL (Prisma ORM)'}</span>
                </span>
                {loading ? (
                  <span className="text-slate-400 text-[11px]">—</span>
                ) : data?.services?.database?.status === 'ONLINE' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Trực tuyến
                    {data?.services?.database?.latency && (
                      <span className="text-[10px] font-normal text-slate-500">
                        ({data.services.database.latency})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Mất kết nối
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-2 text-slate-600">
                  <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{data?.services?.redis?.name || 'Redis Cache & Pub/Sub'}</span>
                </span>
                {loading ? (
                  <span className="text-slate-400 text-[11px]">—</span>
                ) : data?.services?.redis?.status === 'ONLINE' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                    {data?.services?.redis?.latency && (
                      <span className="text-[10px] font-normal text-slate-500">
                        ({data.services.redis.latency})
                      </span>
                    )}
                  </span>
                ) : data?.services?.redis?.status === 'STANDBY' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Chế độ chờ (Bypass)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> Mất kết nối
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2 text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-blue-700" />
                  <span>{data?.services?.outbox?.name || 'Transactional Outbox Worker'}</span>
                </span>
                {loading ? (
                  <span className="text-slate-400 text-[11px]">—</span>
                ) : (data?.services?.outbox?.failedCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5" /> {data.services.outbox.failedCount} lỗi
                  </span>
                ) : (data?.services?.outbox?.pendingCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-blue-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {data.services.outbox.pendingCount} việc chờ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đang chạy
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Lối tắt quản trị hệ thống */}
        <div className="space-y-6">
          <div className="rounded border border-slate-200 bg-white p-4 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              Lối tắt Quản trị Hệ thống
            </h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/branches')}
                className="w-full flex items-center justify-between rounded border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 p-2.5 text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded bg-emerald-100 text-emerald-800">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Chi nhánh & Cơ sở</span>
                    <span className="text-[10px] text-slate-500">Thêm mới, chỉnh sửa thông tin phòng khám</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/staff')}
                className="w-full flex items-center justify-between rounded border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 p-2.5 text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded bg-blue-100 text-blue-800">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Tài khoản & Nhân sự</span>
                    <span className="text-[10px] text-slate-500">Cấp tài khoản Quản lý chi nhánh, Bác sĩ</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/roles-permissions')}
                className="w-full flex items-center justify-between rounded border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 p-2.5 text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded bg-purple-100 text-purple-800">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Vai trò & Phân quyền</span>
                    <span className="text-[10px] text-slate-500">Cấu hình ma trận phân quyền RBAC</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/booking-methods')}
                className="w-full flex items-center justify-between rounded border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 p-2.5 text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded bg-amber-100 text-amber-800">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Hình thức đặt khám</span>
                    <span className="text-[10px] text-slate-500">Cấu hình các kênh tiếp nhận bệnh nhân</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/system-logs')}
                className="w-full flex items-center justify-between rounded border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 p-2.5 text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded bg-rose-100 text-rose-800">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Nhật ký & Lỗi hệ thống</span>
                    <span className="text-[10px] text-slate-500">Xem Audit Log và sự cố kỹ thuật</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
