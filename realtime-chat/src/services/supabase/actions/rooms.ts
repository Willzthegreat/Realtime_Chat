"use server"

import z from "zod"
import { createRoomSchema } from "../schemas/rooms"
import { getCurrentUser } from "../lib/getCurrentUser"
import { redirect } from "next/navigation"
import { createAdminClient } from "../server"

export async function createRoom(unsafeData: z.infer<typeof createRoomSchema>) {
    const { success, data } = createRoomSchema.safeParse(unsafeData)

    if (!success) {
        return { error: true, message: "Invalid room data" }
    }
    
    const user = await getCurrentUser()
    if (user == null) {
        return { error: true, message: "User not authenicated"}
    }

    const supabase = createAdminClient()

    const { data: room, error: roomError } = await supabase
    .from("chat_room")
    .insert({ name: data.name, is_public: data.isPublic})
    .select("id")
    .single()

  if (roomError || room == null) {
    return { error: true, message: "Failed to create room" }
  }

  const { error: membershipError } = await supabase
  .from("chat_room_members")
  .insert({ chat_room_id: room.id, member_id: user.id })

  if (membershipError) {

    console.log(membershipError)
    return { error: true, message: "Failed to add user to room" }
  }

  redirect(`/rooms/${room.id}`)
}
