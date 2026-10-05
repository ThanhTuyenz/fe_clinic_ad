'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { searchIcd10 } from '@/modules/admin/services/icd10'

export function formatIcdLabel(code: any, name: any) {
  const c = String(code || '').trim()
  const n = String(name || '').trim()
  if (c && n) return `${c} - ${n}`
  return c || n
}

export function parseIcdFromMedicalVisit(ex: any) {
  if (!ex || typeof ex !== 'object') return null
  const code = String(ex.diagnosisCode || ex.icdCode || '').trim()
  const name = String(ex.diagnosisName || '').trim()
  if (code && name) {
    return { code, name, label: formatIcdLabel(code, name) }
  }
  const raw = String(ex.diagnosis || '').trim()
  if (!raw) return null
  const m = raw.match(/^([A-TV-Z][0-9][0-9AB](?:\.[0-9A-Z]{1,4})?)\s*[-–—]\s*(.+)$/i)
  if (m) {
    return { code: m[1].toUpperCase(), name: m[2].trim(), label: raw }
  }
  if (code) return { code, name: name || raw, label: raw }
  return null
}

export default function IcdDiagnosisField({
  token,
  value,
  onChange,
  disabled = false,
  error = '',
  required = true,
}: {
  token?: string
  value?: any
  onChange: (val: any) => void
  disabled?: boolean
  error?: string
  required?: boolean
}) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (value?.code && value?.name) {
      setQuery(formatIcdLabel(value.code, value.name))
    } else if (!value) {
      setQuery('')
    }
  }, [value?.code, value?.name])

  useEffect(() => {
    if (!open || disabled) return undefined
    let cancelled = false
    const q = String(query || '').trim()
    if (q.length < 2) {
      setItems([])
      setLoading(false)
      setSearchErr('')
      setActiveIndex(-1)
      return undefined
    }

    const timer = setTimeout(() => {
      setLoading(true)
      setSearchErr('')
      void searchIcd10({ token, q, limit: q ? 25 : 40 })
        .then((rows) => {
          if (cancelled) return
          setItems(Array.isArray(rows) ? rows : [])
          setActiveIndex(-1)
        })
        .catch((e) => {
          if (cancelled) return
          setItems([])
          setSearchErr(e?.message || 'Không tải được ICD-10.')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, query, token, disabled])

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  function pickItem(item: any) {
    const code = String(item?.code || '').trim()
    const name = String(item?.name || item?.description || '').trim()
    if (!code || !name) return
    onChange({ code, name })
    setQuery(formatIcdLabel(code, name))
    setOpen(false)
    setSearchErr('')
    setActiveIndex(-1)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setQuery(next)
    setOpen(true)
    if (value) onChange(null)
  }

  function handleFocus() {
    if (!disabled) setOpen(true)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (!items.length) return
      setActiveIndex((current) => {
        const next = event.key === 'ArrowDown'
          ? (current + 1) % items.length
          : (current <= 0 ? items.length - 1 : current - 1)
        queueMicrotask(() => optionRefs.current[next]?.scrollIntoView({ block: 'nearest' }))
        return next
      })
      return
    }
    if (event.key === 'Enter' && open && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault()
      pickItem(items[activeIndex])
    }
  }

  const showList = open && !disabled

  return (
    <div className="block space-y-1.5">
      <label className="block text-xs font-bold text-slate-700">
        Chẩn đoán (ICD-10) {required ? <span className="text-rose-600">*</span> : null}
      </label>
      <div className="relative" ref={wrapRef}>
        <input
          className={`w-full ${value?.code ? 'pr-20' : 'pr-3.5'} pl-3.5 py-2 text-xs bg-white border rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
            error
              ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-600'
              : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
          }`}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Gõ mã hoặc tên (vd: K29, Viêm dạ dày)"
          autoComplete="off"
          aria-invalid={error ? 'true' : undefined}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
        />
        {value?.code ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded pointer-events-none" title="Đã chọn mã ICD-10">
            {value.code}
          </span>
        ) : null}
        {showList ? (
          <ul id={listId} className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg divide-y divide-slate-100 p-1" role="listbox">
            {loading ? <li className="px-3 py-2.5 text-xs text-slate-500 text-center">Đang tìm…</li> : null}
            {!loading && searchErr ? <li className="px-3 py-2.5 text-xs text-rose-600 text-center">{searchErr}</li> : null}
            {!loading && !searchErr && String(query || '').trim().length < 2 ? (
              <li className="px-3 py-2.5 text-xs text-slate-500 text-center">Nhập ít nhất 2 ký tự để tìm theo mã hoặc tên bệnh.</li>
            ) : null}
            {!loading && !searchErr && String(query || '').trim().length >= 2 && items.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-slate-500 text-center">
                Không tìm thấy mã ICD-10 phù hợp.
              </li>
            ) : null}
            {!loading
              ? items.map((it, index) => (
                  <li key={String(it.id || it.code)}>
                    <button
                      id={`${listId}-option-${index}`}
                      ref={(node) => { optionRefs.current[index] = node }}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        activeIndex === index
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickItem(it)}
                    >
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded shrink-0">{it.code}</span>
                      <span className="truncate flex-1">{it.name || it.description}</span>
                    </button>
                  </li>
                ))
              : null}
          </ul>
        ) : null}
      </div>
      {error ? (
        <span className="block text-[11px] font-medium text-rose-600 mt-1" role="alert">
          {error}
        </span>
      ) : (
        <span className="block text-[11px] text-slate-400 mt-1">Nhập ít nhất 2 ký tự, dùng mũi tên và Enter để chọn. Không chấp nhận nội dung gõ tay.</span>
      )}
    </div>
  )
}
