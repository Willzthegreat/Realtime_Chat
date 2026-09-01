"use client";

import { InputGroup, InputGroupTextarea, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { SendIcon } from "lucide-react";
import { useState } from "react";
import { sendMessage } from "@/src/services/supabase/actions/messages";
import type { Message } from "@/src/services/supabase/actions/messages";

export function ChatInput({ roomId, onSent }: { roomId: string; authorId: string; onSent: (message: Message) => void }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    
    setMessage("")
    setSending(true);
    const result = await sendMessage({ roomId, text });
    if (result.error) {
      console.error(result.message);
    } else {
      setMessage("");
      onSent(result.message);
    }

    setSending(false);
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
        disabled={sending}
        />
      <InputGroupAddon align="inline-end">
        <InputGroupButton type="submit" aria-label="send" title="Send" size="icon-sm" disabled={sending || !message.trim()}><SendIcon /></InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  </form>;
}
