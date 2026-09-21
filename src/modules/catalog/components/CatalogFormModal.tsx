'use client'

import React from 'react'
import { Config, Field } from '../types/catalog.types'
import ImageUploader from './ImageUploader'
import PackageSymptomsField from './PackageSymptomsField'
import PackageSchedulesField from './PackageSchedulesField'

interface CatalogFormModalProps {
  modal: 'create' | 'edit' | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
  cfg: Config
  resource: string
  form: any
  setForm: React.Dispatch<React.SetStateAction<any>>
  options: Record<string, any[]>
  bookingMethodOptions: { code: string; name: string }[]
  fieldOptions: (source?: string) => any[]
  optionValue: (field: Field, option: any) => any
  generateCode: (resource: string) => string
  money: (val: unknown) => string
  readVietnameseCurrency: (val: unknown) => string
  symptomInput: string
  setSymptomInput: (val: string) => void
  aiSuggestedSymptoms: string[]
  setAiSuggestedSymptoms: React.Dispatch<React.SetStateAction<string[]>>
  loadingAiSymptoms: boolean
  onAiSuggest: () => void
  onAddSymptom: (text: string) => void
  onRemoveSymptom: (tag: string) => void
  onAddAllSuggested: () => void
}

export default function CatalogFormModal({
  modal,
  onClose,
  onSubmit,
  saving,
  cfg,
  resource,
  form,
  setForm,
  options,
  bookingMethodOptions,
  fieldOptions,
  optionValue,
  generateCode,
  money,
  readVietnameseCurrency,
  symptomInput,
  setSymptomInput,
  aiSuggestedSymptoms,
  setAiSuggestedSymptoms,
  loadingAiSymptoms,
  onAiSuggest,
  onAddSymptom,
  onRemoveSymptom,
  onAddAllSuggested,
}: CatalogFormModalProps) {
  if (!modal) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-xs">
      <form onSubmit={onSubmit} className="my-6 w-full max-w-4xl rounded bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/60">
          <strong className="text-slate-900 text-base">
            {modal === 'create' ? 'Thêm' : 'Cập nhật'} {cfg.singular}
          </strong>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1.5 py-0.5 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            ×
          </button>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2 max-h-[75vh] overflow-y-auto">
          {cfg.fields.map((field) => {
            const [key, label, type, source] = field
            const wide = type === 'textarea' || type === 'multiselect' || type === 'image'

            // Giao diện chọn nhiều cơ sở khi tạo mới hoặc cập nhật gói khám
            if (resource === 'service-packages' && key === 'branchId') {
              const branchList = options.branches || []
              return (
                <div key={key} className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600">Cơ sở y tế áp dụng</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-normal text-slate-600">
                      <input
                        type="checkbox"
                        checked={Boolean(form.applyAllBranches)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setForm({
                            ...form,
                            applyAllBranches: checked,
                            branchIds: checked ? branchList.map((b: any) => b.id) : [],
                          })
                        }}
                      />
                      Áp dụng cho tất cả cơ sở
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 rounded border p-2">
                    {branchList.map((branch: any) => {
                      const isChecked = form.applyAllBranches || (form.branchIds || []).includes(branch.id)
                      return (
                        <label
                          key={branch.id}
                          className="flex items-center gap-2 p-2 rounded text-xs font-normal hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={Boolean(form.applyAllBranches)}
                            onChange={() => {
                              const current = form.branchIds || []
                              const next = current.includes(branch.id)
                                ? current.filter((id: string) => id !== branch.id)
                                : [...current, branch.id]
                              setForm({ ...form, branchIds: next })
                            }}
                          />
                          <span className={isChecked ? 'font-medium text-slate-900' : 'text-slate-600'}>
                            {branch.name}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            }

            // Giao diện chọn nhiều hình thức đặt khám khi tạo mới hoặc cập nhật gói khám
            if (resource === 'service-packages' && key === 'branchBookingMethodId') {
              return (
                <div key={key} className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-600">Hình thức đặt khám áp dụng</span>
                    <span className="text-[11px] text-slate-400 font-normal">Có thể chọn nhiều hình thức</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 rounded border p-2">
                    {bookingMethodOptions.map((method) => {
                      const isChecked = (form.bookingMethodCodes || []).includes(method.code)
                      return (
                        <label
                          key={method.code}
                          className="flex items-center gap-2 p-2 rounded text-xs font-normal hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const current = form.bookingMethodCodes || []
                              const next = current.includes(method.code)
                                ? current.filter((c: string) => c !== method.code)
                                : [...current, method.code]
                              setForm({ ...form, bookingMethodCodes: next })
                            }}
                          />
                          <span className={isChecked ? 'font-medium text-slate-900' : 'text-slate-600'}>
                            {method.name}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            }

            return (
              <label key={key} className={`text-xs font-bold text-slate-600 ${wide ? 'sm:col-span-2' : ''}`}>
                {label}
                {type === 'textarea' ? (
                  <div className="mt-1.5 space-y-3">
                    <textarea
                      rows={3}
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder="Nhập nội dung mô tả, quyền lợi và hướng dẫn chuẩn bị..."
                      className="w-full rounded border px-3 py-2 text-sm font-normal"
                    />

                    {/* COMPONENT TAGS TRIỆU CHỨNG LÂM SÀNG CHO GÓI KHÁM & CHUYÊN KHOA */}
                    {['service-packages', 'specialties'].includes(resource) && key === 'description' && (
                      <PackageSymptomsField
                        form={form}
                        setForm={setForm}
                        symptomInput={symptomInput}
                        setSymptomInput={setSymptomInput}
                        aiSuggestedSymptoms={aiSuggestedSymptoms}
                        setAiSuggestedSymptoms={setAiSuggestedSymptoms}
                        loadingAiSymptoms={loadingAiSymptoms}
                        onAiSuggest={onAiSuggest}
                        onAddSymptom={onAddSymptom}
                        onRemoveSymptom={onRemoveSymptom}
                        onAddAllSuggested={onAddAllSuggested}
                      />
                    )}
                  </div>
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
                    className="mt-1.5 w-full rounded border bg-white px-3 py-2.5 text-sm font-normal"
                  >
                    <option value="">Chọn {label.toLowerCase()}</option>
                    {fieldOptions(source).map((option) => (
                      <option key={option.id} value={optionValue(field, option)}>
                        {source === 'booking-methods' ? option.displayName : option.name}
                      </option>
                    ))}
                  </select>
                ) : type === 'image' ? (
                  <div className="mt-1.5">
                    <ImageUploader
                      label=""
                      value={form[key] || ''}
                      onChange={(url) => setForm({ ...form, [key]: url })}
                      aspectRatio={key === 'iconUrl' ? 'square' : 'wide'}
                    />
                  </div>
                ) : type === 'multiselect' ? (
                  <div className="mt-1.5 grid max-h-48 gap-1 overflow-y-auto rounded border p-2 sm:grid-cols-2">
                    {fieldOptions(source).map((option) => {
                      const checked = (form[key] || []).includes(String(option.id))
                      return (
                        <label key={option.id} className="flex items-center gap-2 rounded p-2 text-xs font-normal hover:bg-slate-50 cursor-pointer">
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
                      className="w-full rounded border px-3 py-2.5 text-sm font-normal uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, code: generateCode(resource) })}
                      className="whitespace-nowrap rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      title="Tự động tạo mã mới"
                    >
                      ⚡ Tạo mã
                    </button>
                  </div>
                ) : (
                  <input
                    type={type}
                    value={form[key] === 0 && modal === 'create' ? '' : (form[key] ?? '')}
                    placeholder={type === 'number' ? '0' : ''}
                    onFocus={(e) => {
                      if (type === 'number') {
                        e.target.select()
                      }
                    }}
                    onChange={(e) => {
                      if (type === 'number') {
                        const raw = e.target.value
                        if (raw === '') {
                          setForm({ ...form, [key]: '' })
                        } else {
                          const cleaned = raw.replace(/^0+(?=\d)/, '')
                          setForm({ ...form, [key]: cleaned === '' ? 0 : Number(cleaned) })
                        }
                      } else {
                        setForm({ ...form, [key]: e.target.value })
                      }
                    }}
                    className="mt-1.5 w-full rounded border px-3 py-2.5 text-sm font-normal"
                  />
                )}
                {['price', 'unitPrice'].includes(key) && Number(form[key]) > 0 && (
                  <p className="mt-1 text-[11px] font-medium text-emerald-700 leading-normal">
                    <span className="font-semibold">{money(form[key])}</span>
                    {readVietnameseCurrency(form[key]) && (
                      <span className="text-slate-500 font-normal"> — {readVietnameseCurrency(form[key])}</span>
                    )}
                  </p>
                )}
              </label>
            )
          })}

          {resource === 'rooms' && (
            <label className="flex items-center gap-2 text-sm font-normal text-slate-700 sm:col-span-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Đang sử dụng
            </label>
          )}

          {resource === 'service-packages' && (
            <PackageSchedulesField form={form} setForm={setForm} />
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Hủy
          </button>
          <button
            disabled={saving}
            className="rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Đang lưu…' : 'Lưu dữ liệu'}
          </button>
        </footer>
      </form>
    </div>
  )
}
