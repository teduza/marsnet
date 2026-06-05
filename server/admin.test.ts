import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

vi.mock("./db", () => ({
  getAllUsers: vi.fn().mockResolvedValue([
    {
      id: 1,
      openId: "user_1",
      name: "Alice",
      displayName: "Alice Smith",
      email: "alice@example.com",
      department: "Engineering",
      position: "Engineer",
      avatarUrl: null,
      role: "admin",
      isOnline: true,
      lastSeenAt: null,
      isActive: true,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    },
  ]),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
  getUserById: vi.fn().mockResolvedValue({
    id: 2,
    openId: "user_2",
    name: "Bob",
    isActive: true,
    role: "user",
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
  getConversation: vi.fn().mockResolvedValue([]),
  markMessagesRead: vi.fn().mockResolvedValue(undefined),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  getLastMessages: vi.fn().mockResolvedValue([]),
  setUserOnline: vi.fn().mockResolvedValue(undefined),
}));

function createAdminContext(): TrpcContext {
  const user: User = {
    id: 1,
    openId: "admin_1",
    name: "Admin",
    displayName: "Admin User",
    email: "admin@example.com",
    loginMethod: "manus",
    role: "admin",
    isActive: true,
    isOnline: true,
    lastSeenAt: null,
    department: "IT",
    position: "Administrator",
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

function createUserContext(): TrpcContext {
  const user: User = {
    id: 2,
    openId: "user_2",
    name: "Bob",
    displayName: "Bob Smith",
    email: "bob@example.com",
    loginMethod: "manus",
    role: "user",
    isActive: true,
    isOnline: false,
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

describe("admin.listUsers", () => {
  it("allows admin to list all users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listUsers();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });
});

describe("admin.createUser", () => {
  it("allows admin to create a new user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.createUser({
      openId: "new_user_123",
      name: "Charlie",
      email: "charlie@example.com",
      role: "user",
    });
    expect(result).toEqual({ success: true });
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.createUser({ openId: "x", name: "X", role: "user" })
    ).rejects.toThrow();
  });
});

describe("admin.deactivateUser", () => {
  it("allows admin to deactivate another user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.deactivateUser({ userId: 2 });
    expect(result).toEqual({ success: true });
  });

  it("throws BAD_REQUEST when admin tries to deactivate themselves", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.deactivateUser({ userId: 1 })).rejects.toThrow();
  });
});
