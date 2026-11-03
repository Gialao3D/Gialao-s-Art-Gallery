import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PatreonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-4', className)}>
      <circle cx="15" cy="9.5" r="6.5" fill="currentColor" />
      <rect x="2.5" y="3" width="3.6" height="18" fill="currentColor" />
    </svg>
  )
}

/** Patreon-branded button classes; apply to a <button> or a router <Link>. */
export const patreonClass = (
  size: 'sm' | 'default' | 'lg' = 'lg',
  className?: string,
) =>
  cn(
    buttonVariants({ size }),
    'bg-patreon font-semibold text-white hover:bg-patreon/90 focus-visible:ring-patreon/40',
    className,
  )
