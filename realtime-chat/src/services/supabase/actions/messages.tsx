"use server"

import { getCurrentUser } from "../lib/getCurrentUser";
import { createAdminClient } from "../server";

export type Message = {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    author: {
        name: string;
        image_url: string | null;
    }
}


export async function sendMessage({ roomId, text }: { text: string; roomId: string }): Promise<
| { error: false; message: Message } 
| { error: true; message: string }
> {
 const user = await getCurrentUser();
 if (user == null) {
  return { error: true, message: "User not authenticated" };
  }

  if (!text.trim()) {
    return { error: true, message: "Message cannot be empty" };
  }

  const supabase = createAdminClient();

  const { data: membership, error: membershipError } = await supabase
    .from("chat_room_members")
    .select("chat_room_id")
    .eq("chat_room_id", roomId)
    .eq("member_id", user.id)
    .maybeSingle();

    if (membershipError || !membership) {
      return { error: true, message: "User is not a member of this chat room" };
    }

  const { data: message, error } = await supabase.from("message").insert({
    text: text.trim(),
    chat_room_id: roomId,
    author_id: user.id,
  }).select("id, text, created_at, author_id, author:user_profile(name, image_url)").single();

  if (error) {
    return { error: true, message: "Unable to send message" };
  }

  return { error: false, message };
}
