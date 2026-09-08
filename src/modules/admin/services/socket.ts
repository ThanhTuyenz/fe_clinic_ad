import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null

export function getSocketBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
  if (envUrl) {
    return envUrl.replace(/\/api(\/v\d+)?\/?$/i, '')
  }
  return 'http://localhost:8011'
}

export function getRealtimeSocket(): Socket {
  if (!socketInstance) {
    const baseUrl = getSocketBaseUrl()
    socketInstance = io(baseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketInstance.on('connect', () => {
      console.log('[Realtime] Connected to Global Realtime socket:', socketInstance?.id)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('[Realtime] Disconnected from Realtime socket:', reason)
    })

    socketInstance.on('connect_error', (error) => {
      console.warn('[Realtime] Socket connection error:', error.message)
    })
  }

  return socketInstance
}

/** Alias cho getRealtimeSocket để tương thích ngược */
export const getAppointmentsSocket = getRealtimeSocket

export function closeRealtimeSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

export const closeAppointmentsSocket = closeRealtimeSocket
