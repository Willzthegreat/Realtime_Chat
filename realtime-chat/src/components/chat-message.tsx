import { Message } from "../services/supabase/actions/messages";


export function ChatMessage(message: Message) {
    return message.text;
}