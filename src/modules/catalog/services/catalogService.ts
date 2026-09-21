import { apiClient } from '@/lib/api-client'

const unwrap = (p: any) => (p?.success === true && 'data' in p ? p.data : p)

export async function listCatalog(resource: string, q = '') {
  const r = await apiClient.get(`/admin/catalog/${resource}`, { params: q ? { q } : {} })
  return unwrap(r.data)?.items || []
}

export async function createCatalog(resource: string, payload: any) {
  const r = await apiClient.post(`/admin/catalog/${resource}`, payload)
  return unwrap(r.data)
}

export async function updateCatalog(resource: string, id: string | number, payload: any) {
  const r = await apiClient.patch(`/admin/catalog/${resource}/${id}`, payload)
  return unwrap(r.data)
}

export async function deleteCatalog(resource: string, id: string | number) {
  await apiClient.delete(`/admin/catalog/${resource}/${id}`)
}

export async function syncPackageVectors() {
  const r = await apiClient.post('/admin/catalog/service-packages/sync-vectors')
  return unwrap(r.data)
}

export async function suggestSymptoms(name: string, specialty?: string) {
  const r = await apiClient.get('/recommendations/suggest-symptoms', { params: { name, specialty } })
  return unwrap(r.data)?.symptoms || []
}

export async function batchBranchSpecialties(branchId: string, specialtyIds: number[]) {
  const r = await apiClient.post('/admin/catalog/branch-specialties/batch', { branchId, specialtyIds })
  return unwrap(r.data)
}

export async function batchRoomSpecialties(specialtyId: number, roomIds: string[]) {
  const r = await apiClient.post('/admin/catalog/room-specialties/batch', { specialtyId, roomIds })
  return unwrap(r.data)
}
