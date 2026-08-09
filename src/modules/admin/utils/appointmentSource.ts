export function appointmentSourceValue(appointment) {
  const raw = String(
    appointment?.source ||
      appointment?.bookingSource ||
      appointment?.bookingType ||
      appointment?.channel ||
      '',
  )
    .trim()
    .toLowerCase()

  if (['clinic', 'walkin', 'walk-in', 'direct', 'reception', 'offline'].includes(raw)) {
    return 'clinic'
  }
  if (['online', 'web', 'patient'].includes(raw)) {
    return 'online'
  }

  if (appointment?.createdByStaff || appointment?.createdByReceptionist || appointment?.staffCreatedBy) {
    return 'clinic'
  }
  return 'unknown'
}

export function appointmentSourceLabel(appointment) {
  const source = appointmentSourceValue(appointment)
  if (source === 'clinic') return 'Trực tiếp'
  if (source === 'online') return 'Online'
  return 'Chưa rõ'
}

export function appointmentSourceTitle(appointment) {
  const source = appointmentSourceValue(appointment)
  if (source === 'clinic') return 'Đăng ký trực tiếp tại phòng khám'
  if (source === 'online') return 'Đăng ký online'
  return 'Chưa có dữ liệu nguồn đăng ký'
}

export function appointmentCreatorName(appointment) {
  const staff =
    appointment?.createdByStaff ||
    appointment?.createdByReceptionist ||
    appointment?.staffCreatedBy ||
    appointment?.creator ||
    appointment?.createdBy

  if (typeof staff === 'string') return staff.trim()

  const first = String(staff?.firstName || '').trim()
  const last = String(staff?.lastName || '').trim()
  const full = `${last} ${first}`.trim()
  return (
    String(staff?.displayName || staff?.fullName || staff?.name || '').trim() ||
    full ||
    String(staff?.email || '').trim()
  )
}
