"use client"

import React, { ComponentProps } from 'react'
import { ActionButton } from '@/components/ui/action-button'
import { useCurrentUser } from '../services/supabase/hooks/useCurrentUser'
import { createClient } from '@/lib/client'
import { useRouter } from 'next/navigation'


export function LeaveRoomButton({
    children, 
    roomId,
    ...props
} 
    : Omit<ComponentProps<typeof ActionButton>, "action"> & {roomId: string})  {
        
    const { user } = useCurrentUser()
    const router = useRouter()
    

    async function LeaveRoom() {
        if (user == null) {
            return {
                error: true, 
                message: "User not logged in."
            }
        }

        const Supabase = createClient()

        const { error } = await Supabase
            .from("chat_room_members")
            .delete()
            .eq("chat_room_id", roomId)
            .eq("member_id", user.id)

        if (error) {
            return {
                error: true, 
                message: "Failed to join room"
            }
        }

        router.refresh()
        router.push(`/rooms/${roomId}`)
    }
 
    return (
        <>
            <ActionButton {...props} action={LeaveRoom}>
                {children}
            </ActionButton>
        </>
    )
}
