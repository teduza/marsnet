import { z } from "zod/v4";
import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const contactsRouter = router({
  // List all active users (contacts) with presence info
  list: protectedProcedure.query(async ({ ctx }) => {
    const allUsers = await db.getAllActiveUsers();
    // Exclude self
    return allUsers.filter(u => u.id !== ctx.user.id);
  }),

  // Get a single user's profile
  getUser: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user || !user.isActive) return null;
      return {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        department: user.department,
        position: user.position,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt,
      };
    }),
});
