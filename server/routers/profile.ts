import { z } from "zod/v4";
import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const profileRouter = router({
  // Get current user's full profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    return user ?? null;
  }),

  // Update own display name, department, position
  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().max(128).optional(),
        department: z.string().max(128).optional(),
        position: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.updateUser(ctx.user.id, {
        ...(input.displayName !== undefined && { displayName: input.displayName }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.position !== undefined && { position: input.position }),
      });
      return { success: true };
    }),
});
