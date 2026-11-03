import { Lock } from 'lucide-react'

import { cdn, type Artwork, type Patron } from '@/lib/fixtures'
import { cn } from '@/lib/utils'

interface ProtectedImageProps {
  art: Artwork
  patron: Patron | null
  unlocked: boolean
  width: number
  className?: string
  /** Show the dense per-patron watermark (viewer) instead of the light one (grid). */
  dense?: boolean
  /** Override the artwork's natural aspect ratio (cropped thumbnails). */
  aspect?: string
}

/**
 * Renders a render as a CSS background (no <img> to right-click/drag-save),
 * with a per-patron watermark layered over it. Locked art only ever receives
 * a tiny, blurred preview.
 */
export function ProtectedImage({
  art,
  patron,
  unlocked,
  width,
  className,
  dense = false,
  aspect,
}: ProtectedImageProps) {
  const src = unlocked ? cdn(art.image, width) : cdn(art.image, 48, 30)
  const mark = patron ? `${patron.handle} · ${patron.id}` : 'locked preview'

  return (
    <div
      role="img"
      aria-label={unlocked ? art.title : `${art.title} (locked)`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        'protected-media relative overflow-hidden bg-muted',
        className,
      )}
      style={{ aspectRatio: aspect ?? `${art.width} / ${art.height}` }}
    >
      <div
        className={cn(
          'absolute inset-0 bg-cover bg-center',
          !unlocked && 'scale-110 blur-2xl saturate-150',
        )}
        style={{ backgroundImage: `url("${src}")` }}
      />

      {unlocked && patron && (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute -inset-1/2 flex rotate-[-24deg] flex-wrap content-start gap-x-16 font-mono text-[11px] tracking-wider text-white mix-blend-overlay',
            dense ? 'gap-y-10 opacity-35' : 'gap-y-20 opacity-20',
          )}
        >
          {Array.from({ length: dense ? 160 : 60 }, (_, i) => (
            <span key={i} className="whitespace-nowrap">
              {mark}
            </span>
          ))}
        </div>
      )}

      {!unlocked && (
        <div className="absolute inset-0 grid place-items-center bg-background/30 p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="grid size-11 place-items-center rounded-full border border-white/20 bg-background/60 backdrop-blur">
              <Lock className="size-5" />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
