'use client'

import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/client'
import { Button } from '@/src/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return <Button 
  className="cursor-pointer"
  variant={"outline"} 
  size={"sm"}
  onClick={logout}>Logout</Button>
}
