"use client"

import Link from 'next/link'
import { useCurrentUser } from '../services/supabase/hooks/useCurrentUser'
import { Button } from './ui/button'
import { LogoutButton } from '../services/supabase/components/logout-button'

const Navbar = () => {
  const { user, isLoading } = useCurrentUser()

  return (
    <>
    <div className="border-b bg-background h-header">
      <nav className="container mx-auto px-4 flex justify-between items-center h-full">
        <Link href="/" className='text-xl font-bold'>
          Supachat
        </Link>

        {isLoading ? null : user == null ? (
          <Button render={<Link href="/auth/login" />}>
            Sign in
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              { user.user_metadata?.preferred_username ?? user.email }
            </span>
            <LogoutButton />
          </div>
        )}
      </nav>
    </div>
    </>
  )
}

export default Navbar
