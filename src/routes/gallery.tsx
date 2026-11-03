import { Link, createFileRoute } from '@tanstack/react-router'
import { Lock } from 'lucide-react'

import { PatreonMark, patreonClass } from '@/components/vault/patreon-button'
import { ProtectedImage } from '@/components/vault/protected-image'
import { SiteHeader } from '@/components/vault/site-header'
import { Skeleton } from '@/components/ui/skeleton'
import { artist, artworks } from '@/lib/fixtures'
import { useSession } from '@/lib/session'

export const Route = createFileRoute('/gallery')({
  head: () => ({ meta: [{ title: `Gallery · ${artist.name}` }] }),
  component: GalleryPage,
})

function GalleryPage() {
  const { patron, ready } = useSession()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-10 sm:px-6">
        {!ready ? (
          <GallerySkeleton />
        ) : !patron ? (
          <SignInGate />
        ) : (
          <>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Gallery
            </h1>
            {artworks.length === 0 ? (
              <div className="mt-16 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
                No renders yet.
              </div>
            ) : (
              <ul className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {artworks.map((art) => (
                  <li key={art.id} className="mb-5 break-inside-avoid">
                    <Link
                      to="/gallery/$artId"
                      params={{ artId: art.id }}
                      aria-label={art.title}
                      className="block overflow-hidden rounded-2xl border bg-card outline-none transition-colors hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
                    >
                      <ProtectedImage
                        art={art}
                        patron={patron}
                        unlocked
                        width={720}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function SignInGate() {
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-card">
        <Lock className="size-6 text-primary" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
        Patrons only
      </h1>
      <Link to="/login" className={patreonClass('lg', 'mt-8')}>
        <PatreonMark /> Sign in with Patreon
      </Link>
    </div>
  )
}

function GallerySkeleton() {
  return (
    <div aria-busy className="space-y-8">
      <Skeleton className="h-10 w-40" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
