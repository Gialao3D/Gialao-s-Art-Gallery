import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { artist } from '@/lib/fixtures'
import { useSession } from '@/lib/session'
import { PatreonMark, patreonClass } from './patreon-button'

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
    >
      <span className="font-display text-lg font-bold tracking-tight">
        {artist.name}
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const { patron, ready, signOut } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link to="/gallery">Gallery</Link>
          </Button>
          {!ready ? (
            <div className="h-8 w-32" />
          ) : patron ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    {patron.avatarInitials}
                  </span>
                  <span className="hidden sm:inline">{patron.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{patron.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/gallery">Open gallery</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className={patreonClass('sm')}>
              <PatreonMark /> Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
