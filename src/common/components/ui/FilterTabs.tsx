import React from 'react'

export interface FilterTabItem {
  id: string
  label: string
  count?: number
}

export interface FilterTabsProps {
  tabs: FilterTabItem[]
  active: string
  onChange: (id: string) => void
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export function FilterTabs({
  tabs,
  active,
  onChange,
  size = 'sm',
  className = '',
}: FilterTabsProps) {
  const pad = size === 'xs' ? 'px-2.5 py-1 text-xs' : size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {tabs.map((tab) => {
        const isSelected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 font-semibold rounded border transition-all cursor-pointer ${pad} ${
              isSelected
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
