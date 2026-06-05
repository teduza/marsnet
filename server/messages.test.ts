import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock the db module
vi.mock("./db", () => ({
  getConversation: vi.fn().mockResolvedValue([
    {
      id: 1,
      senderId: 1,
      receiverId: 2,
      content: "Hello!",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      readAt: null,
    },
  ]),
  getUserById: vi.fn().mockResolvedValue({
    id: 2,
    openId: "user_2",
    name: "Bob",
    displayName: "Bob Smith",
    email: "bob@example.com",
    isActive: true,
    isOnline: false,
    role: "user",
  }),
  markMessagesRead: vi.fn().mockResolvedValue(undefined),
  getUnreadCount: vi.fn().mockResolvedValue(3),
  getLastMessages: vi.fn().mockResolvedValue([
    {
      id: 1,
      senderId: 2,
      receiverId: 1,
      content: "Hello!",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      readAt: null,
    },
  ]),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  setUserOnline: vi.fn().mockResolvedValue(undefined),
}));

function createUserContext(userId = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: User = {
    id: userId,
    openId: `user_${userId}`,
    name: "Alice",
    displayName: "Alice Smith",
    email: "alice@example.com",
    loginMethod: "manus",
    role,
    isActive: true,
    isOnline: true,
    lastSeenAt: null,
    department: "Engineering",
    position: "Engineer",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("messages.getHistory", () => {
  it("returns conversation history between two users", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.getHistory({ partnerId: 2, limit: 50 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("messages.markRead", () => {
  it("marks messages as read and returns success", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.markRead({ senderId: 2 });
    expect(result).toEqual({ success: true });
  });
});

describe("messages.getUnreadCount", () => {
  it("returns unread message count from a sender", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.getUnreadCount({ senderId: 2 });
    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
  });
});

describe("messages.getConversationPreviews", () => {
  it("returns conversation previews for current user", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.messages.getConversationPreviews();
    expect(Array.isArray(result)).toBe(true);
  });
});
