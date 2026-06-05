import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import UserAvatar from "./UserAvatar";
import { Send, ArrowLeft, ChevronDown } from "lucide-react";
import { useSocket, type IncomingMessage } from "@/hooks/useSocket";
import { useLocation } from "wouter";
import type { PresenceUpdate } from "@/hooks/useSocket";

type Contact = {
  id: number;
  name: string | null;
  displayName: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  isOnline: boolean;
  lastSeenAt: Date | null;
  isActive: boolean;
};

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: Date | string;
  readAt: Date | string | null;
};

type Props = {
  partnerId: number;
  presenceMap: Map<number, boolean>;
  onNewMessage?: (msg: IncomingMessage) => void;
  onPresenceUpdate?: (p: PresenceUpdate) => void;
};

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDateGroup(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groups.push({ date: formatDateGroup(msg.createdAt), messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function ChatWindow({ partnerId, presenceMap, onNewMessage, onPresenceUpdate }: Props) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const { data: partner } = trpc.contacts.getUser.useQuery(
    { userId: partnerId },
    { enabled: !!partnerId }
  );

  const { data: history, isLoading } = trpc.messages.getHistory.useQuery(
    { partnerId, limit: 50 },
    { enabled: !!partnerId }
  );

  const markReadMutation = trpc.messages.markRead.useMutation();

  useEffect(() => {
    if (history) setMessages(history as Message[]);
  }, [history]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (partnerId && user) {
      markReadMutation.mutate({ senderId: partnerId });
      utils.messages.getConversationPreviews.invalidate();
    }
  }, [partnerId, user]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  };

  const { sendMessage, markRead } = useSocket(
    {
      onNewMessage: (msg) => {
        if (
          (msg.senderId === partnerId && msg.receiverId === user?.id) ||
          (msg.senderId === user?.id && msg.receiverId === partnerId)
        ) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, { ...msg, createdAt: new Date(msg.createdAt), readAt: msg.readAt ? new Date(msg.readAt) : null }];
          });
          // Mark as read if it's incoming
          if (msg.senderId === partnerId) {
            markRead(partnerId);
            utils.messages.getConversationPreviews.invalidate();
          }
        }
        onNewMessage?.(msg);
      },
      onPresenceUpdate: (p) => {
        onPresenceUpdate?.(p);
      },
    },
    true
  );

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || sending || !user) return;

    setSending(true);
    setInputValue("");

    try {
      const msg = await sendMessage(partnerId, content);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, { ...msg, createdAt: new Date(msg.createdAt), readAt: null }];
      });
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      setInputValue(content);
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOnline = presenceMap.get(partnerId) ?? partner?.isOnline ?? false;
  const displayName = partner?.displayName || partner?.name || partner?.email || "Unknown";
  const groups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <button
          onClick={() => setLocation("/")}
          className="md:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {partner && (
          <UserAvatar
            name={partner.name}
            displayName={partner.displayName}
            avatarUrl={partner.avatarUrl}
            isOnline={isOnline}
            showStatus
            size="md"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">
            {isOnline ? (
              <span className="text-emerald-500">● Online</span>
            ) : partner?.lastSeenAt ? (
              `Last seen ${new Date(partner.lastSeenAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
            ) : (
              "Offline"
            )}
          </p>
        </div>
        {partner?.department && (
          <span className="hidden sm:block text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
            {partner.department}
          </span>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            {partner && (
              <UserAvatar
                name={partner.name}
                displayName={partner.displayName}
                avatarUrl={partner.avatarUrl}
                size="lg"
                className="mb-4"
              />
            )}
            <p className="text-sm font-medium text-foreground mb-1">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              This is the beginning of your conversation.
            </p>
          </div>
        )}

        {groups.map((group, gi) => (
          <div key={gi}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground px-2">{group.date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {group.messages.map((msg, mi) => {
              const isSelf = msg.senderId === user?.id;
              const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
              const isGrouped = prevMsg && prevMsg.senderId === msg.senderId &&
                new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 60_000;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-2 transition-opacity duration-200",
                    isSelf ? "flex-row-reverse" : "flex-row",
                    isGrouped ? "mt-0.5" : "mt-3"
                  )}
                >
                  {/* Avatar (only for non-grouped other messages) */}
                  {!isSelf && (
                    <div className="w-8 flex-shrink-0">
                      {!isGrouped && partner && (
                        <UserAvatar
                          name={partner.name}
                          displayName={partner.displayName}
                          avatarUrl={partner.avatarUrl}
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[70%] sm:max-w-[60%] flex flex-col gap-1",
                      isSelf ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "px-3.5 py-2 text-sm leading-relaxed break-words",
                        isSelf ? "msg-bubble-self" : "msg-bubble-other"
                      )}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-xs text-muted-foreground/60">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isSelf && msg.readAt && (
                        <span className="text-xs text-primary">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-6 w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-accent transition-colors duration-150 z-10"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-card/50">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${displayName}…`}
              rows={1}
              className={cn(
                "w-full resize-none bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
                "transition-all duration-150 max-h-32 overflow-y-auto"
              )}
              style={{ minHeight: "42px" }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 btn-press flex-shrink-0",
              inputValue.trim() && !sending
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground/40 mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
