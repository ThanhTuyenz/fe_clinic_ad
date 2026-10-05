import { recordAppointmentPayment } from '@/modules/admin/services/payments'
import { listReceptionAppointments } from '@/modules/appointments'
import { listCatalog } from '@/modules/catalog'

export const billingService = {
  recordAppointmentPayment,
  listReceptionAppointments,
  listCatalog,
}

export { recordAppointmentPayment, listReceptionAppointments, listCatalog }
