import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import * as db from "../db";
import { getIO } from "../realtime";
import { protectedProcedure, router } from "../_core/trpc";

export const messagesRouter = router({  // Send a direct message to another user
  send: protectedProcedure
    .input(
      z.object({
        receiverId: z.number().int().positive(),
        content: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const receiver = await db.getUserById(input.receiverId);
      if (!receiver || !receiver.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
      }
      if (input.receiverId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot send message to yourself" });
      }

      const result = await db.createMessage({
        senderId: ctx.user.id,
        receiverId: input.receiverId,
        content: input.content,
      });

      const msgId = result?.id;
      if (!msgId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save message" });

      // Fetch the saved message to return full object
      const [saved] = await db.getConversation(ctx.user.id, input.receiverId, 1);

      // Broadcast via Socket.io if available
      const io = getIO();
      if (io && saved) {
        const payload = { ...saved };
        io.to(`user:${input.receiverId}`).emit("new_message", payload);
        io.to(`user:${ctx.user.id}`).emit("new_message", payload);
      }

      return saved ?? { id: msgId };
    }),

  // Get conversation history between current user and another user
  getHistory: protectedProcedure
    .input(
      z.object({
        partnerId: z.number().int().positive(),
        limit: z.number().int().min(1).max(100).default(50),
        beforeId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const partner = await db.getUserById(input.partnerId);
      if (!partner || !partner.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const msgs = await db.getConversation(
        ctx.user.id,
        input.partnerId,
        input.limit,
        input.beforeId
      );

      // Return in chronological order
      return msgs.reverse();
    }),

  // Mark messages from a sender as read
  markRead: protectedProcedure
    .input(z.object({ senderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.markMessagesRead(input.senderId, ctx.user.id);
      return { success: true };
    }),

  // Get unread count from a specific sender
  getUnreadCount: protectedProcedure
    .input(z.object({ senderId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const count = await db.getUnreadCount(ctx.user.id, input.senderId);
      return { count };
    }),

  // Get last message per conversation partner (for sidebar preview)
  getConversationPreviews: protectedProcedure.query(async ({ ctx }) => {
    const allMessages = await db.getLastMessages(ctx.user.id);
    const seen = new Set<number>();
    const previews: typeof allMessages = [];

    for (const msg of allMessages) {
      const partnerId = msg.senderId === ctx.user.id ? msg.receiverId : msg.senderId;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        previews.push(msg);
      }
    }

    return previews;
  }),
});
