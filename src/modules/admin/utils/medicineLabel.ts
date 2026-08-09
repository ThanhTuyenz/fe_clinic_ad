/**
 * Nhãn thuốc theo quy định: Hoạt chất + hàm lượng (Tên biệt dược).
 * VD: Paracetamol 500mg (Panadol)
 */
export function formatMedicineLabel(med) {
  if (!med || typeof med !== 'object') return ''

  const generic = String(
    med.genericName ?? med.activeIngredient ?? med.hoatChat ?? med.generic ?? '',
  ).trim()
  const brand = String(med.brandName ?? med.brand ?? med.commercialName ?? '').trim()
  const strength = String(med.strength ?? '').trim()
  const legacyName = String(med.name ?? '').trim()
  const notes = String(med.notes ?? '').trim()

  const genericFromNotes =
    notes && legacyName && !legacyName.toLowerCase().includes(notes.toLowerCase()) ? notes : ''

  const gBase = generic || genericFromNotes
  if (gBase) {
    const g = strength && !gBase.includes(strength) ? `${gBase} ${strength}` : gBase
    const b =
      brand && brand.toLowerCase() !== gBase.toLowerCase() && !g.includes(brand) ? brand : legacyName
    if (b && b.toLowerCase() !== gBase.toLowerCase() && !g.toLowerCase().includes(`(${b.toLowerCase()})`)) {
      return `${g} (${b})`
    }
    return g
  }

  if (legacyName && strength && !legacyName.includes(strength)) return `${legacyName} ${strength}`
  return legacyName
}

/** Tên lưu trên dòng đơn / in. */
export function rxLineMedicineName(line) {
  return String(line?.medicineDisplayName || line?.medicineName || '').trim()
}
