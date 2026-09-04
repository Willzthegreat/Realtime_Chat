"use client";

import { useEffect, useState } from "react";
import { ChatInput } from "@/src/components/chat-input";
import type { Message } from "@/src/services/supabase/actions/messages";
import { createClient } from "@/src/services/supabase/client";
import { UserIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/src/lib/utils";
import { InviteUserModal } from "@/src/components/invite-user-modal";



export function RoomClient({
  room,
  user,
  message,
}: {
  user: { id: string };
  room: { id: string; name: string };
  message: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(message);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const topic = `room:${room.id}:messages`;
    let disposed = false;

    const channel = supabase
      .channel(topic, {
        config: {
          private: true,
          presence: {
            key: user.id,
          },
        },
      })
      .on("presence", { event: "sync" }, updateOnlineCount)
      .on("presence", { event: "join" }, updateOnlineCount)
      .on("presence", { event: "leave" }, updateOnlineCount)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `chat_room_id=eq.${room.id}`,
        },
        (payload) => {
          const incoming = payload.new as {
            id: string;
            text: string;
            created_at: string;
            author_id: string;
          };

          setMessages((current) => {
            if (current.some((item) => item.id === incoming.id)) {
              return current;
            }

            const newMessage = {
              ...incoming,
              author: {
                name:
                  incoming.author_id === user.id
                    ? "You"
                    : "User",
                image_url: null,
              },
            } as Message;

            return [...current, newMessage];
          });
        },
      )
      .on("broadcast", { event: "INSERT" }, (payload) => {
        const record = payload.payload as {
          id: string;
          text: string;
          created_at: string;
          author_name: string;
          author_image_url: string | null;
        };

        if (!record) return;

        setMessages((current) => {
          if (current.some((item) => item.id === record.id)) {
            return current;
          }

          return [
            ...current,
            {
              id: record.id,
              text: record.text,
              created_at: record.created_at,
              author_id: user.id,
              author: {
                name: record.author_name,
                image_url: record.author_image_url,
              },
            },
          ];
        });
      })
      .subscribe((status, error) => {
        // Removing a channel during effect cleanup intentionally produces a
        // CLOSED status. Do not report that expected lifecycle event as an
        // application error.
        if (disposed) return;

        if (status === "SUBSCRIBED") {
          void (async () => {
            const { error: trackError } = await channel.track({
              user_id: user.id,
            });

            if (disposed) return;

            if (trackError) {
              console.error("Room presence tracking failed:", trackError);
              return;
            }

            updateOnlineCount();
          })();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Room realtime subscription failed:", status, error);
        }
      });

    function updateOnlineCount() {
      const state = channel.presenceState<{ user_id?: string }>();
      const onlineUsers = new Set(
        Object.values(state).flatMap((presences) =>
          presences
            .map((presence) => presence.user_id)
            .filter((userId): userId is string => Boolean(userId)),
        ),
      );

      // The current user is online as soon as this channel is subscribed,
      // even if Presence has not emitted its first sync event yet.
      onlineUsers.add(user.id);
      setOnlineCount(onlineUsers.size);
    }

    return () => {
      disposed = true;
      setOnlineCount(0);
      void supabase.removeChannel(channel);
    };
  }, [room.id, user.id]);

  return (
    <div className="container mx-auto h-screen-with-header max-w-3xl border border-y-0 flex flex-col">
      <div className="border-b p-4 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold">{room.name}</div>

          <div className="text-sm text-muted-foreground">
            {onlineCount} {onlineCount === 1 ? "user" : "users"} online
          </div>
        </div>

        <InviteUserModal roomId={room.id} />
      </div>

      <div
        className="grow overflow-y-auto space-y-3 p-4 flex flex-col"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
        }}
      >
        {messages.length ? (
          messages.map((item) => (
            <ChatMessage key={item.id} message={item} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No messages yet.
          </p>
        )}
      </div>

      <ChatInput
        roomId={room.id}
        authorId={user.id}
        onSent={(newMessage) =>
          setMessages((current) => {
            if (current.some((item) => item.id === newMessage.id)) {
              return current;
            }

            return [...current, newMessage];
          })
        }
      />
    </div>
  );
}

function ChatMessage({
  message,
  status,
}: {
  message: Message;
  status?: "pending" | "error" | "success";
}) {
  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-2 hover:bg-accent/50",
        status === "pending" && "opacity-80",
        status === "error" && "bg-red-500/80",
        status === "success" && "bg-green-500/80",
      )}
    >
      <div className="shrink-0">
        {message.author.image_url != null ? (
          <Image
            src={message.author.image_url}
            alt={message.author.name}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full" 
          />
        ) : (
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
            <UserIcon className="size-7.5 rounded-full mt-2.5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-100">{message.author.name}</p>
          {status && (
            <span
              className="text-xs text-muted-foreground"
              role="status"
              aria-label={`Message ${status}`}
            >
              {status === "pending" && "Sending…"}
              {status === "success" && "Sent"}
              {status === "error" && "Failed"}
            </span>
          )}
        </div>

        <p className="wrap-break-words whitespace-pre-wrap">{message.text}</p>

        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(message.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
