import { initTRPC, TRPCError } from "@trpc/server";
import type { Request, Response } from "express";
import superjson from "superjson";
import { sdk } from "./sdk";

export interface Context {
  req: Request;
  res: Response;
  user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
}

export async function createTRPCContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  const user = await sdk.authenticateRequest(req);
  return { req, res, user };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.user.isActive) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.user.isActive || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});
