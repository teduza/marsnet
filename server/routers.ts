import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { messagesRouter } from "./routers/messages";
import { contactsRouter } from "./routers/contacts";
import { adminRouter } from "./routers/admin";
import { profileRouter } from "./routers/profile";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => {
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Dev-only mock login for testing when OAuth is missing
    devLogin: publicProcedure.mutation(({ ctx }) => {
      // Allow dev login in production for initial setup verification
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Set a mock session cookie
      ctx.res.cookie(COOKIE_NAME, "mock-session-id", cookieOptions);
      return { success: true };
    }),
  }),

  messages: messagesRouter,
  contacts: contactsRouter,
  admin: adminRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
