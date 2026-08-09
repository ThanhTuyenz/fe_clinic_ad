'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const NAV_STATE_PREFIX = 'medilink:navigation:'

function stateKey(pathname: string) {
  return `${NAV_STATE_PREFIX}${pathname}`
}

export function useNavigate() {
  const router = useRouter()
  return useCallback(
    (to: string | number, options: { replace?: boolean; state?: unknown } = {}) => {
      if (typeof to === 'number') {
        if (to < 0) router.back()
        else router.refresh()
        return
      }
      const pathname = String(to).split('?')[0]
      if (options.state !== undefined) {
        sessionStorage.setItem(stateKey(pathname), JSON.stringify(options.state))
      }
      if (options.replace) router.replace(to)
      else router.push(to)
    },
    [router],
  )
}

export function useLocation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return useMemo(() => {
    let state: Record<string, any> | null = null
    try {
      const raw = sessionStorage.getItem(stateKey(pathname))
      state = raw ? JSON.parse(raw) : null
    } catch {
      state = null
    }
    const search = searchParams.toString()
    return { pathname, search: search ? `?${search}` : '', state }
  }, [pathname, searchParams])
}
