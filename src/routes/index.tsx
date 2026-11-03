import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { PatreonMark, patreonClass } from '@/components/vault/patreon-button'
import { SiteHeader } from '@/components/vault/site-header'
import { artist, cdn } from '@/lib/fixtures'
import { useSession } from '@/lib/session'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { patron, ready } = useSession()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="relative isolate flex flex-1 items-end overflow-hidden">
        {artist.landingImage ? (
          <div
            aria-hidden
            className="protected-media absolute inset-0 -z-10 bg-cover bg-[center_35%]"
            style={{
              backgroundImage: `url("${cdn(artist.landingImage, 1920, 75)}")`,
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <div aria-hidden className="grain absolute inset-0 -z-10" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/30 to-transparent"
        />

        <div className="mx-auto w-full max-w-content px-4 pt-48 pb-16 text-center sm:pb-20 sm:px-6">
          <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)] sm:text-6xl md:text-7xl">
            Gialao’s Supporter Gallery
          </h1>
          <div className="mt-10 flex justify-center">
            {!ready ? (
              <div className="h-12" />
            ) : patron ? (
              <Link to="/gallery" className={patreonClass('lg')}>
                Enter gallery <ArrowRight />
              </Link>
            ) : (
              <Link to="/login" className={patreonClass('lg')}>
                <PatreonMark /> Sign in with Patreon
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
