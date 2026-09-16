'use client'

import React, { useMemo, useState } from 'react'

interface AdminAnalyticsPageProps {
  stats?: any
  loading?: boolean
}

type TabType = 'revenue_timeline' | 'revenue_sources' | 'operations' | 'doctors' | 'ai'

export default function AdminAnalyticsPage({ stats, loading }: AdminAnalyticsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('revenue_timeline')
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'quarter'>('month')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('2026-08-01')
  const [endDate, setEndDate] = useState<string>('2026-08-31')
  const [doctorMetric, setDoctorMetric] = useState<'revenue' | 'appointments'>('revenue')
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  const handleExport = (format: string) => {
    setExportNotice(`Đang xuất file báo cáo ${format}... Vui lòng đợi trong giây lát.`)
    setTimeout(() => {
      setExportNotice(`Xuất báo cáo ${format} thành công! File đã sẵn sàng tải xuống.`)
      setTimeout(() => setExportNotice(null), 3000)
    }, 1200)
  }

  // Dữ liệu tài chính theo bộ lọc thời gian
  const data = useMemo(() => {
    if (timeFilter === 'today') {
      return {
        revenue: '14.850.000 đ',
        revenueGrowth: '+8.4% so với hôm qua',
        dailyAvg: '14.850.000 đ',
        avgPerPatient: '436.000 đ',
        appointments: '34 ca',
        completionRate: '91.2%',
        noShowRate: '3.8%',
        cancelRate: '5.0%',
        newPatientsPct: 58,
        returnPatientsPct: 42,
        chartCeiling: 6,
        guides: ['6.0', '4.5', '3.0', '1.5'],
        chartLabel: 'Doanh thu theo khung giờ trong ngày (Triệu VNĐ)',
        bars: [
          { label: '07h-09h', rev: 2.5, count: 6 },
          { label: '09h-11h', rev: 4.8, count: 12 },
          { label: '11h-13h', rev: 1.4, count: 3 },
          { label: '13h-15h', rev: 3.2, count: 7 },
          { label: '15h-17h', rev: 2.1, count: 4 },
          { label: '17h-19h', rev: 0.85, count: 2 },
        ],
        payments: [
          { name: 'Chuyển khoản / VietQR', pct: 64, amount: '9.500.000 đ' },
          { name: 'Ví MoMo', pct: 18, amount: '2.670.000 đ' },
          { name: 'Thẻ POS', pct: 10, amount: '1.485.000 đ' },
          { name: 'Tiền mặt tại quầy', pct: 8, amount: '1.195.000 đ' },
        ],
      }
    }

    if (timeFilter === 'week') {
      return {
        revenue: '154.200.000 đ',
        revenueGrowth: '+14.2% so với tuần trước',
        dailyAvg: '22.028.000 đ',
        avgPerPatient: '433.000 đ',
        appointments: '356 ca',
        completionRate: '88.5%',
        noShowRate: '5.2%',
        cancelRate: '6.3%',
        newPatientsPct: 62,
        returnPatientsPct: 38,
        chartCeiling: 32,
        guides: ['32', '24', '16', '8'],
        chartLabel: 'Doanh thu 7 ngày gần nhất (Triệu VNĐ)',
        bars: [
          { label: 'T2', rev: 23.5, count: 54 },
          { label: 'T3', rev: 26.2, count: 61 },
          { label: 'T4', rev: 22.0, count: 50 },
          { label: 'T5', rev: 29.8, count: 68 },
          { label: 'T6', rev: 27.5, count: 63 },
          { label: 'T7', rev: 18.2, count: 42 },
          { label: 'CN', rev: 7.0, count: 18 },
        ],
        payments: [
          { name: 'Chuyển khoản / VietQR', pct: 62, amount: '95.600.000 đ' },
          { name: 'Ví MoMo', pct: 19, amount: '29.300.000 đ' },
          { name: 'Thẻ POS', pct: 11, amount: '17.000.000 đ' },
          { name: 'Tiền mặt tại quầy', pct: 8, amount: '12.300.000 đ' },
        ],
      }
    }

    if (timeFilter === 'quarter') {
      return {
        revenue: '1.860.500.000 đ',
        revenueGrowth: '+22.4% so với quý trước',
        dailyAvg: '20.672.000 đ',
        avgPerPatient: '435.000 đ',
        appointments: '4,280 ca',
        completionRate: '89.4%',
        noShowRate: '4.9%',
        cancelRate: '5.7%',
        newPatientsPct: 66,
        returnPatientsPct: 34,
        chartCeiling: 700,
        guides: ['700', '525', '350', '175'],
        chartLabel: 'Doanh thu theo các tháng trong quý (Triệu VNĐ)',
        bars: [
          { label: 'Tháng 1', rev: 590.2, count: 1380 },
          { label: 'Tháng 2', rev: 612.5, count: 1420 },
          { label: 'Tháng 3', rev: 657.8, count: 1480 },
        ],
        payments: [
          { name: 'Chuyển khoản / VietQR', pct: 65, amount: '1.209.325.000 đ' },
          { name: 'Ví MoMo', pct: 18, amount: '334.890.000 đ' },
          { name: 'Thẻ POS', pct: 10, amount: '186.050.000 đ' },
          { name: 'Tiền mặt tại quầy', pct: 7, amount: '130.235.000 đ' },
        ],
      }
    }

    // Default: 'month'
    return {
      revenue: '612.450.000 đ',
      revenueGrowth: '+16.8% so với tháng trước',
      dailyAvg: '20.415.000 đ',
      avgPerPatient: '431.000 đ',
      appointments: '1,420 ca',
      completionRate: '88.0%',
      noShowRate: '5.8%',
      cancelRate: '6.2%',
      newPatientsPct: 64,
      returnPatientsPct: 36,
      chartCeiling: 200,
      guides: ['200', '150', '100', '50'],
      chartLabel: 'Doanh thu theo 4 tuần trong tháng (Triệu VNĐ)',
      bars: [
        { label: 'Tuần 1', rev: 142.5, count: 330 },
        { label: 'Tuần 2', rev: 156.0, count: 365 },
        { label: 'Tuần 3', rev: 148.2, count: 345 },
        { label: 'Tuần 4', rev: 165.75, count: 380 },
      ],
      payments: [
        { name: 'Chuyển khoản / VietQR', pct: 63, amount: '385.843.000 đ' },
        { name: 'Ví MoMo', pct: 18, amount: '110.241.000 đ' },
        { name: 'Thẻ POS', pct: 11, amount: '67.369.000 đ' },
        { name: 'Tiền mặt tại quầy', pct: 8, amount: '48.997.000 đ' },
      ],
    }
  }, [timeFilter])

  // Dữ liệu Nguồn thu theo Chuyên khoa & Gói khám
  const revenueSources = [
    {
      id: 'pkg',
      name: 'Gói khám sức khỏe tổng quát định kỳ',
      category: 'Gói khám bệnh',
      revNum: 196.2,
      rev: '196.200.000 đ',
      appts: 392,
      avgTicket: '500.000 đ',
      pct: 32,
      color: '#059669', // Emerald
      growth: '+21.5%',
    },
    {
      id: 'eye',
      name: 'Khoa Mắt & Đo khúc xạ chuyên sâu',
      category: 'Chuyên khoa',
      revNum: 128.5,
      rev: '128.500.000 đ',
      appts: 310,
      avgTicket: '414.000 đ',
      pct: 21,
      color: '#2563eb', // Blue
      growth: '+14.8%',
    },
    {
      id: 'cardio',
      name: 'Khoa Tim mạch & Nội tiết chuyển hóa',
      category: 'Chuyên khoa',
      revNum: 98.0,
      rev: '98.000.000 đ',
      appts: 228,
      avgTicket: '430.000 đ',
      pct: 16,
      color: '#d97706', // Amber
      growth: '+11.2%',
    },
    {
      id: 'derma',
      name: 'Khoa Da liễu & Thẩm mỹ y khoa',
      category: 'Chuyên khoa',
      revNum: 79.6,
      rev: '79.600.000 đ',
      appts: 194,
      avgTicket: '410.000 đ',
      pct: 13,
      color: '#0891b2', // Cyan
      growth: '+9.4%',
    },
    {
      id: 'ped',
      name: 'Khoa Nhi & Dinh dưỡng phát triển',
      category: 'Chuyên khoa',
      revNum: 61.25,
      rev: '61.250.000 đ',
      appts: 168,
      avgTicket: '364.000 đ',
      pct: 10,
      color: '#4f46e5', // Indigo
      growth: '+6.2%',
    },
    {
      id: 'ent',
      name: 'Khoa Tai Mũi Họng & Hô hấp',
      category: 'Chuyên khoa',
      revNum: 48.9,
      rev: '48.900.000 đ',
      appts: 128,
      avgTicket: '382.000 đ',
      pct: 8,
      color: '#64748b', // Slate
      growth: '+5.0%',
    },
  ]

  // Ma trận giờ cao điểm (Peak Hours Heatmap)
  const heatmapDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']
  const heatmapSlots = [
    '07:00 – 09:00',
    '09:00 – 11:00',
    '11:00 – 13:00',
    '13:00 – 15:00',
    '15:00 – 17:00',
    '17:00 – 19:00',
    '19:00 – 21:00',
  ]
  const heatmapMatrix = [
    [18, 22, 19, 21, 24, 28, 14],
    [32, 35, 30, 36, 38, 42, 22],
    [10, 12, 11, 14, 15, 18, 9],
    [24, 26, 23, 27, 29, 31, 16],
    [28, 30, 26, 31, 34, 26, 12],
    [19, 21, 18, 22, 25, 15, 8],
    [11, 12, 9, 14, 16, 8, 4],
  ]

  // Ma trận phối màu chuẩn theo thiết kế biểu đồ nhiệt (Image 2)
  // Phân cấp trực quan 5 mức độ:
  // 1. Cyan (Rất vắng / Thấp): bg-[#a5f3fc] text-slate-800
  // 2. Mint Green (Vắng / Ổn định): bg-[#bbf7d0] text-slate-800
  // 3. Soft Yellow (Bình thường / Vừa phải): bg-[#fef08a] text-slate-800
  // 4. Peach Orange (Đông / Cao điểm): bg-[#fed7aa] text-slate-900
  // 5. Coral Red (Rất đông / Đỉnh điểm): bg-[#fca5a5] text-slate-950 font-bold
  const heatmapColorMatrix: string[][] = [
    ['green', 'green', 'green', 'yellow', 'yellow', 'orange', 'cyan'], // 07:00 – 09:00: [18, 22, 19, 21, 24, 28, 14]
    ['yellow', 'orange', 'yellow', 'coral', 'coral', 'coral', 'green'], // 09:00 – 11:00: [32, 35, 30, 36, 38, 42, 22]
    ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'yellow', 'cyan'], // 11:00 – 13:00: [10, 12, 11, 14, 15, 18, 9]
    ['green', 'orange', 'green', 'green', 'yellow', 'orange', 'yellow'], // 13:00 – 15:00: [24, 26, 23, 27, 29, 31, 16]
    ['orange', 'orange', 'yellow', 'orange', 'orange', 'yellow', 'cyan'], // 15:00 – 17:00: [28, 30, 26, 31, 34, 26, 12]
    ['green', 'yellow', 'yellow', 'yellow', 'yellow', 'cyan', 'cyan'], // 17:00 – 19:00: [19, 21, 18, 22, 25, 15, 8]
    ['cyan', 'cyan', 'cyan', 'cyan', 'yellow', 'cyan', 'cyan'], // 19:00 – 21:00: [11, 12, 9, 14, 16, 8, 4]
  ]

  const getHeatmapClass = (count: number, sIdx?: number, dIdx?: number) => {
    // Nếu có vị trí trong ma trận mẫu chuẩn, ưu tiên lấy theo ma trận để khớp 100% ảnh 2
    if (sIdx !== undefined && dIdx !== undefined && heatmapColorMatrix[sIdx]?.[dIdx]) {
      const tone = heatmapColorMatrix[sIdx][dIdx]
      if (tone === 'coral') return 'bg-[#fca5a5] text-slate-900 font-bold hover:bg-[#f87171]/90 shadow-2xs'
      if (tone === 'orange') return 'bg-[#fed7aa] text-slate-900 font-semibold hover:bg-[#fdba74] shadow-2xs'
      if (tone === 'yellow') return 'bg-[#fef08a] text-slate-800 font-medium hover:bg-[#fde047] shadow-2xs'
      if (tone === 'green') return 'bg-[#bbf7d0] text-slate-800 font-medium hover:bg-[#86efac] shadow-2xs'
      return 'bg-[#a5f3fc] text-slate-800 font-medium hover:bg-[#67e8f9] shadow-2xs'
    }

    // Công thức tính cho dữ liệu động
    if (count >= 36) return 'bg-[#fca5a5] text-slate-900 font-bold hover:bg-[#f87171]/90 shadow-2xs'
    if (count >= 28) return 'bg-[#fed7aa] text-slate-900 font-semibold hover:bg-[#fdba74] shadow-2xs'
    if (count >= 20) return 'bg-[#fef08a] text-slate-800 font-medium hover:bg-[#fde047] shadow-2xs'
    if (count >= 15) return 'bg-[#bbf7d0] text-slate-800 font-medium hover:bg-[#86efac] shadow-2xs'
    return 'bg-[#a5f3fc] text-slate-800 font-medium hover:bg-[#67e8f9] shadow-2xs'
  }

  // Danh sách bác sĩ
  const doctorsPerformance = [
    {
      name: 'BS. CKII Nguyễn Minh Tâm',
      specialty: 'Khoa Tim mạch',
      appts: 184,
      examRev: '55.200.000 đ',
      subclinicalRev: '78.500.000 đ',
      totalRev: '133.700.000 đ',
      satisfaction: '98.5%',
    },
    {
      name: 'ThS. BS Trần Bích Ngọc',
      specialty: 'Khoa Mắt',
      appts: 215,
      examRev: '64.500.000 đ',
      subclinicalRev: '52.800.000 đ',
      totalRev: '117.300.000 đ',
      satisfaction: '99.1%',
    },
    {
      name: 'BS. CKI Lê Hoàng Nam',
      specialty: 'Khoa Da liễu',
      appts: 162,
      examRev: '48.600.000 đ',
      subclinicalRev: '42.100.000 đ',
      totalRev: '90.700.000 đ',
      satisfaction: '97.8%',
    },
    {
      name: 'BS. Đỗ Thị Thu Trang',
      specialty: 'Khoa Nhi',
      appts: 178,
      examRev: '44.500.000 đ',
      subclinicalRev: '32.400.000 đ',
      totalRev: '76.900.000 đ',
      satisfaction: '99.4%',
    },
    {
      name: 'ThS. BS Phạm Văn Khôi',
      specialty: 'Khoa Tai Mũi Họng',
      appts: 145,
      examRev: '36.250.000 đ',
      subclinicalRev: '28.900.000 đ',
      totalRev: '65.150.000 đ',
      satisfaction: '96.9%',
    },
  ]

  // Gợi ý AI
  const aiFunnel = {
    impressions: 2840,
    clicks: 980,
    ctr: '34.5%',
    conversions: 345,
    conversionRate: '12.1%',
    revenueGenerated: '112.800.000 đ',
  }

  const aiTopRecommendedPackages = [
    {
      name: 'Gói Tầm soát Tim mạch & Huyết áp nâng cao',
      specialty: 'Khoa Tim mạch',
      suggestedCount: 684,
      bookedCount: 142,
      conversionPct: 20.8,
      trend: 'Tăng do bệnh nhân có triệu chứng đau ngực, khó thở',
    },
    {
      name: 'Gói Khám Sức khỏe Tổng quát Tiêu chuẩn',
      specialty: 'Đa khoa',
      suggestedCount: 520,
      bookedCount: 98,
      conversionPct: 18.8,
      trend: 'Nhu cầu kiểm tra sức khỏe định kỳ mùa giao mùa',
    },
    {
      name: 'Gói Tầm soát Đái tháo đường & Chuyển hóa',
      specialty: 'Khoa Nội tiết',
      suggestedCount: 395,
      bookedCount: 62,
      conversionPct: 15.7,
      trend: 'Người dùng có triệu chứng mệt mỏi, sụt cân',
    },
    {
      name: 'Gói Khám Nhi khoa & Dinh dưỡng Toàn diện',
      specialty: 'Khoa Nhi',
      suggestedCount: 310,
      bookedCount: 45,
      conversionPct: 14.5,
      trend: 'Trẻ biếng ăn và cần lịch tiêm chủng định kỳ',
    },
    {
      name: 'Gói Khám Da liễu & Chăm sóc Y khoa',
      specialty: 'Khoa Da liễu',
      suggestedCount: 220,
      bookedCount: 28,
      conversionPct: 12.7,
      trend: 'Bệnh lý viêm da tiếp xúc và dị ứng thời tiết',
    },
  ]

  const TABS = [
    { id: 'revenue_timeline' as TabType, label: 'Doanh thu theo thời gian' },
    { id: 'revenue_sources' as TabType, label: 'Nguồn thu Chuyên khoa & Gói khám' },
    { id: 'operations' as TabType, label: 'Lượt khám & Vận hành' },
    { id: 'doctors' as TabType, label: 'Hiệu suất Bác sĩ' },
    { id: 'ai' as TabType, label: 'Hiệu quả Gợi ý AI' },
  ]

  return (
    <div className="space-y-4">
      {/* Header thanh lịch, chuẩn tiếp đón y tế (nhẹ nhàng, nền trắng, ít xanh) */}
      <div className="space-y-3.5 border-b border-slate-200 bg-white p-4 sm:p-5 rounded border shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">
              Hệ thống Báo cáo & Điều hành
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
              Báo cáo & Thống kê
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Theo dõi dòng tiền, phân bổ nguồn thu chuyên khoa, hiệu suất bác sĩ và gợi ý AI.
            </p>
          </div>

          {/* Cụm Nút Xuất Báo Cáo */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 rounded border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tải xuống dữ liệu báo cáo đa định dạng"
              >
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span>Xuất báo cáo ▾</span>
              </button>
              {/* Menu xuất file */}
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute right-0 top-full mt-1 w-44 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg z-50 text-xs">
                <button
                  type="button"
                  onClick={() => handleExport('Excel (.xlsx)')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-emerald-50 hover:text-emerald-800 font-medium flex items-center justify-between"
                >
                  <span>Xuất Excel (.xlsx)</span>
                  <span className="text-[10px] font-bold text-emerald-700">Bảng tính</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('Báo cáo PDF')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-rose-50 hover:text-rose-800 font-medium flex items-center justify-between"
                >
                  <span>Xuất file PDF</span>
                  <span className="text-[10px] font-bold text-rose-700">In ấn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('Dữ liệu CSV')}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 hover:text-blue-800 font-medium flex items-center justify-between"
                >
                  <span>Xuất dữ liệu CSV</span>
                  <span className="text-[10px] font-bold text-blue-700">Raw data</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh công cụ lọc chung (Date Picker, Cơ sở, Bộ lọc nhanh) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Bộ lọc cơ sở */}
            <div className="flex items-center rounded border border-slate-200 bg-slate-50/70 px-2.5 py-1.5">
              <span className="mr-2 text-slate-400 font-medium">Cơ sở:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">Toàn bộ chi nhánh (3 cơ sở)</option>
                <option value="q1">Cơ sở Quận 1 (Trụ sở)</option>
                <option value="q5">Cơ sở Quận 5</option>
                <option value="td">Cơ sở TP. Thủ Đức</option>
              </select>
            </div>

            {/* Bộ lọc khoảng thời gian (Date Picker) */}
            <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50/70 px-2.5 py-1">
              <span className="text-slate-400 font-medium">Khoảng ngày:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              />
              <span className="text-slate-400 text-xs font-medium">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Bộ lọc thời gian nhanh */}
          <div className="inline-flex rounded border border-slate-200 bg-slate-50/80 p-0.5 text-xs shadow-2xs">
            {(['today', 'week', 'month', 'quarter'] as const).map((filter) => {
              const labels = {
                today: 'Hôm nay',
                week: 'Tuần này',
                month: 'Tháng này',
                quarter: 'Quý này',
              }
              const isActive = timeFilter === filter
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTimeFilter(filter)}
                  className={`rounded px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[filter]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Thông báo xuất file khi kích hoạt */}
        {exportNotice && (
          <div className="rounded bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-fadeIn">
            <span>{exportNotice}</span>
            <button
              type="button"
              onClick={() => setExportNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Thanh điều hướng Tab phong cách tối giản, sáng sủa giống Reception */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 rounded border shadow-2xs overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DOANH THU THEO THỜI GIAN                          */}
      {/* ======================================================== */}
      {activeTab === 'revenue_timeline' && (
        <div className="space-y-4">
          {/* 3 Thẻ chỉ số ngắn gọn, trắng sạch */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Tổng doanh thu kỳ này</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.revenue}
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">↑ {data.revenueGrowth}</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Doanh thu trung bình / ngày</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.dailyAvg}
              </p>
              <p className="mt-1 text-xs text-slate-400">Tính trên chu kỳ vận hành đã chọn</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Doanh thu trung bình / lượt khám</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.avgPerPatient}
              </p>
              <p className="mt-1 text-xs text-slate-400">Khám lâm sàng & chỉ định cận lâm sàng</p>
            </div>
          </div>

          {/* Biểu đồ Combo Doanh Thu & Lượt Khám (Cột Doanh thu + Đường Line số ca khám) */}
          <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{data.chartLabel}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Biểu đồ kết hợp (Combo Chart): Cột Doanh thu & Đường Line Lượt khám thực tế</p>
              </div>
              {/* Chú giải 2 trục trực quan */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-emerald-700 shadow-2xs" />
                  <span className="text-slate-700">Cột: Doanh thu (Tr VNĐ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-5 rounded-full bg-sky-600 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <span className="text-sky-700">Đường: Lượt khám (Ca)</span>
                </div>
              </div>
            </div>

            <div className="pt-5">
              {/* Vùng Canvas Biểu đồ 2 trục Y: Trục trái (Doanh thu) - Trục phải (Lượt khám) */}
              <div className="flex">
                {/* Trục Y Trái: Giá trị Doanh thu */}
                <div className="flex flex-col justify-between text-right pr-3 select-none w-12 shrink-0 h-56">
                  {data.guides.map((val, idx) => (
                    <span key={idx} className="text-[10px] font-medium text-slate-400 tabular-nums leading-none">
                      {val} <span className="text-[9px]">tr</span>
                    </span>
                  ))}
                  <span className="text-[10px] font-bold text-slate-600 tabular-nums leading-none">
                    0 <span className="text-[9px]">tr</span>
                  </span>
                </div>

                {/* Vùng Canvas Biểu Đồ: Đáy biểu đồ là đường border-b border-slate-300 (mốc 0) */}
                <div className="relative flex-1 h-56 border-b border-slate-300">
                  {/* Đường kẻ ngang nét đứt tham chiếu */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="w-full" />
                  </div>

                  {/* 1. Cột Doanh Thu: Đặt items-end, chạm TRỰC TIẾP vào đáy container (đường mốc 0) */}
                  <div className="relative z-10 flex h-full items-end justify-around px-4">
                    {data.bars.map((item, idx) => {
                      const heightPercent = Math.min(100, Math.max(4, Math.round((item.rev / data.chartCeiling) * 100)))
                      return (
                        <div
                          key={idx}
                          className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[68px] cursor-pointer"
                        >
                          {/* Tooltip khi rê chuột */}
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap rounded bg-slate-900 px-2.5 py-1 text-center shadow-md">
                            <p className="text-[11px] font-bold text-white">{item.label}: {item.rev} triệu VNĐ</p>
                            <p className="text-[10px] text-sky-300 font-medium">Lưu lượng: {item.count} lượt khám</p>
                          </div>

                          {/* Số tiền trên đầu cột */}
                          <span className="text-[11px] font-bold text-slate-700 mb-1.5 tabular-nums transition-colors group-hover:text-emerald-700">
                            {item.rev}
                          </span>

                          {/* Thân cột: Chạm đúng vào đường mốc 0, không có khoảng hở */}
                          <div
                            className="w-8 sm:w-10 rounded-t bg-emerald-700 hover:bg-emerald-800 transition-all duration-300 shadow-2xs"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      )
                    })}
                  </div>

                  {/* 2. Đường Line Lượt khám (Overlay Combo Chart) */}
                  {(() => {
                    const maxCount = Math.max(500, Math.ceil(Math.max(...data.bars.map((b: any) => b.count || 0)) * 1.25))
                    return (
                      <>
                        <svg className="pointer-events-none absolute inset-0 h-full w-full z-20 overflow-visible" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={data.bars.map((item, idx) => {
                              const xPercent = ((idx + 0.5) / data.bars.length) * 100
                              const yPercent = 100 - (item.count / maxCount) * 100
                              return `${xPercent}%,${yPercent}%`
                            }).join(' ')}
                          />
                        </svg>

                        {/* Điểm nút & Huy hiệu số ca trên Line */}
                        <div className="pointer-events-none absolute inset-0 z-30">
                          {data.bars.map((item, idx) => {
                            const xPercent = ((idx + 0.5) / data.bars.length) * 100
                            const yPercent = 100 - (item.count / maxCount) * 100
                            return (
                              <div
                                key={idx}
                                style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                              >
                                <span className="h-3 w-3 rounded-full bg-white border-2 border-sky-600 shadow-xs" />
                                <span className="mt-1 rounded bg-sky-50/90 border border-sky-200 px-1 py-0.2 text-[9px] font-bold text-sky-800 shadow-2xs">
                                  {item.count} ca
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}
                </div>

                {/* Trục Y Phải: Giá trị Lượt khám (Ca) */}
                {(() => {
                  const maxCount = Math.max(500, Math.ceil(Math.max(...data.bars.map((b: any) => b.count || 0)) * 1.25))
                  const step = maxCount / 4
                  return (
                    <div className="flex flex-col justify-between text-left pl-3 select-none w-12 shrink-0 h-56">
                      <span className="text-[10px] font-semibold text-sky-700 tabular-nums leading-none">
                        {maxCount} <span className="text-[9px] font-normal">ca</span>
                      </span>
                      <span className="text-[10px] font-medium text-sky-600/70 tabular-nums leading-none">
                        {Math.round(step * 3)} <span className="text-[9px] font-normal">ca</span>
                      </span>
                      <span className="text-[10px] font-medium text-sky-600/70 tabular-nums leading-none">
                        {Math.round(step * 2)} <span className="text-[9px] font-normal">ca</span>
                      </span>
                      <span className="text-[10px] font-medium text-sky-600/70 tabular-nums leading-none">
                        {Math.round(step)} <span className="text-[9px] font-normal">ca</span>
                      </span>
                      <span className="text-[10px] font-bold text-sky-700 tabular-nums leading-none">
                        0 <span className="text-[9px] font-normal">ca</span>
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Nhãn trục X đặt riêng bên dưới mốc 0 */}
              <div className="flex pt-2.5">
                <div className="w-12 shrink-0 pr-3" />
                <div className="flex-1 flex justify-around px-4 select-none">
                  {data.bars.map((item, idx) => (
                    <div key={idx} className="text-center flex-1 max-w-[68px]">
                      <p className="text-xs font-bold text-slate-700">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.count} ca</p>
                    </div>
                  ))}
                </div>
                <div className="w-12 shrink-0 pl-3" />
              </div>
            </div>
          </div>

          {/* Cơ cấu 4 phương thức thanh toán: 40% Donut Chart - 60% Thẻ chi tiết */}
          <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cơ cấu 4 Phương thức thanh toán</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tỷ trọng dòng tiền thực tế giữa các kênh thanh toán</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700">100% Đã quyết toán</span>
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* 40% (lg:col-span-5): Donut Chart */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
                <div
                  className="relative grid place-items-center rounded-full shadow-sm"
                  style={{
                    width: '164px',
                    height: '164px',
                    background: `conic-gradient(
                      #047857 0% ${data.payments[0]?.pct || 63}%,
                      #ec4899 ${data.payments[0]?.pct || 63}% ${(data.payments[0]?.pct || 63) + (data.payments[1]?.pct || 18)}%,
                      #2563eb ${(data.payments[0]?.pct || 63) + (data.payments[1]?.pct || 18)}% ${(data.payments[0]?.pct || 63) + (data.payments[1]?.pct || 18) + (data.payments[2]?.pct || 11)}%,
                      #64748b ${(data.payments[0]?.pct || 63) + (data.payments[1]?.pct || 18) + (data.payments[2]?.pct || 11)}% 100%
                    )`,
                  }}
                >
                  {/* Tâm tròn tạo hình Donut */}
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-inner">
                    <div className="px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tổng thu</span>
                      <p className="text-xs font-bold text-slate-900 leading-tight mt-0.5 truncate max-w-[96px]" title={data.revenue}>
                        {data.revenue}
                      </p>
                      <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">4 Kênh thu</span>
                    </div>
                  </div>
                </div>

                {/* Legend mini dưới Donut */}
                <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#047857]" /> Chuyển khoản ({data.payments[0]?.pct}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ec4899]" /> Ví MoMo ({data.payments[1]?.pct}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> Thẻ POS ({data.payments[2]?.pct}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#64748b]" /> Tiền mặt ({data.payments[3]?.pct}%)
                  </span>
                </div>
              </div>

              {/* 60% (lg:col-span-7): Thẻ chi tiết 4 phương thức */}
              <div className="lg:col-span-7 grid gap-3 sm:grid-cols-2">
                {data.payments.map((p, idx) => {
                  const borderColors = ['border-emerald-200', 'border-pink-200', 'border-blue-200', 'border-slate-200']
                  const barColors = ['bg-[#047857]', 'bg-[#ec4899]', 'bg-[#2563eb]', 'bg-[#64748b]']
                  return (
                    <div key={idx} className={`rounded border ${borderColors[idx] || 'border-slate-200'} bg-slate-50/60 p-3.5 hover:bg-slate-50 transition-colors shadow-2xs`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">{p.name}</span>
                        <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                          {p.pct}%
                        </span>
                      </div>
                      <p className="mt-2 text-base font-bold text-slate-900 tabular-nums">{p.amount}</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className={`h-full ${barColors[idx]} rounded-full transition-all duration-500`} style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: NGUỒN THU CHUYÊN KHOA & GÓI KHÁM (MỤC RIÊNG BIỆT) */}
      {/* ======================================================== */}
      {activeTab === 'revenue_sources' && (
        <div className="space-y-4">
          {/* 2 Thẻ tổng quát so sánh Gói khám vs Chuyên khoa */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Khám Gói sức khỏe định kỳ</span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Chiếm 32%
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">196.200.000 đ</p>
              <p className="mt-1 text-xs text-slate-500">392 lượt khám · Doanh thu TB 500.000 đ/gói</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Khám lẻ theo Chuyên khoa (5 khoa)</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
                  Chiếm 68%
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">416.250.000 đ</p>
              <p className="mt-1 text-xs text-slate-500">1,028 lượt khám · Trung bình 404.000 đ/lượt</p>
            </div>
          </div>

          {/* Sơ đồ Phân bổ Trực quan: Chia 2 nửa (Horizontal Bar Chart + Donut Chart mini vĩ mô) */}
          <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Phân tích Cơ cấu Nguồn thu: Chuyên khoa & Gói khám</h3>
                <p className="text-xs text-slate-400 mt-0.5">Xếp hạng chi tiết từng nguồn thu và tương quan tỷ trọng vĩ mô</p>
              </div>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                Tổng doanh thu: 612.450.000 đ
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Nửa bên trái (lg:col-span-7): Biểu đồ Cột Ngang (Horizontal Bar Chart) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Xếp hạng Tỷ trọng Doanh thu (Horizontal Bar Chart)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Theo doanh thu thực thu</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {revenueSources.map((s, idx) => (
                    <div key={s.id} className="rounded border border-slate-200/70 bg-slate-50/40 p-2.5 space-y-1.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({s.category})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 tabular-nums">{s.rev}</span>
                          <span className="rounded bg-white border border-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                            {s.pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, s.pct * 2.7)}%`, backgroundColor: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nửa bên phải (lg:col-span-5): Donut Chart mini vĩ mô (Khám gói 32% vs Khám lẻ 68%) */}
              <div className="lg:col-span-5 rounded border border-slate-200/80 bg-slate-50/60 p-4 flex flex-col items-center shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
                  Tỷ trọng Vĩ mô 2 Mảng lớn (Donut Chart)
                </h4>

                {/* Donut Chart mini */}
                <div
                  className="relative grid place-items-center rounded-full shadow-2xs"
                  style={{
                    width: '144px',
                    height: '144px',
                    background: 'conic-gradient(#047857 0% 32%, #2563eb 32% 100%)',
                  }}
                >
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Quy mô</span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">612.45 tr</p>
                      <span className="text-[9px] text-slate-500 block">Toàn viện</span>
                    </div>
                  </div>
                </div>

                {/* 2 Khối tóm tắt nhanh chi tiết 2 mảng lớn */}
                <div className="mt-4 w-full space-y-2">
                  <div className="flex items-center justify-between rounded bg-white p-2.5 border border-emerald-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#047857]" />
                      <div>
                        <p className="font-bold text-slate-900">Khám Gói định kỳ</p>
                        <p className="text-[10px] text-slate-400">392 lượt khám · TB 500k/gói</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <b className="text-sm text-emerald-800">32%</b>
                      <p className="text-[10px] font-bold text-slate-600">196.2 tr</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded bg-white p-2.5 border border-blue-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-[#2563eb]" />
                      <div>
                        <p className="font-bold text-slate-900">Khám lẻ Chuyên khoa</p>
                        <p className="text-[10px] text-slate-400">1,028 lượt khám · TB 404k/ca</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <b className="text-sm text-blue-800">68%</b>
                      <p className="text-[10px] font-bold text-slate-600">416.25 tr</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng Xếp hạng & Chi tiết Đóng góp từng Khoa / Gói khám */}
          <div className="rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-sm font-bold text-slate-900">Bảng chi tiết Doanh thu theo Chuyên khoa & Gói khám</h3>
              <p className="text-xs text-slate-400 mt-0.5">Xếp hạng theo tổng thu thực tế, số ca khám và giá trị trung bình</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Hạng</th>
                    <th className="py-3 px-4">Tên Chuyên khoa / Gói khám</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4 text-center">Lượt khám</th>
                    <th className="py-3 px-4 text-right">Giá trị TB/ca</th>
                    <th className="py-3 px-4 text-right">Tổng doanh thu</th>
                    <th className="py-3 px-4 text-center">Tỷ trọng</th>
                    <th className="py-3 px-4 text-right">Tăng trưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revenueSources.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          s.category === 'Gói khám bệnh'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                        {s.appts} ca
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                        {s.avgTicket}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {s.rev}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold text-slate-800">
                        {s.pct}%
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-medium whitespace-nowrap">
                        {s.growth}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LƯỢT KHÁM & VẬN HÀNH (HEATMAP GIỜ CAO ĐIỂM)       */}
      {/* ======================================================== */}
      {activeTab === 'operations' && (
        <div className="space-y-4">
          {/* 3 Thẻ lưu lượng */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Tổng ca khám tiếp nhận</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.appointments}
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">Hoàn thành: {data.completionRate}</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Tỷ lệ vắng mặt (No-show)</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.noShowRate}
              </p>
              <p className="mt-1 text-xs text-slate-400">Đặt lịch nhưng không tới phòng khám</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Tỷ lệ hủy lịch hẹn</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.cancelRate}
              </p>
              <p className="mt-1 text-xs text-slate-400">Bệnh nhân báo hủy trước giờ khám</p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            {/* Heatmap Giờ cao điểm: tone xám/đen nhã nhặn, ít xanh */}
            <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Biểu đồ nhiệt Giờ cao điểm (Peak Hours Heatmap)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Số lượng bệnh nhân tiếp nhận trung bình theo từng khung giờ trong tuần</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 select-none">
                  <span className="font-medium text-slate-400">Vắng</span>
                  <div className="flex h-3.5 w-28 rounded-full overflow-hidden border border-slate-200 shadow-2xs">
                    <span className="flex-1 bg-[#a5f3fc]" title="Rất vắng (<15 ca)" />
                    <span className="flex-1 bg-[#bbf7d0]" title="Vắng nhẹ (15-20 ca)" />
                    <span className="flex-1 bg-[#fef08a]" title="Bình thường (21-27 ca)" />
                    <span className="flex-1 bg-[#fed7aa]" title="Đông (28-35 ca)" />
                    <span className="flex-1 bg-[#fca5a5]" title="Rất đông (≥36 ca)" />
                  </div>
                  <span className="font-medium text-slate-400">Đông</span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-500 border-b border-slate-100">
                      <th className="text-left pb-2.5 font-semibold text-slate-400">Khung giờ</th>
                      {heatmapDays.map((d) => (
                        <th key={d} className="pb-2.5 px-1">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {heatmapSlots.map((slot, sIdx) => (
                      <tr key={slot}>
                        <td className="text-left py-2 text-[11px] font-semibold text-slate-600 whitespace-nowrap pr-2">
                          {slot}
                        </td>
                        {heatmapDays.map((_, dIdx) => {
                          const count = heatmapMatrix[sIdx][dIdx]
                          const colorClass = getHeatmapClass(count, sIdx, dIdx)
                          return (
                            <td key={dIdx} className="p-1">
                              <div
                                className={`h-9 w-full rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-150 hover:scale-105 cursor-pointer ${colorClass}`}
                                title={`${slot}, ${heatmapDays[dIdx]}: ~${count} ca`}
                              >
                                {count}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200">
                <span className="font-bold text-slate-900 mr-1.5">Gợi ý điều phối:</span>
                Khung giờ <b>09:00 – 11:00</b> các ngày Thứ 2, Thứ 5 và Thứ 6 đạt đỉnh trên 35 ca/giờ. Bố trí thêm bác sĩ khám sơ bộ và mở tối đa quầy tiếp nhận để giảm thiểu thời gian chờ.
              </div>
            </div>

            {/* Khách mới vs Tái khám */}
            <div className="space-y-4">
              <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  Tỷ lệ Bệnh nhân mới vs Tái khám
                </h3>
                <div className="h-5 w-full rounded overflow-hidden flex text-[10px] font-bold text-white border border-slate-200">
                  <div style={{ width: `${data.newPatientsPct}%` }} className="bg-slate-800 flex items-center justify-center">
                    {data.newPatientsPct}% Mới
                  </div>
                  <div style={{ width: `${data.returnPatientsPct}%` }} className="bg-slate-400 flex items-center justify-center">
                    {data.returnPatientsPct}% Tái khám
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="rounded p-2.5 bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Bệnh nhân mới</span>
                    <p className="mt-1 text-base font-bold text-slate-900">{data.newPatientsPct}%</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Đặt qua Web, App & Tiếp đón</p>
                  </div>
                  <div className="rounded p-2.5 bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Khách tái khám</span>
                    <p className="mt-1 text-base font-bold text-slate-900">{data.returnPatientsPct}%</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Đo lường mức độ giữ chân (Retention)</p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  Chỉ số Phễu Tiếp nhận
                </h3>
                <div className="mt-3 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-700">
                      <span>Hoàn thành khám bệnh</span>
                      <b className="text-slate-900">{data.completionRate}</b>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-slate-800 rounded-full" style={{ width: data.completionRate }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-700">
                      <span>Vắng mặt (No-show)</span>
                      <b className="text-slate-700">{data.noShowRate}</b>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: data.noShowRate }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1 text-slate-700">
                      <span>Hủy lịch hẹn trước</span>
                      <b className="text-slate-700">{data.cancelRate}</b>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-slate-300 rounded-full" style={{ width: data.cancelRate }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: HIỆU SUẤT BÁC SĨ                                  */}
      {/* ======================================================== */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Số bác sĩ đang tiếp nhận khám</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">18 bác sĩ</p>
              <p className="mt-1 text-xs text-slate-400">Phủ kín 8 chuyên khoa mũi nhọn</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Bác sĩ dẫn đầu ca khám</span>
              <p className="mt-1.5 text-base font-bold text-slate-900 truncate">ThS. BS Trần Bích Ngọc</p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">215 ca khám hoàn thành</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Điểm hài lòng trung bình</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">★ 98.6%</p>
              <p className="mt-1 text-xs text-slate-400">Đánh giá từ khảo sát sau khám</p>
            </div>
          </div>

          {/* Biểu đồ Cột Ngang (Horizontal Bar Chart) Top 5 Bác Sĩ Gánh Tải Chính */}
          <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Biểu đồ Xếp hạng Top 5 Bác sĩ (Horizontal Bar Chart)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhận diện nhanh nhân sự chủ lực gánh tải ca khám và doanh thu toàn viện
                </p>
              </div>

              {/* Nút chuyển đổi tiêu chí xếp hạng */}
              <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDoctorMetric('revenue')}
                  className={`rounded px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    doctorMetric === 'revenue'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Doanh thu
                </button>
                <button
                  type="button"
                  onClick={() => setDoctorMetric('appointments')}
                  className={`rounded px-3 py-1 font-semibold transition-colors cursor-pointer ${
                    doctorMetric === 'appointments'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo Số ca khám
                </button>
              </div>
            </div>

            {/* Danh sách 5 thanh Bar ngang */}
            <div className="mt-4 space-y-3">
              {(() => {
                const sorted = [...doctorsPerformance].sort((a, b) => {
                  if (doctorMetric === 'appointments') return b.appts - a.appts
                  const revA = parseFloat(a.totalRev.replace(/\./g, '').replace(' đ', ''))
                  const revB = parseFloat(b.totalRev.replace(/\./g, '').replace(' đ', ''))
                  return revB - revA
                })
                const maxVal = doctorMetric === 'appointments'
                  ? Math.max(...sorted.map(d => d.appts))
                  : Math.max(...sorted.map(d => parseFloat(d.totalRev.replace(/\./g, '').replace(' đ', ''))))

                const rankMedals = ['🥇 #1', '🥈 #2', '🥉 #3', '#4', '#5']
                const barColors = [
                  'bg-emerald-700',
                  'bg-blue-600',
                  'bg-indigo-600',
                  'bg-amber-500',
                  'bg-slate-600',
                ]

                return sorted.map((doc, idx) => {
                  const currentVal = doctorMetric === 'appointments'
                    ? doc.appts
                    : parseFloat(doc.totalRev.replace(/\./g, '').replace(' đ', ''))
                  const widthPct = Math.min(100, Math.max(12, Math.round((currentVal / maxVal) * 100)))

                  return (
                    <div key={idx} className="rounded border border-slate-200/70 bg-slate-50/40 p-3 hover:bg-slate-50 transition-colors space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 w-9 text-xs">
                            {rankMedals[idx]}
                          </span>
                          <span className="font-bold text-slate-900">{doc.name}</span>
                          <span className="rounded bg-white border border-slate-200 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                            {doc.specialty}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-emerald-700 font-semibold">★ {doc.satisfaction}</span>
                          <span className="text-xs font-bold text-slate-900 tabular-nums">
                            {doctorMetric === 'revenue' ? doc.totalRev : `${doc.appts} ca khám`}
                          </span>
                        </div>
                      </div>

                      {/* Thanh cột ngang */}
                      <div className="h-2.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColors[idx] || 'bg-slate-700'} transition-all duration-500`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h3 className="text-sm font-bold text-slate-900">Bảng theo dõi Hiệu suất & Đóng góp Bác sĩ</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chi tiết số ca khám, thu dịch vụ và chỉ định cận lâm sàng (CLS) của từng bác sĩ</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[860px]">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Bác sĩ phụ trách</th>
                    <th className="py-3 px-4">Chuyên khoa</th>
                    <th className="py-3 px-4 text-center">Số ca khám</th>
                    <th className="py-3 px-4 text-right">Thu từ Khám bệnh</th>
                    <th className="py-3 px-4 text-right">Thu từ Chỉ định CLS</th>
                    <th className="py-3 px-4 text-right">Tổng doanh thu</th>
                    <th className="py-3 px-4 text-center">Hài lòng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorsPerformance.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {doc.name}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {doc.specialty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 tabular-nums whitespace-nowrap">
                        {doc.appts} ca
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                        {doc.examRev}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 tabular-nums whitespace-nowrap">
                        {doc.subclinicalRev}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {doc.totalRev}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800 whitespace-nowrap">
                        ★ {doc.satisfaction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: HIỆU QUẢ GỢI Ý AI                                 */}
      {/* ======================================================== */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Lượt hiển thị gợi ý (Impressions)</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {aiFunnel.impressions.toLocaleString('vi-VN')}
              </p>
              <p className="mt-1 text-xs text-slate-400">Xuất hiện qua AI Chatbot & Tìm kiếm triệu chứng</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Tỷ lệ nhấp xem chi tiết (CTR)</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {aiFunnel.ctr}
              </p>
              <p className="mt-1 text-xs text-slate-400">Đạt {aiFunnel.clicks} lượt click xem chi tiết gói khám</p>
            </div>

            <div className="rounded border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Doanh thu do AI mang lại</span>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {aiFunnel.revenueGenerated}
              </p>
              <p className="mt-1 text-xs text-emerald-700 font-medium">345 ca chốt đặt khám thành công (12.1%)</p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
            {/* Phễu chuyển đổi phân tầng hình thang (Funnel Chart) */}
            <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Biểu đồ Phễu Chuyển đổi AI (Funnel Chart)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hành trình phân tầng thu hẹp dần từ lượt hiển thị đến doanh thu thực tế
                </p>
              </div>

              {/* Tầng 1 (Top / Rộng 100%): Hiển thị gợi ý */}
              <div className="space-y-2">
                <div className="w-full rounded-t-lg border-2 border-slate-300 bg-slate-100/90 p-3 text-center shadow-xs transition-all hover:bg-slate-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Tầng 1: Lượt hiển thị gợi ý (Impressions)
                  </span>
                  <div className="mt-1 flex items-baseline justify-center gap-2">
                    <span className="text-xl font-bold text-slate-900 tabular-nums">
                      {aiFunnel.impressions.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">lượt (100%)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">AI Chatbot & Semantic Search</p>
                </div>

                {/* Kết nối chuyển đổi 1 -> 2 */}
                <div className="flex flex-col items-center justify-center py-0.5">
                  <div className="flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-700 shadow-2xs">
                    <span>▼ Tỷ lệ Click xem chi tiết (CTR): {aiFunnel.ctr}</span>
                    <span className="text-[9px] font-normal text-slate-400">(Rơi rụng 65.5%)</span>
                  </div>
                </div>

                {/* Tầng 2 (Middle / Rộng 82%): Click xem chi tiết */}
                <div className="w-[82%] mx-auto rounded-md border-2 border-sky-300 bg-sky-50/90 p-3 text-center shadow-xs transition-all hover:bg-sky-100/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                    Tầng 2: Xem chi tiết gói khám (Clicks)
                  </span>
                  <div className="mt-1 flex items-baseline justify-center gap-2">
                    <span className="text-xl font-bold text-sky-950 tabular-nums">
                      {aiFunnel.clicks.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs font-semibold text-sky-700">lượt ({aiFunnel.ctr})</span>
                  </div>
                  <p className="text-[10px] text-sky-600/80 mt-0.5">Người dùng mở xem bảng giá & phác đồ</p>
                </div>

                {/* Kết nối chuyển đổi 2 -> 3 */}
                <div className="flex flex-col items-center justify-center py-0.5">
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700 shadow-2xs">
                    <span>▼ Tỷ lệ Đặt hẹn thực tế: 35.2%</span>
                    <span className="text-[9px] font-normal text-slate-400">(Toàn phễu: {aiFunnel.conversionRate})</span>
                  </div>
                </div>

                {/* Tầng 3 (Bottom / Rộng 64%): Đặt khám thành công & Doanh thu */}
                <div className="w-[64%] mx-auto rounded-b-lg border-2 border-emerald-400 bg-emerald-50 p-3.5 text-center shadow-sm transition-all hover:bg-emerald-100/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                    Tầng 3: Đặt khám thành công
                  </span>
                  <div className="mt-1 flex items-baseline justify-center gap-2">
                    <span className="text-2xl font-bold text-emerald-950 tabular-nums">
                      {aiFunnel.conversions}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">ca chốt hẹn</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-emerald-200/80">
                    <span className="text-[10px] font-semibold text-slate-500 block">Doanh thu thu về:</span>
                    <b className="text-sm text-emerald-800 tabular-nums">{aiFunnel.revenueGenerated}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Gói khám được gợi ý nhiều nhất từ LLM Tầng 3 */}
            <div className="rounded border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Top Gói khám được Gợi ý nhiều nhất từ Tầng 3 (LLM Re-ranking)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân tích xu hướng bệnh lý cộng đồng theo triệu chứng người dùng nhập vào
                </p>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {aiTopRecommendedPackages.map((pkg, idx) => (
                  <div key={idx} className="rounded border border-slate-200 p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="grid h-5 w-5 place-items-center rounded bg-slate-200 text-[10px] font-bold text-slate-700 shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{pkg.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Khoa: <span className="font-semibold text-slate-700">{pkg.specialty}</span> · Xu hướng: <span className="text-slate-700 font-medium">{pkg.trend}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900">{pkg.bookedCount} / {pkg.suggestedCount} ca</span>
                        <p className="text-[10px] font-bold text-emerald-700">Chuyển đổi {pkg.conversionPct}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
