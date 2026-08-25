import { apiErrorMessage, apiRequest } from './apiBase'

export async function listSpecialties(branchId?: string) {
  try {
    const data = await apiRequest({
      method: 'GET',
      url: '/specialties',
      params: branchId ? { branchId } : {},
    })
    return Array.isArray(data) ? data : data?.specialties || data?.items || []
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được danh sách chuyên khoa.'))
  }
}

export async function listDoctorsBySpecialty(specialtyId: number | string, branchId?: string) {
  try {
    const sid = encodeURIComponent(String(specialtyId).trim())
    const data = await apiRequest({
      method: 'GET',
      url: `/specialties/${sid}/doctors`,
      params: branchId ? { branchId } : {},
    })
    return Array.isArray(data) ? data : data?.doctors || data?.items || []
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không lấy được danh sách bác sĩ thuộc chuyên khoa.'))
  }
}

export async function listSpecialtyServices(specialtyId: number | string, branchId?: string) {
  try {
    const sid = encodeURIComponent(String(specialtyId).trim())
    const data = await apiRequest({
      method: 'GET',
      url: `/specialties/${sid}/services`,
      params: branchId ? { branchId } : {},
    })
    return Array.isArray(data) ? data : data?.services || data?.packages || data?.items || []
  } catch {
    return []
  }
}
