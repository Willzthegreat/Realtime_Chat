import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { createAdminClient } from "@/src/services/supabase/server";
import { getCurrentUser } from "@/src/services/supabase/lib/getCurrentUser";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

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
        .select("id, text, created_at, author_id")
        .eq("chat_room_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (roomError || room == null) {
    notFound();
  }

  if (membershipError || membership == null) {
    redirect("/");
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{room.name}</CardTitle>
              <CardDescription>
                {room.is_public ? "Public room" : "Private room"}
              </CardDescription>
            </div>
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Back to rooms
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          <div className="min-h-64 space-y-3 rounded-md border p-4">
            {messages?.length ? (
              messages.map((message) => (
                <div key={message.id} className="rounded-md bg-muted px-3 py-2">
                  <p>{message.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.author_id === user.id ? "You" : "Room member"} ·{" "}
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
