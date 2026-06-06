import type { Request } from "express";
import { ENV } from "./env";

export function getSessionCookieOptions(req: Request) {
  const isProd = ENV.nodeEnv === "production";
  // On Render, we usually have a proxy that handles SSL.
  // "none" sameSite requires "secure: true".
  // If we're on a subdomain or across domains, we might need "none".
  // But for standard Render deployment, "lax" is often safer to start.
  return {
    httpOnly: true,
    secure: isProd, 
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}
