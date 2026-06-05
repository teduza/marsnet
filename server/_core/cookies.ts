import type { Request } from "express";
import { ENV } from "./env";

export function getSessionCookieOptions(req: Request) {
  const isProd = ENV.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax" | "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}
