import { createAdminClient } from "@/src/services/supabase/server";
import { getCurrentUser } from "@/src/services/supabase/lib/getCurrentUser";
import { notFound, redirect } from "next/navigation";
import { RoomClient } from "./client";
import type { Message } from "@/src/services/supabase/actions/messages";

type RoomPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const user = await getCurrentUser();

  if (user == null) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: room, error: roomError }, { data: membership, error: membershipError }, { data: messages }] =
    await Promise.all([
      supabase
        .from("chat_room")
        .select("id, name, is_public")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("chat_room_members")
        .select("chat_room_id")
        .eq("chat_room_id", id)
        .eq("member_id", user.id)
        .maybeSingle(),
      supabase
        .from("message")
        .select("id, text, created_at, author_id, author:user_profile(name, image_url)")
        .eq("chat_room_id", id)
        .order("created_at", { ascending: true })
        .limit(50)
    ]);

  if (roomError || room == null) {
    notFound();
  }

  if (membershipError || membership == null) {
    redirect("/");
  }

  const initialMessages: Message[] = (messages ?? []).map((message) => ({
    id: message.id,
    text: message.text,
    created_at: message.created_at,
    author_id: message.author_id,
    author: Array.isArray(message.author) ? message.author[0] : message.author,
  }));
  return <RoomClient room={{ id: room.id, name: room.name }} user={{ id: user.id }} message={initialMessages} />;
}
