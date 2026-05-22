/** Phí khám mặc định (VND) — khớp be_clinic DEFAULT_CONSULTATION_FEE. */
export const DEFAULT_CONSULTATION_FEE = 150_000

export function resolveConsultationFee(amount, doctorFee) {
  const paid = Number(amount)
  if (Number.isFinite(paid) && paid > 0) return Math.round(paid)
  const fromDoc = Number(doctorFee)
  if (Number.isFinite(fromDoc) && fromDoc > 0) return Math.round(fromDoc)
  return DEFAULT_CONSULTATION_FEE
}
