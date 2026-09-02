"use client";

import { InputGroup, InputGroupTextarea, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { SendIcon } from "lucide-react";
import { useRef, useState } from "react";
import { sendMessage } from "@/src/services/supabase/actions/messages";
import type { Message } from "@/src/services/supabase/actions/messages";

export function ChatInput({ roomId, onSent }: { roomId: string; authorId: string; onSent: (message: Message) => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const pendingMessages = useRef<string[]>([]);
  const processingQueue = useRef(false);

  function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = message.trim();
    if (!text) return;

    pendingMessages.current.push(text);
    setMessage("");

    if (processingQueue.current) return;

    processingQueue.current = true;
    setSending(true);

    void (async () => {
      try {
        while (pendingMessages.current.length > 0) {
          const nextMessage = pendingMessages.current.shift();
          if (!nextMessage) continue;

          const result = await sendMessage({ roomId, text: nextMessage });
          if (result.error) {
            console.error(result.message);
            setMessage((current) => current || nextMessage);
          } else {
            onSent(result.message);
          }
        }
      } finally {
        processingQueue.current = false;
        setSending(false);
      }
    })();
  }

  return <form className="p-3" onSubmit={handleSubmit}>
    <InputGroup>
      <InputGroupTextarea 
        placeholder="Type your message..." 
        value={message} 
        className="field-sizing-content min-h-auto" 
        onChange={(event) => setMessage(event.target.value)} 
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        />
      <InputGroupAddon align="inline-end">
        <InputGroupButton type="submit" aria-label="send" title="Send" size="icon-sm" disabled={sending || !message.trim()}><SendIcon /></InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </form>;
}
