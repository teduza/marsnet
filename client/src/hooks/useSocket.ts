import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type PresenceUpdate = {
  userId: number;
  isOnline: boolean;
  lastSeenAt: string | null;
};

export type IncomingMessage = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  readAt: string | null;
};

type SocketEvents = {
  onPresenceUpdate?: (data: PresenceUpdate) => void;
  onNewMessage?: (data: IncomingMessage) => void;
  onMessagesRead?: (data: { by: number; from: number }) => void;
};

let sharedSocket: Socket | null = null;
let socketRefCount = 0;

function getOrCreateSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(window.location.origin, {
      path: "/api/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return sharedSocket;
}

export function useSocket(events: SocketEvents, enabled = true) {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!enabled) return;

    const socket = getOrCreateSocket();
    socketRef.current = socket;
    socketRefCount++;

    const handlePresence = (data: PresenceUpdate) => {
      eventsRef.current.onPresenceUpdate?.(data);
    };
    const handleNewMessage = (data: IncomingMessage) => {
      eventsRef.current.onNewMessage?.(data);
    };
    const handleMessagesRead = (data: { by: number; from: number }) => {
      eventsRef.current.onMessagesRead?.(data);
    };

    socket.on("presence_update", handlePresence);
    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("presence_update", handlePresence);
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
      socketRefCount--;
      if (socketRefCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        socketRefCount = 0;
      }
    };
  }, [enabled]);

  const sendMessage = useCallback(
    (receiverId: number, content: string): Promise<IncomingMessage> => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current ?? sharedSocket;
        if (!socket) { reject(new Error("Not connected")); return; }
        socket.emit(
          "send_message",
          { receiverId, content },
          (response: { success?: boolean; message?: IncomingMessage; error?: string }) => {
            if (response?.error) reject(new Error(response.error));
            else if (response?.message) resolve(response.message);
            else reject(new Error("Unknown error"));
          }
        );
      });
    },
    []
  );

  const markRead = useCallback((senderId: number) => {
    const socket = socketRef.current ?? sharedSocket;
    socket?.emit("mark_read", { senderId });
  }, []);

  return { sendMessage, markRead, socket: socketRef.current };
}
