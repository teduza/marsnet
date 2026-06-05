import { useState, useCallback } from "react";
import { useParams } from "wouter";
import { cn } from "@/lib/utils";
import ContactList from "@/components/ContactList";
import ChatWindow from "@/components/ChatWindow";
import { MessageSquare } from "lucide-react";
import type { PresenceUpdate, IncomingMessage } from "@/hooks/useSocket";

export default function MessengerPage() {
  const params = useParams<{ userId?: string }>();
  const activePartnerId = params.userId ? parseInt(params.userId) : null;

  // Presence map: userId → isOnline
  const [presenceMap, setPresenceMap] = useState<Map<number, boolean>>(new Map());
  // Last messages per partner (for sidebar preview)
  const [lastMessages, setLastMessages] = useState<Map<number, IncomingMessage>>(new Map());
  // Unread counts per partner
  const [unreadCounts, setUnreadCounts] = useState<Map<number, number>>(new Map());

  const handlePresenceUpdate = useCallback((update: PresenceUpdate) => {
    setPresenceMap(prev => {
      const next = new Map(prev);
      next.set(update.userId, update.isOnline);
      return next;
    });
  }, []);

  const handleNewMessage = useCallback((msg: IncomingMessage) => {
    const partnerId = msg.senderId;
    setLastMessages(prev => {
      const next = new Map(prev);
      next.set(partnerId, msg);
      return next;
    });
    // Increment unread if not currently viewing this conversation
    if (activePartnerId !== partnerId) {
      setUnreadCounts(prev => {
        const next = new Map(prev);
        next.set(partnerId, (next.get(partnerId) ?? 0) + 1);
        return next;
      });
    }
  }, [activePartnerId]);

  // Clear unread when opening a conversation
  const handleOpenChat = useCallback((partnerId: number) => {
    setUnreadCounts(prev => {
      const next = new Map(prev);
      next.delete(partnerId);
      return next;
    });
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — contact list */}
      <div
        className={cn(
          "flex-shrink-0 border-r border-border transition-all duration-200",
          // On mobile: hide sidebar when chat is open
          activePartnerId
            ? "hidden md:flex md:w-72 lg:w-80"
            : "flex w-full md:w-72 lg:w-80"
        )}
      >
        <div className="w-full">
          <ContactList
            presenceMap={presenceMap}
            lastMessages={lastMessages}
            unreadCounts={unreadCounts}
          />
        </div>
      </div>

      {/* Main chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !activePartnerId ? "hidden md:flex" : "flex"
        )}
      >
        {activePartnerId ? (
          <div className="relative flex-1 flex flex-col overflow-hidden">
            <ChatWindow
              key={activePartnerId}
              partnerId={activePartnerId}
              presenceMap={presenceMap}
              onNewMessage={handleNewMessage}
              onPresenceUpdate={handlePresenceUpdate}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <MessageSquare className="w-8 h-8 text-primary/60" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Choose a contact from the sidebar to start messaging.
      </p>
    </div>
  );
}
