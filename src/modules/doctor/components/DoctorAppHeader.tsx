'use client'

import React, { useState } from 'react'
import { useNavigate } from '@/common/hooks/useNextNavigation'
import RoleSidebar from '@/modules/admin/components/RoleSidebar'
import { Menu, LogOut } from 'lucide-react'

function displayName(user: any) {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return full || String(user?.displayName || user?.fullName || '').trim() || user?.email || 'Bác sĩ'
}

interface DoctorAppHeaderProps {
  activeTab?: 'exam' | 'stats'
  user?: any
  onLogout?: () => void
  examBadge?: number
  onExamNavigate?: () => void
}

export default function DoctorAppHeader({
  activeTab = 'exam',
  user,
  onLogout,
  examBadge = 0,
  onExamNavigate,
}: DoctorAppHeaderProps) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const goExam = onExamNavigate ?? (() => navigate('/doctor'))

  return (
    <>
      <RoleSidebar
        role="doctor"
        active={activeTab === 'exam' ? 'exam' : 'dashboard'}
        user={user}
        onLogout={onLogout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <header className="h-14 bg-white/95 backdrop-blur border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-2xs lg:pl-[256px]">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer shrink-0"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2" role="banner" aria-label="VitaCare Clinic">
            <span
              className="w-6 h-6 rounded bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0"
              aria-hidden="true"
            >
              +
            </span>
            <span className="text-sm font-bold text-slate-900 tracking-tight hidden xs:inline-block sm:inline-block">
              VitaCare Clinic
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Điều hướng phân hệ">
          <button
            type="button"
            className={`relative px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exam'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
            onClick={activeTab === 'exam' ? undefined : goExam}
          >
            <span>Khám bệnh</span>
            {examBadge > 0 ? (
              <span
                className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500 text-white leading-none"
                aria-label={`${examBadge} ca chờ khám`}
              >
                {examBadge > 99 ? '99+' : examBadge}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className={`relative px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
            onClick={activeTab === 'stats' ? undefined : () => navigate('/dashboard')}
          >
            <span>Thống kê</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-slate-700 hidden md:inline-block truncate max-w-[150px]">
            {displayName(user)}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-rose-200 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
            onClick={onLogout}
            title="Đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline-block">Đăng xuất</span>
          </button>
        </div>
      </header>
    </>
  )
}

