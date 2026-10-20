export const CLINIC_SESSIONS = [
  { code: 'MORNING', id: 'morning', label: 'Sáng', start: '07:30', end: '11:30' },
  { code: 'AFTERNOON', id: 'afternoon', label: 'Chiều', start: '13:30', end: '17:00' },
  { code: 'EVENING', id: 'evening', label: 'Tối', start: '17:00', end: '20:30' },
] as const

export function clinicPeriod(start: string): (typeof CLINIC_SESSIONS)[number]['code'] {
  if (start >= CLINIC_SESSIONS[2].start) return 'EVENING'
  if (start >= CLINIC_SESSIONS[1].start) return 'AFTERNOON'
  return 'MORNING'
}
