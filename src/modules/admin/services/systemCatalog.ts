import { apiClient } from '@/lib/api-client'
const unwrap = (p: any) => p?.success === true && 'data' in p ? p.data : p
export async function listCatalog(resource: string, q = '') { const r = await apiClient.get(`/admin/catalog/${resource}`, { params: q ? { q } : {} }); return unwrap(r.data)?.items || [] }
export async function createCatalog(resource: string, payload: any) { const r = await apiClient.post(`/admin/catalog/${resource}`, payload); return unwrap(r.data) }
export async function updateCatalog(resource: string, id: string | number, payload: any) { const r = await apiClient.patch(`/admin/catalog/${resource}/${id}`, payload); return unwrap(r.data) }
export async function deleteCatalog(resource: string, id: string | number) { await apiClient.delete(`/admin/catalog/${resource}/${id}`) }
