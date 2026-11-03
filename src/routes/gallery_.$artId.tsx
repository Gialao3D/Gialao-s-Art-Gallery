import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Expand,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'

import { PatreonMark, patreonClass } from '@/components/vault/patreon-button'
import { ProtectedImage } from '@/components/vault/protected-image'
import { SiteHeader } from '@/components/vault/site-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { artist, artworks, getArtwork } from '@/lib/fixtures'
import { canView, useSession } from '@/lib/session'

export const Route = createFileRoute('/gallery_/$artId')({
  loader: ({ params }) => {
    const art = getArtwork(params.artId)
    if (!art) throw notFound()
    return { art }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.art.title ?? 'Render'} · ${artist.name}` }],
  }),
  component: ViewerPage,
})

function ViewerPage() {
  const { art } = Route.useLoaderData()
  const { patron, ready } = useSession()
  const [full, setFull] = useState(false)
  const unlocked = canView(patron)

  const index = artworks.findIndex((a) => a.id === art.id)
  const prev = artworks[(index - 1 + artworks.length) % artworks.length]
  const next = artworks[(index + 1) % artworks.length]

  // Deterrent for casual save shortcuts while a render is open.
  useEffect(() => {
    if (!unlocked) return
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && (k === 's' || k === 'p')) {
        e.preventDefault()
        toast('Saving is disabled')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [unlocked])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6">
        <h1 className="sr-only">{art.title}</h1>
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Gallery
          </Link>
          {unlocked && (
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                size="icon-sm"
                aria-label="Previous render"
              >
                <Link to="/gallery/$artId" params={{ artId: prev.id }}>
                  <ChevronLeft />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon-sm"
                aria-label="Next render"
              >
                <Link to="/gallery/$artId" params={{ artId: next.id }}>
                  <ChevronRight />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6">
          {!ready ? (
            <Skeleton
              className="mx-auto w-full max-w-3xl rounded-2xl"
              style={{ aspectRatio: `${art.width} / ${art.height}` }}
            />
          ) : !unlocked ? (
            <div className="mx-auto max-w-lg py-24 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-card">
                <Lock className="size-6 text-primary" />
              </span>
              <p className="mt-6 font-display text-3xl font-bold tracking-tight">
                Patrons only
              </p>
              <Link to="/login" className={patreonClass('lg', 'mt-8')}>
                <PatreonMark /> Sign in with Patreon
              </Link>
            </div>
          ) : (
            <div
              className="relative mx-auto max-h-[80vh]"
              style={{ maxWidth: `calc(80vh * ${art.width / art.height})` }}
            >
              <ProtectedImage
                art={art}
                patron={patron}
                unlocked
                width={1400}
                dense
                className="rounded-2xl border"
              />
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="View larger"
                onClick={() => setFull(true)}
                className="absolute right-3 bottom-3 bg-background/70 backdrop-blur"
              >
                <Expand />
              </Button>
            </div>
          )}
        </div>
      </main>

      {patron && unlocked && (
        <Dialog open={full} onOpenChange={setFull}>
          <DialogContent className="max-w-[min(96vw,110rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,110rem)]">
            <DialogTitle className="sr-only">{art.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Full-size view of {art.title}.
            </DialogDescription>
            <div
              className="mx-auto"
              style={{
                width: `min(96vw, calc(90vh * ${art.width / art.height}))`,
              }}
            >
              <ProtectedImage
                art={art}
                patron={patron}
                unlocked
                width={2000}
                dense
                className="rounded-xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
