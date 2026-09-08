'use client'

import { useEffect, useRef } from 'react'
import { getAppointmentsSocket } from '../services/socket'

export interface AppointmentBookedEvent {
  appointmentId: string
  bookingCode?: string
  queueNumber?: number | string
  patientName?: string
  patientPhone?: string
  doctorName?: string
  specialtyName?: string
  branchId?: string
  appointmentDate?: string
  startTime?: string
  endTime?: string
  status: string
}

export interface AppointmentStatusChangedEvent {
  appointmentId: string
  status: string
  previousStatus?: string
  bookingCode?: string
  branchId?: string
}

export interface UseAppointmentsSocketOptions {
  onAppointmentBooked?: (event: AppointmentBookedEvent) => void
  onStatusChanged?: (event: AppointmentStatusChangedEvent) => void
  enabled?: boolean
}

export function useAppointmentsSocket({
  onAppointmentBooked,
  onStatusChanged,
  enabled = true,
}: UseAppointmentsSocketOptions = {}) {
  const onBookedRef = useRef(onAppointmentBooked)
  onBookedRef.current = onAppointmentBooked

  const onStatusRef = useRef(onStatusChanged)
  onStatusRef.current = onStatusChanged

  useEffect(() => {
    if (!enabled) return

    const socket = getAppointmentsSocket()

    const handleBooked = (data: AppointmentBookedEvent) => {
      console.log('[Realtime] Received appointment:booked', data)
      if (onBookedRef.current) {
        onBookedRef.current(data)
      }
    }

    const handleStatusChanged = (data: AppointmentStatusChangedEvent) => {
      console.log('[Realtime] Received appointment:status_changed', data)
      if (onStatusRef.current) {
        onStatusRef.current(data)
      }
    }

    socket.on('appointment:booked', handleBooked)
    socket.on('appointment:status_changed', handleStatusChanged)

    return () => {
      socket.off('appointment:booked', handleBooked)
      socket.off('appointment:status_changed', handleStatusChanged)
    }
  }, [enabled])
}
