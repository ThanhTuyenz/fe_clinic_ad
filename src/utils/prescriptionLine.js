/** Tần suất dùng thuốc — `value` = số lần/ngày (nhân vào SL). */
export const RX_FREQUENCY_OPTIONS = [
  { value: '1', label: '1 lần/ngày', perDay: 1 },
  { value: '2', label: '2 lần/ngày', perDay: 2 },
  { value: '3', label: '3 lần/ngày (cách 8 giờ)', perDay: 3 },
  { value: '4', label: '4 lần/ngày (cách 6 giờ)', perDay: 4 },
]

const FREQ_BY_VALUE = new Map(RX_FREQUENCY_OPTIONS.map((o) => [o.value, o]))

export function emptyRxLine() {
  return {
    medicineId: '',
    medicineCode: '',
    medicineName: '',
    medicineDisplayName: '',
    medicineGeneric: '',
    medicineBrand: '',
    unit: '',
    dosageAmount: '',
    frequencyPerDay: '',
    durationDays: '',
    quantity: '',
    quantityManual: false,
    note: '',
  }
}

export function parseDosageAmount(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const m = s.match(/^(\d+(?:[.,]\d+)?)/)
  return m ? m[1].replace(',', '.') : ''
}

export function parseDurationDays(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  const m = s.match(/^(\d+)/)
  return m ? m[1] : ''
}

export function parseFrequencyPerDay(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (!s) return ''
  for (const opt of RX_FREQUENCY_OPTIONS) {
    if (s === opt.value || s === String(opt.perDay)) return opt.value
    if (s.includes(opt.label.toLowerCase())) return opt.value
  }
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*lần/)
  if (m) {
    const n = Math.round(Number(m[1].replace(',', '.')))
    if (n >= 1 && n <= 12) return String(n)
  }
  if (/cách\s*8|8\s*(tiếng|h|giờ)/i.test(s)) return '3'
  if (/cách\s*6|6\s*(tiếng|h|giờ)/i.test(s)) return '4'
  const n = Number(s.replace(',', '.'))
  if (Number.isFinite(n) && n > 0 && n <= 12) return String(Math.round(n))
  return ''
}

export function frequencyPerDayNumeric(value) {
  const key = String(value ?? '').trim()
  if (!key) return NaN
  const opt = FREQ_BY_VALUE.get(key)
  if (opt) return opt.perDay
  const n = Number(key.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : NaN
}

/** SL = liều × tần suất (lần/ngày) × số ngày */
export function computeRxQuantity(dosageAmount, frequencyPerDay, durationDays) {
  const dose = Number(String(dosageAmount ?? '').replace(',', '.'))
  const freq = frequencyPerDayNumeric(frequencyPerDay)
  const days = parseInt(String(durationDays ?? '').trim(), 10)
  if (!Number.isFinite(dose) || dose <= 0) return ''
  if (!Number.isFinite(freq) || freq <= 0) return ''
  if (!Number.isInteger(days) || days <= 0) return ''
  const total = dose * freq * days
  if (!Number.isFinite(total) || total <= 0) return ''
  if (Math.abs(total - Math.round(total)) < 1e-9) return String(Math.round(total))
  const rounded = Math.round(total * 100) / 100
  return String(rounded)
}

export function formatRxDosageLabel(line) {
  const amount = String(line?.dosageAmount ?? '').trim()
  if (!amount) return ''
  const unit = String(line?.unit ?? '').trim()
  return unit ? `${amount} ${unit}` : amount
}

export function formatRxFrequencyLabel(line) {
  const key = String(line?.frequencyPerDay ?? '').trim()
  if (!key) return ''
  const opt = FREQ_BY_VALUE.get(key)
  return opt?.label || `${key} lần/ngày`
}

export function formatRxDurationLabel(line) {
  const days = String(line?.durationDays ?? '').trim()
  return days ? `${days} ngày` : ''
}

function normalizeOneRxLine(line) {
  const dosageAmount = parseDosageAmount(line?.dosageAmount ?? line?.dosage)
  const frequencyPerDay = parseFrequencyPerDay(line?.frequencyPerDay ?? line?.frequency)
  const durationDays = parseDurationDays(line?.durationDays ?? line?.duration)
  let quantity =
    line?.quantity != null && line?.quantity !== ''
      ? String(line.quantity)
      : line?.qty != null && line?.qty !== ''
        ? String(line.qty)
        : ''
  const auto = computeRxQuantity(dosageAmount, frequencyPerDay, durationDays)
  let quantityManual = Boolean(line?.quantityManual)
  if (quantity && auto && quantity !== auto) {
    quantityManual = true
  } else if (!quantity && auto) {
    quantity = auto
    quantityManual = false
  } else if (quantity && !quantityManual && auto && quantity === auto) {
    quantityManual = false
  }

  const medicineName = String(line?.medicineName || line?.name || '').trim()
  const medicineDisplayName = String(line?.medicineDisplayName || medicineName).trim()

  return {
    medicineId: String(line?.medicineId || '').trim(),
    medicineCode: String(line?.medicineCode || line?.code || '').trim(),
    medicineName: medicineDisplayName || medicineName,
    medicineDisplayName: medicineDisplayName || medicineName,
    medicineGeneric: String(line?.medicineGeneric || '').trim(),
    medicineBrand: String(line?.medicineBrand || '').trim(),
    unit: String(line?.unit || '').trim(),
    dosageAmount,
    frequencyPerDay,
    durationDays,
    quantity,
    quantityManual,
    note: String(line?.note || line?.usage || '').trim(),
  }
}

function rxLineHasMedicine(line) {
  return Boolean(String(line?.medicineDisplayName || line?.medicineName || '').trim())
}

export function filterFilledRxLines(lines) {
  return (Array.isArray(lines) ? lines : []).filter(rxLineHasMedicine)
}

export function normalizeRxLines(raw, legacyPrescription) {
  const source =
    Array.isArray(raw) && raw.length
      ? raw
      : Array.isArray(legacyPrescription) && legacyPrescription.length
        ? legacyPrescription
        : []
  if (!source.length) return [emptyRxLine()]
  const normalized = source.map((line) => normalizeOneRxLine(line))
  const filled = filterFilledRxLines(normalized)
  if (!filled.length) return [emptyRxLine()]
  return filled
}

export function patchRxLine(line, patch) {
  const next = { ...line, ...patch }

  if ('quantity' in patch) {
    next.quantityManual = patch.quantityManual !== false
  }

  const affectsQty =
    'dosageAmount' in patch || 'frequencyPerDay' in patch || 'durationDays' in patch

  if (affectsQty) {
    if ('dosageAmount' in patch || 'frequencyPerDay' in patch || 'durationDays' in patch) {
      next.quantityManual = false
    }
    if (!next.quantityManual) {
      const auto = computeRxQuantity(next.dosageAmount, next.frequencyPerDay, next.durationDays)
      next.quantity = auto || ''
    }
  }

  return next
}

export function sanitizeDosageAmountInput(raw) {
  return String(raw ?? '')
    .replace(/[^\d.,]/g, '')
    .replace(/([.,].*)[.,]/g, '$1')
    .slice(0, 8)
}

export function sanitizeDurationDaysInput(raw) {
  return String(raw ?? '').replace(/\D/g, '').slice(0, 4)
}

export function sanitizeQuantityInput(raw) {
  return String(raw ?? '')
    .replace(/[^\d.,]/g, '')
    .replace(/([.,].*)[.,]/g, '$1')
    .slice(0, 8)
}

/** Map dòng đơn sang payload API (giữ chuỗi liều/tần suất để in/đọc). */
export function rxLineToApiPayload(line) {
  const name = String(line?.medicineDisplayName || line?.medicineName || '').trim()
  if (!name) return null
  const qtyNum = Number(String(line?.quantity ?? '').replace(',', '.'))
  return {
    medicineId: line.medicineId,
    medicineCode: line.medicineCode,
    medicineName: name,
    unit: String(line?.unit || '').trim(),
    dosage: formatRxDosageLabel(line),
    frequency: formatRxFrequencyLabel(line),
    duration: formatRxDurationLabel(line),
    quantity: line.quantity === '' ? undefined : qtyNum,
    note: String(line?.note || '').trim(),
  }
}

/** Có ít nhất một dòng thuốc đã kê. */
export function prescriptionHasMedicines(lines) {
  return (Array.isArray(lines) ? lines : []).some((l) =>
    String(l?.medicineDisplayName || l?.medicineName || '').trim(),
  )
}

/** Kiểm tra đơn trước khi kết thúc khám: dòng có tên thuốc phải có SL > 0. */
export function validateRxLinesForFinish(lines) {
  const rows = Array.isArray(lines) ? lines : []
  const filled = rows.filter((l) => String(l?.medicineDisplayName || l?.medicineName || '').trim())
  for (let i = 0; i < filled.length; i += 1) {
    const name = String(filled[i].medicineDisplayName || filled[i].medicineName || '').trim()
    const qty = Number(String(filled[i]?.quantity ?? '').replace(',', '.'))
    if (!Number.isFinite(qty) || qty <= 0) {
      const rowNum = rows.indexOf(filled[i]) + 1
      return {
        ok: false,
        message: `Dòng ${rowNum} (${name}): số lượng (SL) phải lớn hơn 0.`,
      }
    }
  }
  return { ok: true, message: '' }
}

/** Dòng có thuốc phải chọn từ danh mục (đủ hoạt chất + biệt dược). */
export function validateRxCatalogPick(lines) {
  const rows = Array.isArray(lines) ? lines : []
  const filled = rows.filter((l) => String(l?.medicineDisplayName || l?.medicineName || '').trim())
  for (let i = 0; i < filled.length; i += 1) {
    if (!String(filled[i]?.medicineId || '').trim()) {
      const name = String(filled[i].medicineDisplayName || filled[i].medicineName || '').trim()
      const rowNum = rows.indexOf(filled[i]) + 1
      return {
        ok: false,
        message: `Dòng ${rowNum}${name ? ` (${name})` : ''}: chọn thuốc bằng nút Tìm để có tên hoạt chất chuẩn.`,
      }
    }
  }
  return { ok: true, message: '' }
}

export function rxLineToLegacyPrescriptionItem(line) {
  const payload = rxLineToApiPayload(line)
  if (!payload) return null
  const usage = [payload.dosage, payload.frequency, payload.duration, payload.note].filter(Boolean).join(' — ')
  const qtyNum = Number(payload.quantity)
  return {
    name: payload.medicineName,
    code: String(payload.medicineCode || '').trim(),
    unit: payload.unit,
    qty: Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : undefined,
    usage,
  }
}
