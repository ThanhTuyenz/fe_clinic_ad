'use client'

import React from 'react'
import { Config, SESSION_LABELS, at, formatDaysOfWeek, money } from '../types/catalog.types'

interface CatalogDetailModalProps {
  detailItem: any | null
  cfg: Config
  resource: string
  onClose: () => void
  onEdit: (item: any) => void
  display: (key: string, value: any) => React.ReactNode
}

export default function CatalogDetailModal({
  detailItem,
  cfg,
  resource,
  onClose,
  onEdit,
  display,
}: CatalogDetailModalProps) {
  if (!detailItem) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="my-6 w-full max-w-2xl rounded bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-800 text-sm">
              Chi tiết {cfg.singular.toLowerCase()}
            </span>
            <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {detailItem.code || detailItem.id}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            ×
          </button>
        </header>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {resource === 'service-packages' ? (
            <>
              {/* Name & Specialty */}
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{detailItem.name}</h3>
                {detailItem.specialty?.name && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Chuyên khoa: <span className="font-medium text-slate-700">{detailItem.specialty.name}</span>
                  </p>
                )}
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Giá niêm yết</span>
                  <span className="font-bold text-emerald-700 text-sm">{money(detailItem.price)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thời lượng khám</span>
                  <span className="font-medium text-slate-700">
                    {detailItem.durationMin || detailItem.durationMinutes
                      ? `${detailItem.durationMin || detailItem.durationMinutes} phút`
                      : '30 phút'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phòng khám</span>
                  <span className="font-medium text-slate-700">{detailItem.room?.name || 'Mặc định'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng thái</span>
                  <span
                    className={`font-medium ${
                      detailItem.isActive !== false ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {detailItem.isActive !== false ? 'Đang hoạt động' : 'Tạm ngừng'}
                  </span>
                </div>
              </div>

              {/* Operational Details */}
              <div className="space-y-3 text-xs pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Ngày khám trong tuần</span>
                    <span className="text-slate-600">{formatDaysOfWeek(detailItem.activeDaysOfWeek)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Ca trực tiếp nhận</span>
                    <span className="text-slate-600">
                      {SESSION_LABELS[detailItem.sessionType || 'ALL_DAY'] || 'Cả ngày & Ngoài giờ'}
                    </span>
                  </div>
                </div>

                {(() => {
                  const branchNames: string[] = [
                    ...new Set([
                      ...(detailItem.branchBookingMethods?.map(
                        (l: any) => l.branchBookingMethod?.branch?.name
                      ) || []),
                      detailItem.branchBookingMethod?.branch?.name,
                    ].filter(Boolean)),
                  ] as string[]
                  const methodNames: string[] = [
                    ...new Set([
                      ...(detailItem.branchBookingMethods?.map(
                        (l: any) => l.branchBookingMethod?.bookingMethod?.name
                      ) || []),
                      detailItem.branchBookingMethod?.bookingMethod?.name,
                    ].filter(Boolean)),
                  ] as string[]
                  return (
                    <>
                      <div className="border-t border-slate-100 pt-3">
                        <span className="font-semibold text-slate-700 block mb-1.5">
                          Cơ sở y tế triển khai ({branchNames.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {branchNames.length > 0 ? (
                            branchNames.map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <span className="font-semibold text-slate-700 block mb-1.5">
                          Hình thức đặt khám áp dụng ({methodNames.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {methodNames.length > 0 ? (
                            methodNames.map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}

                {detailItem.description && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-semibold text-slate-700 block mb-1">Mô tả & Hướng dẫn chuẩn bị</span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                      {detailItem.description}
                    </p>
                  </div>
                )}

                {Array.isArray(detailItem.items) && detailItem.items.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="font-semibold text-slate-700 block mb-1.5">
                      Dịch vụ y tế đi kèm ({detailItem.items.length})
                    </span>
                    <div className="divide-y divide-slate-100 max-h-32 overflow-y-auto">
                      {detailItem.items.map((it: any, idx: number) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between text-xs text-slate-600">
                          <span>{it.medicalService?.name || it.medicalServiceName || it.medicalServiceId}</span>
                          {it.quantity && <span className="text-slate-400">x{it.quantity}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Generic detail fallback */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              {cfg.columns.map(([key, label]) => (
                <div key={key}>
                  <span className="text-slate-400 block text-[11px] mb-0.5">{label}</span>
                  <span className="font-medium text-slate-800">{display(key, at(detailItem, key))}</span>
                </div>
              ))}
              {detailItem.description && (
                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Mô tả</span>
                  <p className="text-slate-600 whitespace-pre-line">{detailItem.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              const item = detailItem
              onClose()
              onEdit(item)
            }}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            Chỉnh sửa
          </button>
        </footer>
      </div>
    </div>
  )
}
