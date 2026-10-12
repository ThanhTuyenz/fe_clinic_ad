import { createUser, deleteUser, listUsers, updateUser, getUserPermissions } from '@/modules/admin/services/users'
import { listCatalog } from '@/modules/catalog'
import { listClinicRooms } from '@/modules/admin/services/clinicRooms'
import { resolveMediaUrl } from '@/modules/admin/services/media'

export const staffService = {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  getUserPermissions,
  listCatalog,
  listClinicRooms,
  resolveMediaUrl,
}

export { createUser, deleteUser, listUsers, updateUser, getUserPermissions, listCatalog, listClinicRooms, resolveMediaUrl }

