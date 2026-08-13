'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createCatalog, deleteCatalog, listCatalog, updateCatalog } from '../services/systemCatalog'

type Field = [string, string, 'text' | 'date' | 'number' | 'textarea' | 'select' | 'multiselect', string?]
type Config = { title: string; singular: string; fields: Field[]; columns: [string, string][] }

const CONFIG: Record<string, Config> = {
  branches: {
    title: 'Chi nhánh phòng khám',
    singular: 'chi nhánh',
    fields: [
      ['code', 'Mã chi nhánh', 'text'],
      ['name', 'Tên chi nhánh', 'text'],
      ['address', 'Địa chỉ', 'text'],
      ['phoneNumber', 'Hotline', 'text'],
      ['timezone', 'Múi giờ', 'text'],
    ],
    columns: [
      ['code', 'Mã'],
      ['name', 'Tên chi nhánh'],
      ['address', 'Địa chỉ'],
      ['phoneNumber', 'Hotline'],
    ],
  },
  specialties: {
    title: 'Quản lý chuyên khoa',
    singular: 'chuyên khoa',
    fields: [
      ['name', 'Tên chuyên khoa', 'text'],
      ['departmentId', 'Mã khoa/phòng ban', 'number'],
      ['description', 'Mô tả', 'textarea'],
    ],
    columns: [
      ['id', 'ID'],
      ['name', 'Chuyên khoa'],
      ['departmentId', 'Khoa/phòng ban'],
      ['description', 'Mô tả'],
    ],
  },
  'branch-specialties': {
    title: 'Chuyên khoa theo cơ sở',
    singular: 'chuyên khoa tại cơ sở',
    fields: [
      ['branchId', 'Cơ sở y tế', 'select', 'branches'],
      ['specialtyId', 'Chuyên khoa', 'select', 'specialties'],
    ],
    columns: [
      ['branch.name', 'Cơ sở'],
      ['specialty.department.name', 'Khoa chính'],
      ['specialty.name', 'Chuyên khoa'],
    ],
  },
  'room-specialties': {
    title: 'Phòng khám theo chuyên khoa',
    singular: 'phòng khám chuyên khoa',
    fields: [
      ['roomId', 'Phòng khám', 'select', 'rooms'],
      ['specialtyId', 'Chuyên khoa', 'select', 'specialties'],
      ['priority', 'Mức ưu tiên', 'number'],
    ],
    columns: [
      ['room.branch.name', 'Cơ sở'],
      ['room.name', 'Phòng khám'],
      ['specialty.department.name', 'Khoa chính'],
      ['specialty.name', 'Chuyên khoa'],
      ['priority', 'Ưu tiên'],
    ],
  },
  services: {
    title: 'Dịch vụ cận lâm sàng',
    singular: 'dịch vụ',
    fields: [
      ['code', 'Mã dịch vụ', 'text'],
      ['name', 'Tên dịch vụ', 'text'],
      ['departmentId', 'Mã khoa/phòng ban', 'number'],
      ['price', 'Đơn giá', 'number'],
      ['durationMin', 'Thời lượng (phút)', 'number'],
      ['description', 'Mô tả', 'textarea'],
    ],
    columns: [
      ['code', 'Mã'],
      ['name', 'Dịch vụ'],
      ['price', 'Đơn giá'],
      ['durationMin', 'Thời lượng'],
    ],
  },
  medicines: {
    title: 'Danh mục Thuốc & Vật tư',
    singular: 'thuốc/vật tư',
    fields: [
      ['code', 'Mã thuốc', 'text'],
      ['name', 'Tên thuốc/vật tư', 'text'],
      ['activeIngredient', 'Hoạt chất', 'text'],
      ['strength', 'Hàm lượng', 'text'],
      ['unit', 'Đơn vị tính', 'text'],
      ['unitPrice', 'Đơn giá', 'number'],
      ['stockQuantity', 'Tồn kho', 'number'],
    ],
    columns: [
      ['code', 'Mã'],
      ['name', 'Tên thuốc'],
      ['activeIngredient', 'Hoạt chất'],
      ['unit', 'ĐVT'],
      ['unitPrice', 'Đơn giá'],
      ['stockQuantity', 'Tồn kho'],
    ],
  },
  'service-packages': {
    title: 'Gói dịch vụ khám',
    singular: 'gói dịch vụ',
    fields: [
      ['name', 'Tên gói', 'text'],
      ['branchId', 'Chi nhánh', 'select', 'branches'],
      ['branchBookingMethodId', 'Hình thức đặt khám', 'select', 'booking-methods'],
      ['specialtyId', 'Chuyên khoa (không bắt buộc)', 'select', 'specialties'],
      ['price', 'Giá gói', 'number'],
      ['durationMin', 'Thời lượng (phút)', 'number'],
      ['medicalServiceIds', 'Dịch vụ thành phần', 'multiselect', 'services'],
      ['description', 'Mô tả', 'textarea'],
    ],
    columns: [
      ['code', 'Mã'],
      ['name', 'Gói dịch vụ'],
      ['branchBookingMethod.bookingMethod.name', 'Hình thức'],
      ['specialty.name', 'Chuyên khoa'],
      ['branchBookingMethod.branch.name', 'Chi nhánh'],
      ['schedules', 'Lịch hoạt động'],
      ['price', 'Giá gói'],
    ],
  },
}

const EMPTY_SLOT = { startTime: '08:00', endTime: '11:30', capacity: 20 }
const EMPTY = {
  isActive: true,
  timezone: 'Asia/Ho_Chi_Minh',
  durationMin: 30,
  price: 0,
  unitPrice: 0,
  stockQuantity: 0,
  medicalServiceIds: [] as string[],
  schedules: [] as any[],
}

const money = (value: unknown) => `${Number(value || 0).toLocaleString('vi-VN')} đ`
const at = (row: any, key: string) => key.split('.').reduce((value, part) => value?.[part], row)
const timeValue = (value: unknown) => {
  const text = String(value || '')
  return text.includes('T') ? text.slice(11, 16) : text.slice(0, 5)
}

const generateCode = (resource: string) => {
  const prefixMap: Record<string, string> = {
    'service-packages': 'PKG',
    services: 'SVC',
    branches: 'BRC',
    medicines: 'MED',
  }
  const prefix = prefixMap[resource] || 'CAT'
  const year = new Date().getFullYear()
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${randomNum}`
}

export default function SystemCatalogCrudPage({ resource }: { resource: keyof typeof CONFIG }) {
  const cfg = CONFIG[resource]
  const [rows, setRows] = useState<any[]>([])
  const [options, setOptions] = useState<Record<string, any[]>>({})
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await listCatalog(resource))
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được dữ liệu.')
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const resources = [
      ...new Set([
        ...cfg.fields.map((field) => field[3]).filter(Boolean),
        ...(resource === 'service-packages' ? ['rooms'] : []),
      ]),
    ] as string[]
    Promise.all(resources.map(async (name) => [name, await listCatalog(name)] as const))
      .then((entries) => setOptions(Object.fromEntries(entries)))
      .catch(() => undefined)
  }, [cfg, resource])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term
      ? rows.filter((row) => `${row.code || ''} ${row.name || ''}`.toLowerCase().includes(term))
      : rows
  }, [q, rows])

  const openCreate = () => {
    setSelected(null)
    const autoCode = ['service-packages', 'services', 'branches', 'medicines'].includes(resource)
      ? generateCode(resource)
      : ''
    setForm({ ...EMPTY, code: autoCode, medicalServiceIds: [], schedules: [] })
    setError('')
    setModal('create')
  }

  const openEdit = (row: any) => {
    setSelected(row)
    setForm({
      ...EMPTY,
      ...row,
      branchId: row.branchBookingMethod?.branchId || row.branchBookingMethod?.branch?.id || '',
      branchBookingMethodId: row.branchBookingMethodId || row.branchBookingMethod?.id || '',
      schedules: (row.schedules || []).map((schedule: any) => ({
        examDate: schedule.examDate?.slice(0, 10) || '',
        roomId: schedule.roomId || schedule.room?.id || '',
        slots: (schedule.slots || []).map((slot: any) => ({
          startTime: timeValue(slot.startTime),
          endTime: timeValue(slot.endTime),
          capacity: slot.capacity || 20,
        })),
      })),
      medicalServiceIds: row.items?.map((item: any) => item.medicalServiceId) || [],
    })
    setModal('edit')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!['branch-specialties', 'room-specialties'].includes(resource) && !String(form.name || '').trim()) {
      return setError('Tên không được để trống.')
    }
    const payload = { ...form }
    if (!payload.code && ['service-packages', 'services', 'branches', 'medicines'].includes(resource)) {
      payload.code = generateCode(resource)
    }
    if (!['specialties', 'branch-specialties', 'room-specialties'].includes(resource) && !String(payload.code || '').trim()) {
      return setError('Mã không được để trống.')
    }
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') await createCatalog(resource, payload)
      else await updateCatalog(resource, selected.id, payload)
      setModal(null)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không lưu được dữ liệu.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: any) {
    if (!confirm(`Ngừng sử dụng ${cfg.singular} “${row.name}”?`)) return
    try {
      await deleteCatalog(resource, row.id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không cập nhật được dữ liệu.')
    }
  }

  const display = (key: string, value: any) =>
    key === 'items'
      ? `${value?.length || 0} dịch vụ`
      : key === 'schedules'
      ? `${value?.length || 0} ngày / ${
          value?.reduce((total: number, item: any) => total + (item.slots?.length || 0), 0) || 0
        } khung giờ`
      : key.endsWith('examDate') && value
      ? new Date(value).toLocaleDateString('vi-VN')
      : ['price', 'unitPrice'].includes(key)
      ? money(value)
      : key === 'durationMin'
      ? `${value || 0} phút`
      : value ?? '—'

  const optionValue = (field: Field, option: any) => (field[3] === 'specialties' ? String(option.id) : option.id)

  const fieldOptions = (source?: string) => {
    const raw = options[source || ''] || []
    if (source === 'booking-methods') {
      if (form.branchId) {
        return raw.filter((option: any) => option.branchId === form.branchId)
      }
      return raw.map((option: any) => ({
        ...option,
        displayName: option.branch?.name ? `${option.displayName} (${option.branch.name})` : option.displayName,
      }))
    }
    return raw
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.13em] text-emerald-700">Quản lý danh mục & Cơ sở</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{cfg.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý {cfg.singular} và trạng thái áp dụng.</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">
          + Thêm {cfg.singular}
        </button>
      </div>

      {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="mt-5 rounded-lg border border-slate-200 bg-white">
        <div className="flex gap-2 border-b p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
            placeholder={`Tìm ${cfg.singular}...`}
          />
          <button onClick={() => void load()} className="rounded-md border px-3 text-xs font-bold">
            Làm mới
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                {cfg.columns.map(([key, label]) => (
                  <th key={key} className="px-5 py-3">
                    {label}
                  </th>
                ))}
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
                  <tr key={row.id} className="border-t">
                    {cfg.columns.map(([key]) => (
                      <td
                        key={key}
                        className={key === 'name' ? 'max-w-xs px-5 py-3 font-bold text-slate-900' : 'max-w-xs px-5 py-3 text-slate-600'}
                      >
                        {display(key, at(row, key))}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button onClick={() => openEdit(row)} className="mr-2 rounded border px-3 py-1.5 text-xs">
                        Sửa
                      </button>
                      <button onClick={() => void remove(row)} className="rounded border border-rose-200 px-3 py-1.5 text-xs text-rose-700">
                        Ngừng dùng
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t px-5 py-3 text-xs text-slate-400">Tổng cộng {filtered.length} bản ghi</footer>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4">
          <form onSubmit={submit} className="my-6 w-full max-w-4xl rounded-lg bg-white shadow-2xl">
            <header className="flex justify-between border-b px-5 py-4">
              <b>
                {modal === 'create' ? 'Thêm' : 'Cập nhật'} {cfg.singular}
              </b>
              <button type="button" onClick={() => setModal(null)}>
                ×
              </button>
            </header>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {cfg.fields.map((field) => {
                const [key, label, type, source] = field
                const wide = type === 'textarea' || type === 'multiselect'
                return (
                  <label key={key} className={`text-xs font-bold text-slate-600 ${wide ? 'sm:col-span-2' : ''}`}>
                    {label}
                    {type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={form[key] || ''}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="mt-1.5 w-full rounded-md border px-3 py-2 text-sm font-normal"
                      />
                    ) : type === 'select' ? (
                      <select
                        value={form[key] ?? ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [key]: source === 'specialties' ? Number(e.target.value) : e.target.value,
                            ...(key === 'branchId' ? { branchBookingMethodId: '' } : {}),
                          })
                        }
                        className="mt-1.5 w-full rounded-md border bg-white px-3 py-2.5 text-sm font-normal"
                      >
                        <option value="">Chọn {label.toLowerCase()}</option>
                        {fieldOptions(source).map((option) => (
                          <option key={option.id} value={optionValue(field, option)}>
                            {source === 'booking-methods' ? option.displayName : option.name}
                          </option>
                        ))}
                      </select>
                    ) : type === 'multiselect' ? (
                      <div className="mt-1.5 grid max-h-48 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
                        {fieldOptions(source).map((option) => {
                          const checked = (form[key] || []).includes(String(option.id))
                          return (
                            <label key={option.id} className="flex items-center gap-2 rounded p-2 text-xs font-normal hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setForm({
                                    ...form,
                                    [key]: checked
                                      ? form[key].filter((id: string) => id !== String(option.id))
                                      : [...(form[key] || []), String(option.id)],
                                  })
                                }
                              />
                              {option.name}
                            </label>
                          )
                        })}
                      </div>
                    ) : key === 'code' ? (
                      <div className="mt-1.5 flex gap-2">
                        <input
                          type="text"
                          value={form[key] ?? ''}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          placeholder="Mã tự động..."
                          className="w-full rounded-md border px-3 py-2.5 text-sm font-normal uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, code: generateCode(resource) })}
                          className="whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          title="Tự động tạo mã mới"
                        >
                          ⚡ Tạo mã
                        </button>
                      </div>
                    ) : (
                      <input
                        type={type}
                        value={form[key] ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })
                        }
                        className="mt-1.5 w-full rounded-md border px-3 py-2.5 text-sm font-normal"
                      />
                    )}
                  </label>
                )
              })}

              {resource === 'service-packages' && (
                <section className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Ngày và khung giờ hoạt động</h3>
                      <p className="mt-1 text-xs font-normal text-slate-500">Mỗi ngày có thể cấu hình nhiều khung giờ và sức chứa riêng.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          schedules: [...(form.schedules || []), { examDate: '', roomId: '', slots: [{ ...EMPTY_SLOT }] }],
                        })
                      }
                      className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                    >
                      + Thêm ngày
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {(form.schedules || []).map((schedule: any, scheduleIndex: number) => (
                      <article key={scheduleIndex} className="rounded-md border bg-white p-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <label className="text-xs font-bold">
                            Ngày hoạt động
                            <input
                              type="date"
                              value={schedule.examDate || ''}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  schedules: form.schedules.map((item: any, index: number) =>
                                    index === scheduleIndex ? { ...item, examDate: e.target.value } : item
                                  ),
                                })
                              }
                              className="mt-1.5 w-full rounded-md border px-3 py-2 font-normal"
                            />
                          </label>

                          <label className="text-xs font-bold">
                            Phòng khám
                            <select
                              value={schedule.roomId || ''}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  schedules: form.schedules.map((item: any, index: number) =>
                                    index === scheduleIndex ? { ...item, roomId: e.target.value } : item
                                  ),
                                })
                              }
                              className="mt-1.5 w-full rounded-md border bg-white px-3 py-2 font-normal"
                            >
                              <option value="">Chọn phòng</option>
                              {(options.rooms || [])
                                .filter((room: any) => !form.branchId || room.branchId === form.branchId)
                                .map((room: any) => (
                                  <option key={room.id} value={room.id}>
                                    {room.name}
                                  </option>
                                ))}
                            </select>
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                schedules: form.schedules.filter((_: any, index: number) => index !== scheduleIndex),
                              })
                            }
                            className="self-end rounded-md border border-rose-200 px-3 py-2 text-xs text-rose-700"
                          >
                            Xóa ngày
                          </button>
                        </div>

                        <div className="mt-4 space-y-2">
                          {(schedule.slots || []).map((slot: any, slotIndex: number) => (
                            <div key={slotIndex} className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                              <label className="text-[11px] font-bold">
                                Bắt đầu
                                <input
                                  type="time"
                                  value={slot.startTime || ''}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      schedules: form.schedules.map((item: any, index: number) =>
                                        index === scheduleIndex
                                          ? {
                                              ...item,
                                              slots: item.slots.map((value: any, i: number) =>
                                                i === slotIndex ? { ...value, startTime: e.target.value } : value
                                              ),
                                            }
                                          : item
                                      ),
                                    })
                                  }
                                  className="mt-1 w-full rounded border px-2 py-1.5 font-normal"
                                />
                              </label>

                              <label className="text-[11px] font-bold">
                                Kết thúc
                                <input
                                  type="time"
                                  value={slot.endTime || ''}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      schedules: form.schedules.map((item: any, index: number) =>
                                        index === scheduleIndex
                                          ? {
                                              ...item,
                                              slots: item.slots.map((value: any, i: number) =>
                                                i === slotIndex ? { ...value, endTime: e.target.value } : value
                                              ),
                                            }
                                          : item
                                      ),
                                    })
                                  }
                                  className="mt-1 w-full rounded border px-2 py-1.5 font-normal"
                                />
                              </label>

                              <label className="text-[11px] font-bold">
                                Sức chứa
                                <input
                                  type="number"
                                  min={1}
                                  value={slot.capacity || 20}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      schedules: form.schedules.map((item: any, index: number) =>
                                        index === scheduleIndex
                                          ? {
                                              ...item,
                                              slots: item.slots.map((value: any, i: number) =>
                                                i === slotIndex ? { ...value, capacity: Number(e.target.value) } : value
                                              ),
                                            }
                                          : item
                                      ),
                                    })
                                  }
                                  className="mt-1 w-full rounded border px-2 py-1.5 font-normal"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    schedules: form.schedules.map((item: any, index: number) =>
                                      index === scheduleIndex
                                        ? { ...item, slots: item.slots.filter((_: any, i: number) => i !== slotIndex) }
                                        : item
                                    ),
                                  })
                                }
                                className="self-end rounded border px-2 py-1.5 text-xs text-rose-600"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                schedules: form.schedules.map((item: any, index: number) =>
                                  index === scheduleIndex ? { ...item, slots: [...(item.slots || []), { ...EMPTY_SLOT }] } : item
                                ),
                              })
                            }
                            className="mt-2 text-xs font-bold text-emerald-700"
                          >
                            + Thêm khung giờ
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  {!(form.schedules || []).length && (
                    <p className="mt-4 rounded-md border border-dashed bg-white p-6 text-center text-xs text-slate-500">
                      Chưa có ngày hoạt động.
                    </p>
                  )}
                </section>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t px-5 py-4">
              <button type="button" onClick={() => setModal(null)} className="rounded border px-4 py-2 text-sm">
                Hủy
              </button>
              <button disabled={saving} className="rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white">
                {saving ? 'Đang lưu…' : 'Lưu dữ liệu'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </>
  )
}
