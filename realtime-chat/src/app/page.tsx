
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

// Import your LeaveRoomButton
import { LeaveRoomButton } from "../components/leaveRoomButton";
import { JoinRoomButton } from "../components/join-room-button";

type Room = {
  id: string;
  name: string;
  memberCount: number;
  isJoined: boolean;
};

export default async function Home() {
  const user = await getCurrentUser();

  if (user == null) {
    redirect("/auth/login");
  }

  const { publicRooms, joinedRooms } = await getRoomsForUser(user.id);

  const uniqueJoinedRooms = deduplicateRooms(joinedRooms);
  const uniquePublicRooms = deduplicateRooms(publicRooms);

  if (uniquePublicRooms.length === 0 && uniqueJoinedRooms.length === 0) {
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
        <RoomList title="Your Rooms" rooms={uniqueJoinedRooms} />

        <RoomList
          title="Public Rooms"
          rooms={uniquePublicRooms}
        />
      </div>
    </>
  );
}

function normalizeRoomName(name: string) {
  return name.trim().toLowerCase().replace(/[+_-]/g, "");
}

function deduplicateRooms(
  rooms: Room[]
) {
  const seenNames = new Set<string>();

  return rooms.filter((room) => {
    const normalizedName = normalizeRoomName(room.name);

    if (seenNames.has(normalizedName)) {
      return false;
    }

    seenNames.add(normalizedName);
    return true;
  });
}

function RoomList({
  title,
  rooms,
}: {
  title: string;
  rooms: Room[];
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
            <RoomCard {...room} key={room.id} />
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
                className="grow "
                size="sm"
              >
                Enter
              </Button>

              <LeaveRoomButton
                roomId={id}
                size="sm"
                variant="destructive"
                className="cursor-pointer "
              > 
              Leave
              </LeaveRoomButton> 
            </>
          ) : (
            <JoinRoomButton roomId={id} variant="outline" className="grow cursor-pointer" size="sm">
              Join
            </JoinRoomButton>
          )}
        </CardFooter>
      </Card>
    </>
  );
}

async function getRoomsForUser(userId: string) {
  const supabase = createAdminClient();

  const [{ data: rooms, error: roomsError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from("chat_room")
        .select("id, name, is_public")
        .order("name", { ascending: true }),
      supabase
        .from("chat_room_members")
        .select("chat_room_id, member_id"),
    ]);

  if (roomsError || membershipsError || rooms == null || memberships == null) {
    return { publicRooms: [], joinedRooms: [] };
  }

  const joinedRoomIds = new Set(
    memberships
      .filter((membership) => membership.member_id === userId)
      .map((membership) => membership.chat_room_id)
  );

  const roomsWithCounts = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    memberCount: memberships.filter(
      (membership) => membership.chat_room_id === room.id
    ).length,
    isPublic: room.is_public,
    isJoined: joinedRoomIds.has(room.id),
  }));

  return {
    joinedRooms: roomsWithCounts
      .filter((room) => !room.isPublic && room.isJoined)
      .map(({ id, name, memberCount, isJoined }) => ({ id, name, memberCount, isJoined })),
    publicRooms: roomsWithCounts
      .filter((room) => room.isPublic)
      .map(({ id, name, memberCount, isJoined }) => ({ id, name, memberCount, isJoined })),
  };
}
