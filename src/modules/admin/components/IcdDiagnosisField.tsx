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
export function parseIcdFromExamination(ex) {
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
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchErr, setSearchErr] = useState('')

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
    const delay = q.length > 0 ? 260 : 0

    const timer = setTimeout(() => {
      setLoading(true)
      setSearchErr('')
      void searchIcd10({ token, q, limit: q ? 25 : 40 })
        .then((rows) => {
          if (cancelled) return
          setItems(Array.isArray(rows) ? rows : [])
        })
        .catch((e) => {
          if (cancelled) return
          setItems([])
          setSearchErr(e?.message || 'Không tải được ICD-10.')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, delay)

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
    const name = String(item?.name || '').trim()
    if (!code || !name) return
    onChange({ code, name })
    setQuery(formatIcdLabel(code, name))
    setOpen(false)
    setSearchErr('')
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
          disabled={disabled}
          placeholder="Gõ từ khóa (vd: Viêm) rồi chọn trong danh sách"
          autoComplete="off"
          aria-invalid={error ? 'true' : undefined}
          aria-expanded={showList}
          aria-controls={listId}
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
            {!loading && !searchErr && items.length === 0 ? (
              <li className="dr-icd-empty">
                {String(query || '').trim() ? 'Không có kết quả.' : 'Chưa có dữ liệu ICD-10 trong MongoDB.'}
              </li>
            ) : null}
            {!loading
              ? items.map((it) => (
                  <li key={String(it.id || it.code)}>
                    <button type="button" className="dr-icd-option" role="option" onClick={() => pickItem(it)}>
                      <span className="dr-icd-option-code">{it.code}</span>
                      <span className="dr-icd-option-name">{it.name}</span>
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
        <span className="dr-icd-hint">Bắt buộc chọn một mục từ danh sách gợi ý (không gõ tay).</span>
      )}
    </label>
  )
}
