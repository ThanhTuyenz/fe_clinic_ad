'use client'

import React from 'react'
import { Eye } from 'lucide-react'
import {
  AdminButton,
  AdminTableCard,
  AdminTable,
  AdminTableHead,
  AdminTableLoading,
  AdminTableEmpty,
  StatusBadge,
} from '@/common/components/ui'
import { SCHEDULE_TABLE_COLUMNS } from './scheduleUtils'

interface ScheduleTableViewProps {
  filteredSchedules: any[]
  loading: boolean
  isDoctor: boolean
  onCardClick: (shift: any) => void
  onOpenEdit: (shift: any) => void
  onToggleStatus: (shift: any) => void
  onRemove: (shift: any) => void
}

export default function ScheduleTableView({
  filteredSchedules,
  loading,
  isDoctor,
  onCardClick,
  onOpenEdit,
  onToggleStatus,
  onRemove,
}: ScheduleTableViewProps) {
  return (
    <AdminTableCard className="mt-4">
      <AdminTable minWidth="min-w-[950px]">
        <AdminTableHead columns={SCHEDULE_TABLE_COLUMNS} />
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <AdminTableLoading colSpan={8} message="Đang tải lịch…" />
          ) : filteredSchedules.length === 0 ? (
            <AdminTableEmpty colSpan={8} message="Chưa có ca trực nào." />
          ) : (
            filteredSchedules.map((row) => {
              const occupied = row.occupiedCount || 0
              const capacity = row.totalCapacity || row.slots?.length || 0
              const isFull = occupied >= capacity && capacity > 0

              return (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-900">
                    {row.doctor?.academicRank ? `${row.doctor.academicRank} ` : ''}
                    {row.doctor?.fullName || '—'}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    <p className="font-semibold text-slate-700">{row.branch?.name || 'Chi nhánh'}</p>
                    <p className="text-emerald-800">{row.room?.name || 'Chưa xếp phòng'}</p>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-800">{row.workDate}</td>
                  <td className="px-5 py-3 text-xs font-bold text-emerald-900">
                    {row.startTime} – {row.endTime}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        occupied === 0
                          ? 'bg-slate-100 text-slate-600'
                          : isFull
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {occupied}/{capacity} slot
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{row.slotDurationMin || 30} ph/ca</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <StatusBadge
                      status={row.status === 'OPEN' ? 'open' : 'closed'}
                      label={row.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                      tone={row.status === 'OPEN' ? 'emerald' : 'rose'}
                    />
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {isDoctor ? (
                      <AdminButton
                        variant="secondary"
                        size="xs"
                        icon={Eye}
                        onClick={() => onCardClick(row)}
                      >
                        Xem
                      </AdminButton>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <AdminButton variant="secondary" size="xs" onClick={() => onOpenEdit(row)}>
                          Sửa
                        </AdminButton>
                        <AdminButton
                          variant="outline"
                          size="xs"
                          className={
                            row.status === 'OPEN'
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }
                          onClick={() => void onToggleStatus(row)}
                        >
                          {row.status === 'OPEN' ? 'Đóng' : 'Mở'}
                        </AdminButton>
                        <AdminButton
                          variant="ghost"
                          size="xs"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => void onRemove(row)}
                        >
                          Xóa
                        </AdminButton>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </AdminTable>
    </AdminTableCard>
  )
}
