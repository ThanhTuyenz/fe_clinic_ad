'use client'

import GuestGuard from '@/modules/auth/common/guards/GuestGuard'
import { Login } from '@/modules/auth'

export default function LoginPage() {
  return <GuestGuard><Login /></GuestGuard>
}
