
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/src/components/ui/empty";
import { Button } from "@/src/components/ui/button";
import { MessagesSquareIcon } from "lucide-react";
import Link from "next/link";
import { createAdminClient } from "../services/supabase/server";
import { getCurrentUser } from "../services/supabase/lib/getCurrentUser";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

// Import your LeaveRoomButton
import { LeaveRoomButton } from "../components/leaveRoomButton";
import { JoinRoomButton } from "../components/join-room-button";

export default async function Home() {
  const user = await getCurrentUser();

  if (user == null) {
    redirect("/auth/login");
  }

  const [publicRooms, joinedRooms] = await Promise.all([
    getPublicRooms(),
    getJoinedRooms(user.id),
  ]);

  if (publicRooms.length === 0 && joinedRooms.length === 0) {
    return (
      <>
        <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessagesSquareIcon />
              </EmptyMedia>

              <EmptyTitle>No Chat Rooms</EmptyTitle>

              <EmptyDescription>
                Create a new chat room to get started.
              </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
              <Button render={<Link href="/rooms/new" />}>
                Create a Chat Room
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <RoomList title="Your Rooms" rooms={joinedRooms} isJoined />

        <RoomList
          title="Public Rooms"
          rooms={publicRooms.filter(
            (room) => !joinedRooms.some((r) => r.id === room.id)
          )}
          isJoined={false}
        />
      </div>
    </>
  );
}

function RoomList({
  title,
  rooms,
  isJoined = false,
}: {
  title: string;
  rooms: { id: string; name: string; memberCount: number }[];
  isJoined: boolean;
}) {
  if (rooms.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl">{title}</h2>

          <Button render={<Link href="/rooms/new" />}>
            Create Room
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
          {rooms.map((room) => (
            <RoomCard {...room} key={room.id} isJoined={isJoined} />
          ))}
        </div>
      </div>
    </>
  );
}

function RoomCard({
  id,
  name,
  memberCount,
  isJoined,
}: {
  id: string;
  name: string;
  memberCount: number;
  isJoined: boolean;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{name}</CardTitle>

          <CardDescription>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex gap-2">
          {isJoined ? (
            <>
              <Button
                render={<Link href={`/rooms/${id}`} />}
                className="grow"
                size="sm"
              >
                Enter
              </Button>

              <LeaveRoomButton
                roomId={id}
                size="sm"
                variant="destructive"
              />
            </>
          ) : (
            <JoinRoomButton roomId={id} variant="outline" className="grow" size="sm" />
          )}
        </CardFooter>
      </Card>
    </>
  );
}

async function getPublicRooms() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chat_room")
    .select("id, name, chat_room_members(count)")
    .eq("is_public", true)
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return data.map((room) => ({
    id: room.id,
    name: room.name,
    memberCount: room.chat_room_members[0]?.count ?? 0,
  }));
}

async function getJoinedRooms(userId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("chat_room")
    .select("id, name, chat_room_members(member_id)")
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return data
    .filter((room) =>
      room.chat_room_members.some(
        (u) => u.member_id === userId
      )
    )
    .map((room) => ({
      id: room.id,
      name: room.name,
      memberCount: room.chat_room_members.length,
    }));
}
