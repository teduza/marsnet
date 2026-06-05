import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { sdk } from "./_core/sdk";
import * as db from "./db";

export type PresencePayload = {
  userId: number;
  isOnline: boolean;
  lastSeenAt: string | null;
};

export type MessagePayload = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  readAt: string | null;
};

let io: SocketIOServer | null = null;

/** Map from userId → Set of socket IDs */
const userSockets = new Map<number, Set<string>>();

function addUserSocket(userId: number, socketId: string) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(socketId);
}

function removeUserSocket(userId: number, socketId: string) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) userSockets.delete(userId);
}

function isUserOnline(userId: number): boolean {
  const sockets = userSockets.get(userId);
  return !!sockets && sockets.size > 0;
}

export function setupSocketIO(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*", credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      // Authenticate via session cookie passed in handshake auth
      const cookie = socket.handshake.headers.cookie ?? "";
      const fakeReq = {
        headers: { cookie },
        protocol: "https",
      } as Parameters<typeof sdk.authenticateRequest>[0];

      const user = await sdk.authenticateRequest(fakeReq);
      if (!user || !user.isActive) {
        return next(new Error("Unauthorized"));
      }
      (socket as unknown as Record<string, unknown>).marsUser = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = (socket as unknown as Record<string, unknown>).marsUser as Awaited<ReturnType<typeof sdk.authenticateRequest>>;
    const userId = user.id;

    addUserSocket(userId, socket.id);

    // Mark user online in DB
    await db.setUserOnline(userId, true);

    // Broadcast presence to all connected clients
    broadcastPresence(userId, true);

    socket.on("disconnect", async () => {
      removeUserSocket(userId, socket.id);

      // Only mark offline if no more sockets for this user
      if (!isUserOnline(userId)) {
        await db.setUserOnline(userId, false);
        broadcastPresence(userId, false);
      }
    });

    // Client requests to send a message
    socket.on("send_message", async (data: { receiverId: number; content: string }, ack) => {
      try {
        if (!data.receiverId || !data.content?.trim()) {
          ack?.({ error: "Invalid message" });
          return;
        }

        const result = await db.createMessage({
          senderId: userId,
          receiverId: data.receiverId,
          content: data.content.trim(),
          createdAt: new Date(),
        });

        const messageId = result?.id ?? Date.now();
        const payload: MessagePayload = {
          id: messageId,
          senderId: userId,
          receiverId: data.receiverId,
          content: data.content.trim(),
          createdAt: new Date().toISOString(),
          readAt: null,
        };

        // Deliver to sender's other sockets
        const senderSockets = userSockets.get(userId);
        if (senderSockets) {
          Array.from(senderSockets).forEach(sid => {
            if (sid !== socket.id) io?.to(sid).emit("new_message", payload);
          });
        }

        // Deliver to receiver
        const receiverSockets = userSockets.get(data.receiverId);
        if (receiverSockets) {
          Array.from(receiverSockets).forEach(sid => {
            io?.to(sid).emit("new_message", payload);
          });
        }

        ack?.({ success: true, message: payload });
      } catch (err) {
        console.error("[Socket] send_message error:", err);
        ack?.({ error: "Failed to send message" });
      }
    });

    // Client marks messages as read
    socket.on("mark_read", async (data: { senderId: number }) => {
      try {
        await db.markMessagesRead(data.senderId, userId);
        // Notify the original sender that their messages were read
        const senderSockets = userSockets.get(data.senderId);
        if (senderSockets) {
          Array.from(senderSockets).forEach(sid => {
            io?.to(sid).emit("messages_read", { by: userId, from: data.senderId });
          });
        }
      } catch (err) {
        console.error("[Socket] mark_read error:", err);
      }
    });
  });

  return io;
}

function broadcastPresence(userId: number, isOnline: boolean) {
  if (!io) return;
  const payload: PresencePayload = {
    userId,
    isOnline,
    lastSeenAt: isOnline ? null : new Date().toISOString(),
  };
  // Broadcast to all connected sockets
  io.emit("presence_update", payload);
}

export function getIO() {
  return io;
}
