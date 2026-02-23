"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useMessages } from "@/hooks/use-messages";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OtherUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ka-GE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
  });
}

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { messages, loading, sending, sendMessage } = useMessages(
    conversationId,
    user?.id,
  );

  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchOtherUser = useCallback(async () => {
    if (!conversationId || !user) return;
    const { data: conv } = await supabase
      .from("conversations")
      .select("participant_1, participant_2")
      .eq("id", conversationId)
      .single();

    if (!conv) return;
    const otherId =
      conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", otherId)
      .single();

    if (profile) setOtherUser(profile);
  }, [conversationId, user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchOtherUser();
  }, [user, fetchOtherUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const ok = await sendMessage(input);
    if (ok) setInput("");
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const otherName =
    otherUser?.display_name || otherUser?.username || "მომხმარებელი";
  const otherInitials = otherName.slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <div className="mx-auto flex max-w-lg flex-col" style={{ height: "calc(100vh - 8rem)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-3">
          <Link
            href="/messages"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {otherUser ? (
            <Link
              href={otherUser.username ? `/u/${otherUser.username}` : "#"}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <Avatar className="h-9 w-9 ring-1 ring-seal/10">
                <AvatarImage src={otherUser.avatar_url ?? undefined} />
                <AvatarFallback className="bg-seal-muted text-seal text-xs font-medium">
                  {otherInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{otherName}</p>
                {otherUser.username && (
                  <p className="text-xs text-muted-foreground">
                    @{otherUser.username}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <Skeleton className="h-9 w-32" />
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-1.5 overflow-y-auto py-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    "h-8 w-48 rounded-2xl",
                    i % 2 === 0 ? "ml-auto" : "",
                  )}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              დაწერე პირველი მესიჯი
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user.id;
                const showDate =
                  i === 0 ||
                  formatDate(msg.created_at) !==
                    formatDate(messages[i - 1].created_at);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="my-3 text-center text-[10px] text-muted-foreground">
                        {formatDate(msg.created_at)}
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex",
                        isMine ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                          isMine
                            ? "rounded-br-md bg-seal text-seal-foreground"
                            : "rounded-bl-md bg-card border",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <span
                          className={cn(
                            "mt-0.5 block text-right text-[10px]",
                            isMine
                              ? "text-seal-foreground/60"
                              : "text-muted-foreground",
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t pt-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="დაწერე მესიჯი..."
            className="flex-1 rounded-full border bg-card px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-seal/30"
            autoComplete="off"
          />
          <Button
            type="submit"
            variant="seal"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
