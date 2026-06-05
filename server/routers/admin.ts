import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import * as db from "../db";
import { adminProcedure, router } from "../_core/trpc";

export const adminRouter = router({
  // List all users (active and inactive)
  listUsers: adminProcedure.query(async () => {
    return db.getAllUsers();
  }),

  // Create a new user account (admin only — no public registration)
  createUser: adminProcedure
    .input(
      z.object({
        openId: z.string().min(1),
        name: z.string().min(1),
        email: z.email().optional(),
        displayName: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        role: z.enum(["user", "admin"]).default("user"),
      })
    )
    .mutation(async ({ input }) => {
      // Check if openId already exists
      const existing = await db.getUserByOpenId(input.openId);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this OpenID already exists",
        });
      }

      await db.upsertUser({
        openId: input.openId,
        name: input.name,
        email: input.email ?? null,
        displayName: input.displayName ?? null,
        department: input.department ?? null,
        position: input.position ?? null,
        role: input.role,
        isActive: true,
        lastSignedIn: new Date(),
      });

      return { success: true };
    }),

  // Update user profile and role
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        displayName: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, ...data } = input;
      const user = await db.getUserById(userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await db.updateUser(userId, {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      });

      return { success: true };
    }),

  // Activate a user account
  activateUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      await db.updateUser(input.userId, { isActive: true });
      return { success: true };
    }),

  // Deactivate a user account
  deactivateUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot deactivate your own account",
        });
      }
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      await db.updateUser(input.userId, { isActive: false });
      return { success: true };
    }),

  // Promote user to admin
  promoteToAdmin: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db.updateUser(input.userId, { role: "admin" });
      return { success: true };
    }),

  // Demote admin to user
  demoteToUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote yourself",
        });
      }
      await db.updateUser(input.userId, { role: "user" });
      return { success: true };
    }),
});
