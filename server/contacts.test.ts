import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

vi.mock("./db", () => ({
  getAllActiveUsers: vi.fn().mockResolvedValue([
    {
      id: 2,
      name: "Bob",
      displayName: "Bob Smith",
      email: "bob@example.com",
      department: "Engineering",
      position: "Engineer",
      avatarUrl: null,
      role: "user",
      isOnline: true,
      lastSeenAt: null,
      isActive: true,
    },
    {
      id: 3,
      name: "Carol",
      displayName: "Carol Jones",
      email: "carol@example.com",
      department: "Marketing",
      position: "Manager",
      avatarUrl: null,
      role: "user",
      isOnline: false,
      lastSeenAt: new Date(),
      isActive: true,
    },
  ]),
  getUserById: vi.fn().mockImplementation((id: number) => {
    if (id === 2) return Promise.resolve({
      id: 2,
      name: "Bob",
      displayName: "Bob Smith",
      email: "bob@example.com",
      department: "Engineering",
      position: "Engineer",
      avatarUrl: null,
      role: "user",
      isOnline: true,
      lastSeenAt: null,
      isActive: true,
    });
    return Promise.resolve(null);
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  setUserOnline: vi.fn().mockResolvedValue(undefined),
}));

function createUserContext(userId = 1): TrpcContext {
  const user: User = {
    id: userId,
    openId: `user_${userId}`,
    name: "Alice",
    displayName: "Alice Smith",
    email: "alice@example.com",
    loginMethod: "manus",
    role: "user",
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

describe("contacts.list", () => {
  it("returns all active users excluding current user", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contacts.list();
    expect(Array.isArray(result)).toBe(true);
    // Should not include current user (id=1)
    expect(result.every(u => u.id !== 1)).toBe(true);
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.contacts.list()).rejects.toThrow();
  });
});

describe("contacts.getUser", () => {
  it("returns user profile by ID", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contacts.getUser({ userId: 2 });
    expect(result).not.toBeNull();
    expect(result?.id).toBe(2);
    expect(result?.name).toBe("Bob");
  });

  it("returns null for non-existent user", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contacts.getUser({ userId: 999 });
    expect(result).toBeNull();
  });
});
