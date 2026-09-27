'use client'

import React from 'react'
import { Config, SESSION_LABELS, at, formatDaysOfWeek, money } from '../types/catalog.types'

interface CatalogTableProps {
  resource: string
  cfg: Config
  filtered: any[]
  loading: boolean
  q: string
  setQ: (q: string) => void
  filterBranchId: string
  setFilterBranchId: (id: string) => void
  filterMethodCode: string
  setFilterMethodCode: (c: string) => void
  filterSessionType: string
  setFilterSessionType: (s: string) => void
  options: Record<string, any[]>
  bookingMethodOptions: { code: string; name: string }[]
  sortKey: string
  setSortKey: (k: string) => void
  sortDir: 'asc' | 'desc'
  setSortDir: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>
  syncingVectors: boolean
  onSyncVectors: () => void
  onRefresh: () => void
  onDetail: (row: any) => void
  onEdit: (row: any) => void
  onRemove: (row: any) => void
  display: (key: string, value: any) => React.ReactNode
}

export default function CatalogTable({
  resource,
  cfg,
  filtered,
  loading,
  q,
  setQ,
  filterBranchId,
  setFilterBranchId,
  filterMethodCode,
  setFilterMethodCode,
  filterSessionType,
  setFilterSessionType,
  options,
  bookingMethodOptions,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
  syncingVectors,
  onSyncVectors,
  onRefresh,
  onDetail,
  onEdit,
  onRemove,
  display,
}: CatalogTableProps) {
  return (
    <section className="mt-5 rounded border border-slate-200 bg-white">
      {resource === 'service-packages' ? (
        <div className="border-b p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Tìm kiếm tên hoặc mã gói khám..."
              />
            </div>

            <select
              value={filterBranchId}
              onChange={(e) => setFilterBranchId(e.target.value)}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="">Tất cả cơ sở</option>
              {(options.branches || []).map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={filterMethodCode}
              onChange={(e) => setFilterMethodCode(e.target.value)}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="">Tất cả hình thức</option>
              {bookingMethodOptions.map((m: any) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={filterSessionType}
              onChange={(e) => setFilterSessionType(e.target.value)}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="">Tất cả buổi tiếp nhận</option>
              <option value="MORNING">Buổi sáng (07:30 - 11:30)</option>
              <option value="AFTERNOON">Buổi chiều (13:30 - 17:00)</option>
              <option value="EVENING">Ngoài giờ (17:00 - 20:30)</option>
              <option value="OFFICE_HOURS">Giờ hành chính (07:30 - 17:00)</option>
              <option value="ALL_DAY">Cả ngày & Ngoài giờ</option>
            </select>

            {(filterBranchId || filterMethodCode || filterSessionType || q) && (
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  setFilterBranchId('')
                  setFilterMethodCode('')
                  setFilterSessionType('')
                }}
                className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Xóa lọc
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Làm mới
            </button>

            <button
              type="button"
              disabled={syncingVectors}
              onClick={onSyncVectors}
              className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
              title="Đồng bộ Vector Embedding cho toàn bộ gói khám vào Redis qua RabbitMQ"
            >
              {syncingVectors ? 'Đang gửi task…' : '⚡ Đồng bộ Vector AI'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 border-b p-4">
          {resource === 'rooms' && (
            <select
              value={filterBranchId}
              onChange={(e) => setFilterBranchId(e.target.value)}
              className="w-full max-w-xs rounded border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tất cả chi nhánh</option>
              {(options.branches || []).map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full max-w-md rounded border px-3 py-2 text-sm"
            placeholder={`Tìm ${cfg.singular}...`}
          />
          <button
            onClick={onRefresh}
            className="rounded border px-3 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Làm mới
          </button>
        </div>
      )}

      <div className="overflow-x-auto [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
        {resource === 'service-packages' ? (
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-[36%]">Gói dịch vụ & Mã</th>
                <th className="px-5 py-3 w-[26%]">Cơ sở & Hình thức</th>
                <th className="px-5 py-3 w-[18%]">Thời gian tiếp nhận</th>
                <th className="px-5 py-3 w-[10%]">Giá gói</th>
                <th className="px-5 py-3 w-[10%] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    Đang tải dữ liệu…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    Chưa có gói dịch vụ nào.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 align-top">
                      <div className="font-semibold text-slate-900 text-xs">{row.name}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                          {row.code}
                        </span>
                        {row.specialty?.name && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {row.specialty.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      {(() => {
                        const branchNames: string[] = [
                          ...new Set([
                            ...(row.branchBookingMethods?.map(
                              (l: any) => l.branchBookingMethod?.branch?.name
                            ) || []),
                            row.branchBookingMethod?.branch?.name,
                          ].filter(Boolean)),
                        ] as string[]
                        const methodNames: string[] = [
                          ...new Set([
                            ...(row.branchBookingMethods?.map(
                              (l: any) => l.branchBookingMethod?.bookingMethod?.name
                            ) || []),
                            row.branchBookingMethod?.bookingMethod?.name,
                          ].filter(Boolean)),
                        ] as string[]
                        return (
                          <>
                            <div className="flex flex-wrap gap-1">
                              {branchNames.length > 0 ? (
                                branchNames.map((name) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-800"
                                  >
                                    {name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {methodNames.length > 0 ? (
                                methodNames.map((name) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200/60"
                                  >
                                    {name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </td>
                    <td className="px-5 py-3.5 align-top">
                      <div className="font-medium text-slate-800 text-xs">
                        {formatDaysOfWeek(row.activeDaysOfWeek)}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {SESSION_LABELS[row.sessionType || 'ALL_DAY'] || 'Cả ngày & Ngoài giờ'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 align-top whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-sm">{money(row.price)}</span>
                    </td>
                    <td className="px-5 py-3.5 align-top whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => onDetail(row)}
                        className="mr-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="mr-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(row)}
                        className="rounded border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 cursor-pointer"
                      >
                        Ngừng dùng
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                {cfg.columns.map(([key, label]) => {
                  const isSorted = sortKey === key
                  return (
                    <th
                      key={key}
                      onClick={() => {
                        if (sortKey === key) {
                          setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                        } else {
                          setSortKey(key)
                          setSortDir('asc')
                        }
                      }}
                      className="px-5 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      title={`Bấm để sắp xếp theo ${label}`}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <span>{label}</span>
                        <span
                          className={`text-[10px] ${
                            isSorted ? 'text-emerald-700 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                  )
                })}
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={cfg.columns.length + 1} className="px-5 py-16 text-center text-slate-400">
                    Đang tải dữ liệu…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={cfg.columns.length + 1} className="px-5 py-16 text-center text-slate-400">
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-slate-50/70 transition">
                    {cfg.columns.map(([key]) => (
                      <td
                        key={key}
                        className={
                          key === 'name'
                            ? 'max-w-xs px-5 py-3 font-semibold text-slate-900 text-xs'
                            : 'max-w-xs px-5 py-3 text-slate-600 text-xs'
                        }
                      >
                        {display(key, at(row, key))}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDetail(row)}
                        className="mr-2 rounded border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => onEdit(row)}
                        className="mr-2 rounded border px-3 py-1.5 text-xs cursor-pointer hover:bg-slate-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => onRemove(row)}
                        className="rounded border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        Ngừng dùng
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <footer className="border-t px-5 py-3 text-xs text-slate-400">Tổng cộng {filtered.length} bản ghi</footer>
    </section>
  )
}
