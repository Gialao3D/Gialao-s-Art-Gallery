import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { PatreonMark, patreonClass } from '@/components/vault/patreon-button'
import { Logo } from '@/components/vault/site-header'
import { artist } from '@/lib/fixtures'
import { patreonLoginUrl } from '@/lib/session'

const errorMessages: Record<string, string> = {
  denied: 'Patreon sign-in was cancelled.',
  state: 'Your sign-in session expired. Please try again.',
  not_patron:
    'Your Patreon account is not an active patron of this campaign yet.',
  patreon: 'Patreon could not be reached. Please try again in a moment.',
  config: 'Patreon sign-in is not configured on this site yet.',
}

interface LoginSearch {
  error?: string
  returnTo?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    error: typeof search.error === 'string' ? search.error : undefined,
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
  head: () => ({ meta: [{ title: `Sign in · ${artist.name}` }] }),
  component: LoginPage,
})

function LoginPage() {
  const { error, returnTo } = Route.useSearch()
  const [pending, setPending] = useState(false)
  const message = error ? (errorMessages[error] ?? errorMessages.patreon) : null

  return (
    <div className="grain flex min-h-screen flex-col px-4 py-6 sm:px-10">
      <div className="flex items-center justify-between">
        <Logo />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-patreon text-white">
          <PatreonMark className="size-6" />
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">
          Patron sign in
        </h1>

        {message && (
          <p
            role="alert"
            className="mt-6 w-full rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
          >
            {message}
          </p>
        )}

        <a
          href={patreonLoginUrl(returnTo)}
          onClick={() => setPending(true)}
          aria-disabled={pending}
          className={patreonClass(
            'lg',
            cnPending(pending, 'mt-8 w-full'),
          )}
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin motion-reduce:animate-none" />{' '}
              Connecting…
            </>
          ) : (
            <>
              <PatreonMark /> Continue with Patreon
            </>
          )}
        </a>

        <a
          href={artist.patreonUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Become a patron
        </a>
      </main>
    </div>
  )
}

const cnPending = (pending: boolean, base: string) =>
  pending ? `${base} pointer-events-none opacity-80` : base
