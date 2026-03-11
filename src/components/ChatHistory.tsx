import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User, Bot, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onClear?: () => void;
}

export default function ChatHistory({ messages, isLoading, onClear }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading chat history…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <Bot className="h-8 w-8 opacity-40" />
        <p className="text-sm">No messages yet</p>
        <p className="text-[10px]">Use the prompt bar to start a conversation</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs text-muted-foreground">{messages.length} messages</span>
        {onClear && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive" onClick={onClear}>
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-2">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass-strong"
                )}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</pre>
                <span className="block text-[9px] opacity-60 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5">
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
