import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import UserAvatar from "./UserAvatar";
import { Search, Settings, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PresenceUpdate, IncomingMessage } from "@/hooks/useSocket";

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

type Props = {
  presenceMap: Map<number, boolean>;
  lastMessages: Map<number, IncomingMessage>;
  unreadCounts: Map<number, number>;
};

function formatLastSeen(date: Date | null): string {
  if (!date) return "Offline";
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function ContactList({ presenceMap, lastMessages, unreadCounts }: Props) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ userId?: string }>();
  const activeUserId = params.userId ? parseInt(params.userId) : null;

  const [search, setSearch] = useState("");

  const { data: contacts = [] } = trpc.contacts.list.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (contacts as Contact[]).filter(c => {
      const name = (c.displayName || c.name || "").toLowerCase();
      const dept = (c.department || "").toLowerCase();
      return name.includes(q) || dept.includes(q);
    });
  }, [contacts, search]);

  // Sort: online first, then by name
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aOnline = presenceMap.get(a.id) ?? a.isOnline;
      const bOnline = presenceMap.get(b.id) ?? b.isOnline;
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      const aName = a.displayName || a.name || "";
      const bName = b.displayName || b.name || "";
      return aName.localeCompare(bName);
    });
  }, [filtered, presenceMap]);

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground tracking-wide">MARSNet</span>
        </div>
        <div className="flex items-center gap-1">
          {user?.role === "admin" && (
            <button
              onClick={() => setLocation("/admin")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors duration-150"
              title="Admin Panel"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="pl-8 h-8 bg-sidebar-accent border-sidebar-border text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Online count */}
      <div className="px-4 py-1">
        <span className="text-xs text-muted-foreground">
          {sorted.filter(c => presenceMap.get(c.id) ?? c.isOnline).length} online
        </span>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No contacts found</p>
          </div>
        )}
        {sorted.map(contact => {
          const isOnline = presenceMap.get(contact.id) ?? contact.isOnline;
          const lastMsg = lastMessages.get(contact.id);
          const unread = unreadCounts.get(contact.id) ?? 0;
          const isActive = activeUserId === contact.id;

          return (
            <button
              key={contact.id}
              onClick={() => setLocation(`/chat/${contact.id}`)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
              )}
            >
              <UserAvatar
                name={contact.name}
                displayName={contact.displayName}
                avatarUrl={contact.avatarUrl}
                isOnline={isOnline}
                showStatus
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {contact.displayName || contact.name || contact.email || "Unknown"}
                  </span>
                  {unread > 0 && (
                    <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {lastMsg
                      ? lastMsg.content.slice(0, 35) + (lastMsg.content.length > 35 ? "…" : "")
                      : contact.position || contact.department || (isOnline ? "Online" : formatLastSeen(contact.lastSeenAt))}
                  </span>
                  {!isOnline && contact.lastSeenAt && !lastMsg && (
                    <span className="text-xs text-muted-foreground/60 flex-shrink-0 ml-1">
                      {formatLastSeen(contact.lastSeenAt)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current user footer */}
      {user && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-2">
            <UserAvatar
              name={user.name}
              displayName={(user as unknown as { displayName?: string }).displayName}
              size="sm"
              isOnline
              showStatus
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {(user as unknown as { displayName?: string }).displayName || user.name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.role === "admin" ? "Administrator" : "Employee"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
