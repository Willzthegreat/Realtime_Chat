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

    // Room names are compared case-insensitively. These separators are also
    // ignored so names such as "My_Room", "my-room", and "my+room" collide.
    const normalizedName = normalizeRoomName(data.name)
    const { data: existingRooms, error: existingRoomsError } = await supabase
        .from("chat_room")
        .select("name")

    if (existingRoomsError) {
        return { error: true, message: "Failed to check existing rooms" }
    }

    if (existingRooms.some((room) => normalizeRoomName(room.name) === normalizedName)) {
        return { error: true, message: "A room with that name already exists" }
    }

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

function normalizeRoomName(name: string) {
    return name.trim().toLocaleLowerCase().replace(/[+_-]/g, "")
}
