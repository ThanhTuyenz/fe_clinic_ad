'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Search } from 'lucide-react'

export interface KeywordSearchStat {
  keyword: string
  count: number
}

interface SearchAnalyticsChartProps {
  data?: KeywordSearchStat[]
  title?: string
  description?: string
  className?: string
  layout?: 'horizontal' | 'vertical'
}

const chartConfig = {
  count: {
    label: 'Số lượt tìm kiếm',
    color: '#0284c7', // Sky-600
  },
} satisfies ChartConfig

export function SearchAnalyticsChart({
  data = [],
  title = 'Top Từ khóa tìm kiếm',
  description = 'Tần suất truy vấn triệu chứng và dịch vụ từ bệnh nhân',
  className = '',
  layout = 'vertical',
}: SearchAnalyticsChartProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const formattedData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((item) => ({
      keyword: item.keyword,
      count: Number(item.count) || 0,
    }))
  }, [data])

  if (!isMounted) {
    return (
      <div className={`rounded border border-slate-200/90 bg-white p-5 shadow-2xs ${className}`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>{title}</span>
            </h3>
            {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="flex h-56 items-center justify-center text-xs text-slate-400 animate-pulse">
          Đang tải biểu đồ...
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>{title}</span>
          </h3>
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>

      {formattedData.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-slate-400">
          Chưa ghi nhận từ khóa tìm kiếm nào trong kỳ
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-56 w-full">
          {layout === 'vertical' ? (
            /* Biểu đồ thanh ngang (Horizontal Bar Chart) */
            <BarChart
              data={formattedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="keyword"
                type="category"
                tickLine={false}
                axisLine={false}
                width={85}
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
              />
              <ChartTooltip
                cursor={{ fill: '#f8fafc' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
                barSize={18}
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(val: any) => `${val} lượt`}
                  className="fill-slate-600 text-[11px] font-bold"
                />
                {formattedData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#0284c7' : index === 1 ? '#0ea5e9' : '#38bdf8'}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            /* Biểu đồ cột đứng (Vertical Bar Chart) */
            <BarChart
              data={formattedData}
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="keyword"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={{ fill: '#f8fafc' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
                barSize={28}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  formatter={(val: any) => `${val}`}
                  className="fill-slate-700 text-[11px] font-bold"
                />
              </Bar>
            </BarChart>
          )}
        </ChartContainer>
      )}
    </div>
  )
}
