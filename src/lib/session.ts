import { useCallback } from 'react'
import useSWR from 'swr'

import type { Patron } from '@/lib/fixtures'

const SESSION_URL = '/api/patreon/me'

interface SessionResponse {
  patron: { id: string; name: string; handle: string } | null
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('') || 'P'

async function fetchSession(url: string): Promise<Patron | null> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  // Without Pages Functions running (plain `vite dev`), the SPA fallback
  // returns HTML here; treat that the same as being signed out.
  if (
    response.status === 401 ||
    !response.headers.get('content-type')?.includes('application/json')
  ) {
    return null
  }
  if (!response.ok) throw new Error(`Session check failed (${response.status})`)

  const { patron } = (await response.json()) as SessionResponse
  return patron ? { ...patron, avatarInitials: initials(patron.name) } : null
}

export const patreonLoginUrl = (returnTo = '/gallery') =>
  `/api/patreon/login?returnTo=${encodeURIComponent(returnTo)}`

export function useSession() {
  const { data, isLoading, mutate } = useSWR(SESSION_URL, fetchSession, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  })

  const signIn = useCallback((returnTo?: string) => {
    window.location.assign(patreonLoginUrl(returnTo))
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/patreon/logout', { method: 'POST', credentials: 'same-origin' })
    await mutate(null, { revalidate: false })
  }, [mutate])

  return { patron: data ?? null, ready: !isLoading, signIn, signOut }
}

/** Any signed-in patron can view the gallery. */
export const canView = (patron: Patron | null) => !!patron
