// app/components/Navbar.tsx
'use client'

import { useAuth, useUser, SignInButton, SignUpButton } from '@clerk/nextjs'
import { ThemeToggle } from '../components/theme-toggle';
import Link from 'next/link'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const authBtn = `
    rounded-full px-4 py-1
    bg-background/50 dark:bg-background/50
    border border-primary
    text-primary
    transition-colors duration-150
    hover:bg-primary hover:text-background
    dark:hover:bg-primary dark:hover:text-background
  `


export function Navbar() {
  const { user } = useUser()
  const { signOut } = useAuth()

  type user = typeof user

  return (
    <header className="w-full flex justify-center py-4">
      <nav
        className="
          relative overflow-hidden
          flex items-center space-x-6
          bg-background/60 dark:bg-background/60
          border border-primary
          rounded-full
          px-8 py-2
          backdrop-blur-lg
          transition-colors

          /* shine‐effect pseudo */
          before:content-['']
          before:absolute before:inset-0
          before:bg-gradient-to-r
          before:from-white/20 before:via-white/10 before:to-transparent
          before:opacity-0 hover:before:opacity-30
          before:transition-opacity before:duration-1000
          before:rounded-full
          before:pointer-events-none
        "
      >
        <Link
          href="/"
          className="font-semibold text-lg text-foreground"
        >
          Jotit
        </Link>

        <div className="w-px h-6 bg-border" />

        {!user && (
          <>
            <SignInButton mode="modal">
              <Button className={authBtn}>Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className={authBtn}>Sign Up</Button>
            </SignUpButton>
          </>
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer ring-2 ring-primary">
                {user.imageUrl ? (
                  <AvatarImage src={user.imageUrl} />
                ) : (
                  <AvatarFallback className="text-primary">
                    {user.firstName?.[0] ??
                      user.emailAddresses[0].emailAddress}
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem asChild>
                <Link href="/profile">Your Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  signOut()
                }}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>

      </nav>
    </header>
  )
}

