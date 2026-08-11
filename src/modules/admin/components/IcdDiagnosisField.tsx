'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { searchIcd10 } from '../services/icd10'

export function formatIcdLabel(code, name) {
  const c = String(code || '').trim()
  const n = String(name || '').trim()
  if (c && n) return `${c} - ${n}`
  return c || n
}

/** @param {{ code: string, name: string } | null} value */
export function parseIcdFromMedicalVisit(ex) {
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
}) {
  const listId = useId()
  const wrapRef = useRef(null)
  const optionRefs = useRef([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
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
    function onDocDown(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  function pickItem(item) {
    const code = String(item?.code || '').trim()
    const name = String(item?.name || item?.description || '').trim()
    if (!code || !name) return
    onChange({ code, name })
    setQuery(formatIcdLabel(code, name))
    setOpen(false)
    setSearchErr('')
    setActiveIndex(-1)
  }

  function handleInputChange(e) {
    const next = e.target.value
    setQuery(next)
    setOpen(true)
    if (value) onChange(null)
  }

  function handleFocus() {
    if (!disabled) setOpen(true)
  }

  function handleKeyDown(event) {
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
    <label className="dr-field dr-field--block dr-icd-field">
      <span className={`dr-field-label${required ? ' dr-field-label--req' : ''}`}>Chẩn đoán (ICD-10)</span>
      <div className="dr-icd-wrap" ref={wrapRef}>
        <input
          className={`dr-input${error ? ' dr-input--invalid' : ''}`}
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
          <span className="dr-icd-picked" title="Đã chọn mã ICD-10">
            {value.code}
          </span>
        ) : null}
        {showList ? (
          <ul id={listId} className="dr-icd-dropdown" role="listbox">
            {loading ? <li className="dr-icd-empty">Đang tìm…</li> : null}
            {!loading && searchErr ? <li className="dr-icd-empty dr-icd-empty--err">{searchErr}</li> : null}
            {!loading && !searchErr && String(query || '').trim().length < 2 ? (
              <li className="dr-icd-empty">Nhập ít nhất 2 ký tự để tìm theo mã hoặc tên bệnh.</li>
            ) : null}
            {!loading && !searchErr && String(query || '').trim().length >= 2 && items.length === 0 ? (
              <li className="dr-icd-empty">
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
                      className={`dr-icd-option${activeIndex === index ? ' dr-icd-option--active' : ''}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickItem(it)}
                    >
                      <span className="dr-icd-option-code">{it.code}</span>
                      <span className="dr-icd-option-name">{it.name || it.description}</span>
                    </button>
                  </li>
                ))
              : null}
          </ul>
        ) : null}
      </div>
      {error ? (
        <span className="dr-field-error" role="alert">
          {error}
        </span>
      ) : (
        <span className="dr-icd-hint">Nhập ít nhất 2 ký tự, dùng ↑/↓ và Enter để chọn. Không chấp nhận nội dung gõ tay.</span>
      )}
    </label>
  )
}
