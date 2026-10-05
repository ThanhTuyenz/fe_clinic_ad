'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw,
  Search,
  Users,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Building2,
  Stethoscope,
  Activity,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '@/common/hooks/useAuth'
import { fetchDemandInsights, fetchAiExecutiveReport } from '@/modules/admin/services/stats'

interface AnalyticsDemandAiTabProps {
  branchFilter?: string
  branches?: any[]
}

export default function AnalyticsDemandAiTab({
  branchFilter = 'all',
  branches = [],
}: AnalyticsDemandAiTabProps) {
  const { token } = useAuth()
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days'>('30days')
  const [selectedBranch, setSelectedBranch] = useState<string>(branchFilter)

  const [metrics, setMetrics] = useState<any>(null)
  const [aiReport, setAiReport] = useState<any>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [generatingAi, setGeneratingAi] = useState(false)

  // 1. Tải số liệu thống kê (Demand Metrics)
  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true)
    try {
      const res = await fetchDemandInsights({
        token: token || undefined,
        timeFilter,
        branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
      })
      if (res) setMetrics(res)
    } catch (err) {
      console.warn('Failed to load demand metrics:', err)
    } finally {
      setLoadingMetrics(false)
    }
  }, [token, timeFilter, selectedBranch])

  // 2. Tải hoặc Làm mới Báo cáo AI Gemini
  const loadAiReport = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setGeneratingAi(true)
      try {
        const res = await fetchAiExecutiveReport({
          token: token || undefined,
          timeFilter,
          branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
          forceRefresh,
        })
        if (res) setAiReport(res)
      } catch (err) {
        console.warn('Failed to fetch AI report:', err)
      } finally {
        if (forceRefresh) setGeneratingAi(false)
      }
    },
    [token, timeFilter, selectedBranch]
  )

  useEffect(() => {
    void loadMetrics()
    void loadAiReport(false)
  }, [loadMetrics, loadAiReport])

  const kpis = metrics?.kpis || {
    totalSearches: 0,
    totalPackageViews: 0,
    totalBookings: 0,
    overallConversionRate: 0,
    topSpecialtyDemand: 'Đang tải...',
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── THANH ĐIỀU KHIỂN & NÚT GỌI AI GEMINI ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc thời gian */}
          <div className="flex items-center rounded border border-slate-200 p-0.5 bg-slate-50 text-xs">
            {(
              [
                { id: 'today', label: 'Hôm nay' },
                { id: '7days', label: '7 ngày qua' },
                { id: '30days', label: '30 ngày qua' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeFilter(t.id)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${timeFilter === t.id
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Bộ lọc chi nhánh */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded px-3 py-1.5 bg-white text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── HÀNG 1: THẺ CHỈ SỐ TỔNG QUAN (KPIS) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tìm kiếm */}
        <div className="p-4 rounded bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tìm kiếm triệu chứng</span>
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {kpis.totalSearches.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-400">Lượt tìm kiếm từ cộng đồng</p>
        </div>

        {/* KPI 2: Lượt xem gói */}
        <div className="p-4 rounded bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Lượt xem gói khám</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {kpis.totalPackageViews.toLocaleString('vi-VN')}
          </div>
          <p className="text-[11px] text-slate-400">Tổng quan tâm ban đầu</p>
        </div>

        {/* KPI 3: Tỷ lệ chuyển đổi */}
        <div className="p-4 rounded bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tỷ lệ chuyển đổi (CVR)</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 tracking-tight">
            {kpis.overallConversionRate}%
          </div>
          <p className="text-[11px] text-slate-400">
            {kpis.totalBookings} lịch khám chốt thành công
          </p>
        </div>

        {/* KPI 4: Chuyên khoa dẫn đầu */}
        <div className="p-4 rounded bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Nhu cầu cao nhất</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 truncate" title={kpis.topSpecialtyDemand}>
            {kpis.topSpecialtyDemand}
          </div>
          <p className="text-[11px] text-slate-400">Chuyên khoa có lượt khám lớn nhất</p>
        </div>
      </div>

      {/* ── HÀNG 2: BẢNG DỮ LIỆU CHI TIẾT ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bảng Top Từ khóa tìm kiếm & Cơ hội chưa đáp ứng */}
        <div className="p-5 bg-white rounded border border-slate-200/90 shadow-2xs space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Top Từ khóa tìm kiếm</span>
              </h4>
              <span className="text-[11px] text-slate-400">Tần suất</span>
            </div>

            <div className="divide-y divide-slate-100">
              {(metrics?.topSearches || []).slice(0, 5).map((s: any, idx: number) => (
                <div key={idx} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 text-center font-bold text-slate-400">{idx + 1}</span>
                    <span className="font-semibold text-slate-800 truncate">{s.query}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px] shrink-0">
                    {s.searchCount} lượt
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Phân mục: Nhu cầu chưa có gói khám đáp ứng (Market Gap) */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Nhu cầu chưa đáp ứng</span>
              </h4>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">0 kết quả</span>
            </div>

            <div className="divide-y divide-amber-50">
              {(metrics?.unmatchedSearches || []).slice(0, 4).map((s: any, idx: number) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-amber-950 truncate text-[11.5px]" title={s.query}>
                    • {s.query}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800 font-bold text-[10.5px] shrink-0">
                    {s.searchCount} lượt
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bảng Hiệu quả Đặt khám & Tỷ lệ Chưa hoàn tất */}
        <div className="lg:col-span-2 p-5 bg-white rounded border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hiệu quả Đặt khám & Tỷ lệ Chưa hoàn tất</span>
            </h4>
            <span className="text-[11px] text-slate-400">Xem gói / Đã đặt / Chưa hoàn tất</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="pb-2">Gói khám dịch vụ</th>
                  <th className="pb-2">Chuyên khoa</th>
                  <th className="pb-2 text-right">Lượt xem</th>
                  <th className="pb-2 text-right">Đã đặt</th>
                  <th className="pb-2 text-right">Tỷ lệ chuyển đổi</th>
                  <th className="pb-2 text-right">Chưa hoàn tất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(metrics?.packageFunnels || []).slice(0, 6).map((p: any) => (
                  <tr key={p.packageId} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 font-bold text-slate-900 max-w-[200px] truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="py-2.5 text-slate-500">{p.specialtyName}</td>
                    <td className="py-2.5 text-right font-semibold">{p.views}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-700">{p.bookings}</td>
                    <td className="py-2.5 text-right">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10.5px]">
                        {p.conversionRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[10.5px] ${p.dropOffRate > 85
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                          }`}
                      >
                        {p.dropOffRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── HÀNG 3: BẢNG PHÂN KHÚC NHÂN KHẨU HỌC THEO CHUYÊN KHOA ────────── */}
      <div className="p-5 bg-white rounded border border-slate-200/90 shadow-2xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Phân khúc Nhân khẩu học (Độ tuổi & Giới tính) theo Chuyên khoa</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                <th className="pb-2">Chuyên khoa</th>
                <th className="pb-2 text-center">Tổng ca</th>
                <th className="pb-2 text-center">Tỷ lệ Nam / Nữ</th>
                <th className="pb-2 text-center">Trẻ em (&lt;12)</th>
                <th className="pb-2 text-center">Vị thành niên (12-18)</th>
                <th className="pb-2 text-center">Thanh niên (19-35)</th>
                <th className="pb-2 text-center">Trung niên (36-55)</th>
                <th className="pb-2 text-center">Cao tuổi (&gt;55)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(metrics?.demographics || []).map((d: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 font-bold text-slate-900">{d.specialtyName}</td>
                  <td className="py-2.5 text-center font-bold text-emerald-800">{d.totalPatients}</td>
                  <td className="py-2.5 text-center text-slate-600 font-medium">
                    {d.maleCount} Nam / {d.femaleCount} Nữ
                  </td>
                  <td className="py-2.5 text-center text-slate-600">{d.ageGroups.under12}</td>
                  <td className="py-2.5 text-center text-slate-600">{d.ageGroups.teens12to18}</td>
                  <td className="py-2.5 text-center text-slate-600 font-semibold text-indigo-700">
                    {d.ageGroups.youngAdults19to35}
                  </td>
                  <td className="py-2.5 text-center text-slate-600">{d.ageGroups.middleAged36to55}</td>
                  <td className="py-2.5 text-center text-slate-600 font-semibold text-amber-800">
                    {d.ageGroups.elderlyOver55}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HÀNG 4: KHUNG BÁO CÁO CỐ VẤN CHIẾN LƯỢC TỪ AI GEMINI ───────── */}
      <div className="bg-white rounded border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header Báo Cáo AI */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Báo cáo Cố vấn Chiến lược Y tế & Nhu cầu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động tổng hợp từ Telemetry tìm kiếm, Phễu chuyển đổi và Hồ sơ bệnh án
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {aiReport?.generatedAt && (
              <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                Cập nhật: {new Date(aiReport.generatedAt).toLocaleTimeString('vi-VN')} {new Date(aiReport.generatedAt).toLocaleDateString('vi-VN')}
              </span>
            )}
            <button
              type="button"
              disabled={generatingAi}
              onClick={() => loadAiReport(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              <span>{generatingAi ? 'Đang phân tích dữ liệu...' : 'Phân tích dữ liệu'}</span>
            </button>
          </div>
        </div>

        {/* Nội dung Phân tích AI */}
        <div className="p-5 space-y-5">
          {/* Đánh giá tổng quan */}
          <div className="p-3.5 rounded bg-emerald-50/60 border border-emerald-200/70 text-xs text-slate-800 leading-relaxed">
            <strong className="font-bold text-emerald-800">Đánh giá tổng quan: </strong>
            <span>{aiReport?.overview || 'Đang cập nhật phân tích từ mô hình AI...'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Xu hướng dịch tễ & triệu chứng */}
            <div className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                <span>Xu hướng & Triệu chứng nổi bật</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc leading-relaxed">
                {(aiReport?.epidemiologicalTrends || []).map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 2. Điểm nghẽn chuyển đổi (Drop-off) */}
            <div className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Khả năng chuyển đổi</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc leading-relaxed">
                {(aiReport?.conversionBottlenecks || []).map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 3. Chân dung nhân khẩu học */}
            <div className="p-4 rounded border border-slate-200 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wide">
                <Users className="w-4 h-4 text-indigo-700" />
                <span>Phân nhóm bệnh nhân</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc leading-relaxed">
                {(aiReport?.demographicInsights || []).map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 4. Nhu cầu chưa được đáp ứng (Market Gap) */}
            <div className="p-4 rounded border border-amber-200 bg-amber-50/40 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Nhu cầu chưa đáp ứng</span>
              </div>
              <ul className="text-xs text-amber-950 space-y-1.5 pl-4 list-disc leading-relaxed font-medium">
                {(aiReport?.unmetDemandInsights || [
                  'Theo dõi các từ khóa người dùng tìm kiếm nhưng chưa có gói khám để phát triển dịch vụ mới.',
                ]).map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 5. Đề xuất hành động chiến lược */}
            <div className="md:col-span-2 p-4 rounded border border-emerald-200 bg-emerald-50/30 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                <Lightbulb className="w-4 h-4 text-emerald-700" />
                <span>Đề xuất hành động</span>
              </div>
              <ul className="text-xs text-slate-800 space-y-1.5 pl-4 list-disc leading-relaxed">
                {(aiReport?.strategicRecommendations || []).map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
