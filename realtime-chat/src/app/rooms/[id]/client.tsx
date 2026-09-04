"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
  const [onlineCount, setOnlineCount] = useState(0);
  const {
    loadMoreMessages,
    messages: oldMessages,
    status,
    triggerQueryRef,
    addMessage,
  } = useInfiniteScrollChat({
    roomId: room.id,
    startingMessages: message.toReversed(),
  });

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
      .on("broadcast", { event: "INSERT" }, (payload) => {
        const record = payload.payload as {
          id: string;
          text: string;
          created_at: string;
          author_name: string;
          author_image_url: string | null;
        };

        if (!record) return;

        addMessage({
          id: record.id,
          text: record.text,
          created_at: record.created_at,
          author_id: user.id,
          author: {
            name: record.author_name,
            image_url: record.author_image_url,
          },
        } as Message);
      })
      .subscribe((status, error) => {
        if (disposed) return;

        if (status === "SUBSCRIBED") {
          void (async () => {
            const trackStatus = await channel.track({
              user_id: user.id,
            });

            if (disposed) return;

            if (trackStatus !== "ok") {
              console.error("Room presence tracking failed:", trackStatus);
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

      onlineUsers.add(user.id);
      setOnlineCount(onlineUsers.size);
    }

    return () => {
      disposed = true;
      setOnlineCount(0);
      void supabase.removeChannel(channel);
    };
  }, [addMessage, room.id, user.id]);

  const displayedMessages = useMemo(
    () => oldMessages.toReversed(),
    [oldMessages],
  );

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
        {displayedMessages.length ? (
          displayedMessages.map((item, index) => (
            <div key={item.id} ref={index === 0 ? triggerQueryRef : undefined}>
              <ChatMessage message={item} />
            </div>
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
        onSent={addMessage}
      />

      {status === "loading" && (
        <p className="px-4 pb-2 text-center text-xs text-muted-foreground">
          Loading more message ....
        </p>
      )}

      {status === "error" && (
        <button
          type="button"
          className="pb-2 text-center text-xs text-destructive"
          onClick={() => void loadMoreMessages()}
        >
          Error loading messages.
        </button>
      )}
    </div>
  );
}

const ChatMessage = memo(function ChatMessage({
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
            width={40}
            height={40}
            sizes="40px"
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
            <UserIcon className="size-7.5 rounded-full mt-2.5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-100">
            {message.author.name}
          </p>

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

        <p className="wrap-break-words whitespace-pre-wrap">
          {message.text}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(message.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
});

const LIMIT = 25;

function useInfiniteScrollChat({
  startingMessages,
  roomId,
  // authorId
}: {
  startingMessages: Message[];
  roomId: string;
  // authorId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(startingMessages);

  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "done"
  >("idle");

  async function loadMoreMessages() {
    if (status === "loading" || status === "done") return;

    const supabase = createClient();

    setStatus("loading");

    const { data: newMessages, error } = await supabase
      .from("message")
      .select(
        "id, text, created_at, author_id, author:user_profile(name, image_url)"
      )
      .eq("chat_room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(LIMIT)
      .lt(
        "created_at",
        messages.at(-1)?.created_at ?? new Date().toISOString()
      );

    if (error) {
      setStatus("error");
      return;
    }

    const messagesToAdd = (newMessages ?? []) as Message[];

    setMessages((prev) => [...prev, ...messagesToAdd.toReversed()]);

    setStatus(
      messagesToAdd.length < LIMIT ? "done" : "idle"
    );
  }

  function triggerQueryRef(node: HTMLDivElement | null) {
    if (node == null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && entry.target === node) {
          observer.unobserve(node);
          void loadMoreMessages();
        }
      },
      {
        rootMargin: "50px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }

  const addMessage = useCallback((newMessage: Message) => {
    setMessages((current) => {
      if (current.some((item) => item.id === newMessage.id)) {
        return current;
      }

      return [newMessage, ...current];
    });
  }, []);

  return {
    messages,
    status,
    loadMoreMessages,
    triggerQueryRef,
    addMessage,
  };
}
