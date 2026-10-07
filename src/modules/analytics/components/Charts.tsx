'use client'

import * as React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

// ─────────────────────────────────────────────────────────────
// 1. SPARKLINE MINI (Shadcn / Recharts AreaChart mini)
// ─────────────────────────────────────────────────────────────
export function Sparkline({
  data = [12, 18, 15, 25, 22, 30, 28],
  color = '#047857',
  fillColor = '#d1fae5',
  height = 26,
  width = 64,
  className = '',
}: {
  data?: number[]
  color?: string
  fillColor?: string
  height?: number
  width?: number
  className?: string
}) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((val, idx) => ({ idx, val: Number(val) || 0 }))
  }, [data])

  if (!isMounted || chartData.length < 2) {
    return (
      <div
        style={{ width, height }}
        className={`flex items-center justify-center rounded bg-slate-50 ${className}`}
      >
        <div className="h-0.5 w-3/4 rounded bg-slate-200" />
      </div>
    )
  }

  return (
    <div style={{ width, height }} className={`overflow-visible ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.replace('#', '')})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. DONUT CHART (Shadcn / Recharts PieChart)
// ─────────────────────────────────────────────────────────────
export interface DonutSegment {
  label: string
  value: number
  color: string
  subLabel?: string
}

export function DonutChart({
  segments = [],
  size = 130,
  thickness = 20,
  centerLabel = 'Tổng',
  centerValue = '',
  centerSub = '',
  layout = 'vertical',
}: {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  centerSub?: string
  layout?: 'vertical' | 'horizontal'
}) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const total = React.useMemo(() => {
    return segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
  }, [segments])

  const chartData = React.useMemo(() => {
    if (total === 0) {
      return [{ name: 'Chưa có dữ liệu', value: 1, color: '#e2e8f0', percent: '0%' }]
    }
    return segments.map((s) => ({
      name: s.label,
      value: Number(s.value) || 0,
      color: s.color,
      subLabel: s.subLabel,
      percent: total > 0 ? `${((Number(s.value || 0) / total) * 100).toFixed(1)}%` : '0%',
    }))
  }, [segments, total])

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {}
    segments.forEach((s, idx) => {
      cfg[`seg-${idx}`] = {
        label: s.label,
        color: s.color,
      }
    })
    return cfg
  }, [segments])

  if (!isMounted) {
    return (
      <div className="flex h-36 items-center justify-center text-xs text-slate-400 animate-pulse">
        Đang tải biểu đồ...
      </div>
    )
  }

  const innerRadius = (size / 2) - thickness
  const outerRadius = size / 2

  return (
    <div className={`flex ${layout === 'horizontal' ? 'flex-col sm:flex-row items-center justify-center gap-5' : 'flex-col items-center'}`}>
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <ResponsiveContainer width={size} height={size}>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length || total === 0) return null
                const data = payload[0].payload
                return (
                  <div className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md">
                    <p className="font-bold text-slate-900">{data.name}</p>
                    <p className="text-slate-600 mt-0.5">
                      {data.subLabel || `${data.value}`} ({data.percent})
                    </p>
                  </div>
                )
              }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              stroke="none"
              paddingAngle={chartData.length > 1 ? 3 : 0}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
            {centerLabel}
          </span>
          {centerValue && (
            <span className="text-xs font-bold text-slate-900 block leading-tight mt-0.5">
              {centerValue}
            </span>
          )}
          {centerSub && (
            <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">
              {centerSub}
            </span>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className={`w-full ${layout === 'horizontal' ? 'flex-1 space-y-1.5' : 'mt-4 space-y-2'}`}>
        {chartData.map((seg, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs rounded bg-slate-50 px-2.5 py-1.5 border border-slate-100 hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: seg.color }} />
              <span className="font-semibold text-slate-800 truncate text-[11px]" title={seg.name}>
                {seg.name}
              </span>
            </div>
            <div className="text-right shrink-0 flex items-center gap-2">
              <span className="text-slate-500 font-medium text-[10px]">{seg.subLabel || `${seg.value}`}</span>
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                {seg.percent}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. STACKED BAR CHART (Shadcn / Recharts Stacked Bar)
// ─────────────────────────────────────────────────────────────
export interface StackedBarItem {
  label: string
  stacks: Array<{
    label: string
    value: number
    color: string
  }>
}

export function StackedBarChart({
  data = [],
  height = 200,
  legendTitle = 'Cơ cấu phân bổ',
}: {
  data: StackedBarItem[]
  height?: number
  legendTitle?: string
}) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const stackKeys = React.useMemo(() => {
    if (!data.length) return []
    return data[0].stacks.map((s, idx) => ({
      key: `stack_${idx}`,
      label: s.label,
      color: s.color,
    }))
  }, [data])

  const chartData = React.useMemo(() => {
    return data.map((item) => {
      const row: Record<string, any> = { label: item.label }
      let rowTotal = 0
      item.stacks.forEach((s, idx) => {
        row[`stack_${idx}`] = s.value
        rowTotal += s.value
      })
      row.total = rowTotal
      return row
    })
  }, [data])

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {}
    stackKeys.forEach((s) => {
      cfg[s.key] = { label: s.label, color: s.color }
    })
    return cfg
  }, [stackKeys])

  if (!isMounted) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400 animate-pulse">
        Đang tải biểu đồ phân tầng...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Legend Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2.5">
        <span className="font-bold text-slate-700">{legendTitle}</span>
        <div className="flex items-center gap-3">
          {stackKeys.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 font-medium text-[11px]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recharts BarChart container */}
      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const total = payload.reduce((acc, p) => acc + Number(p.value || 0), 0)
                return (
                  <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                    <p className="font-bold text-slate-900">{label}: {total} ca</p>
                    <div className="mt-1 space-y-1">
                      {payload.map((p, idx) => {
                        const item = stackKeys.find((k) => k.key === p.dataKey)
                        return (
                          <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: p.color }} />
                              <span className="text-slate-600">{item?.label || p.name}:</span>
                            </div>
                            <b className="text-slate-900">{p.value}</b>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }}
            />
            {stackKeys.map((s, idx) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId="a"
                fill={s.color}
                radius={idx === stackKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                barSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 4. KPI METRIC CARD (Universal Executive & Operational KPI Card)
// ─────────────────────────────────────────────────────────────
export interface KpiMetricCardProps {
  label: string
  value: string | number
  detail?: string
  badge?:
    | {
        text: string
        variant?: 'emerald' | 'blue' | 'amber' | 'rose' | 'slate' | 'indigo'
      }
    | string
  tone?: 'emerald' | 'blue' | 'amber' | 'slate' | 'indigo' | 'rose'
  icon?: React.ReactNode
  sparklineData?: number[]
  sparklineColor?: string
  sparklineFillColor?: string
  growth?: string
  className?: string
}

export function KpiMetricCard({
  label,
  value,
  detail,
  badge,
  tone = 'emerald',
  icon,
  sparklineData,
  sparklineColor,
  sparklineFillColor,
  growth,
  className = '',
}: KpiMetricCardProps) {
  const tones: Record<string, { icon: string; text: string; sub: string; line: string; fill: string; badge: string }> = {
    emerald: {
      icon: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      text: 'text-slate-900',
      sub: 'text-emerald-700',
      line: '#047857',
      fill: '#d1fae5',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    blue: {
      icon: 'bg-blue-50 text-blue-700 border border-blue-100',
      text: 'text-slate-900',
      sub: 'text-blue-700',
      line: '#0284c7',
      fill: '#e0f2fe',
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-700 border border-amber-100',
      text: 'text-slate-900',
      sub: 'text-amber-700',
      line: '#d97706',
      fill: '#fef3c7',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    indigo: {
      icon: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      text: 'text-slate-900',
      sub: 'text-indigo-700',
      line: '#6366f1',
      fill: '#e0e7ff',
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    rose: {
      icon: 'bg-rose-50 text-rose-700 border border-rose-100',
      text: 'text-slate-900',
      sub: 'text-rose-700',
      line: '#e11d48',
      fill: '#ffe4e6',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    slate: {
      icon: 'bg-slate-100 text-slate-700 border border-slate-200',
      text: 'text-slate-900',
      sub: 'text-slate-500',
      line: '#475569',
      fill: '#f1f5f9',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  }

  const theme = tones[tone] || tones.emerald

  // Tự động tính toán xu hướng tăng trưởng nếu có sparkline hoặc growth
  const computedTrend = React.useMemo(() => {
    if (growth) {
      const isNeg = growth.includes('-') || growth.includes('↓')
      return { text: growth, isNeg }
    }
    if (!sparklineData || sparklineData.length < 2) return null
    const mid = Math.floor(sparklineData.length / 2)
    const firstHalf = sparklineData.slice(0, mid).reduce((a, b) => a + b, 0)
    const secondHalf = sparklineData.slice(mid).reduce((a, b) => a + b, 0)
    if (firstHalf === 0 && secondHalf === 0) return { text: '0%', isNeg: false }
    const base = firstHalf > 0 ? firstHalf : 1
    const pct = Math.round(((secondHalf - firstHalf) / base) * 100)
    return {
      text: pct > 0 ? `+${pct}%` : `${pct}%`,
      isNeg: pct < 0,
    }
  }, [sparklineData, growth])

  // Chuẩn hóa badge hiển thị
  const badgeInfo = React.useMemo(() => {
    if (!badge) return null
    if (typeof badge === 'string') {
      const isNeg = badge.includes('-') || badge.includes('↓')
      const isPos = badge.includes('+') || badge.includes('↑')
      return {
        text: badge,
        cls: isNeg
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : isPos
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : theme.badge,
      }
    }
    const bTheme = tones[badge.variant || 'emerald'] || theme
    return { text: badge.text, cls: bTheme.badge }
  }, [badge, theme])

  const effectiveBadge =
    badgeInfo ||
    (computedTrend
      ? {
          text: computedTrend.text,
          cls: computedTrend.isNeg
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200',
        }
      : null)

  return (
    <article
      className={`rounded border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all ${className}`}
    >
      {/* Hàng 1: Tiêu đề & Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 truncate">{label}</span>
        {effectiveBadge && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ${effectiveBadge.cls}`}>
            {effectiveBadge.text}
          </span>
        )}
      </div>

      {/* Hàng 2: Giá trị chỉ số & Mini Sparkline / Icon */}
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className={`text-2xl font-extrabold tracking-tight ${theme.text} tabular-nums leading-none truncate`}>
          {value}
        </div>
        <div className="shrink-0 flex items-center">
          {sparklineData && sparklineData.length > 0 ? (
            <Sparkline
              data={sparklineData}
              color={sparklineColor || (computedTrend?.isNeg ? '#e11d48' : theme.line)}
              fillColor={sparklineFillColor || (computedTrend?.isNeg ? '#ffe4e6' : theme.fill)}
              height={26}
              width={64}
            />
          ) : icon ? (
            <span className={`grid h-8 w-8 place-items-center rounded ${theme.icon}`}>
              {icon}
            </span>
          ) : null}
        </div>
      </div>

      {/* Hàng 3: Chú thích chi tiết */}
      {detail && (
        <p className={`mt-2 text-[11px] font-medium ${theme.sub} truncate`}>
          {detail}
        </p>
      )}
    </article>
  )
}

// ─────────────────────────────────────────────────────────────
// 5. SECTION CARD (Standardized Container with Title & Action)
// ─────────────────────────────────────────────────────────────
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded border border-slate-200/80 bg-white shadow-2xs overflow-hidden ${className}`}>
      <header className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}
