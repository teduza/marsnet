import { and, desc, eq, gt, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertMessage, InsertUser, messages, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "displayName", "department", "position", "avatarUrl"] as const;
  for (const field of textFields) {
    const value = user[field as keyof InsertUser];
    if (value === undefined) continue;
    const normalized = (value ?? null) as string | null;
    (values as Record<string, unknown>)[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  // Handle isActive explicitly if provided
  if (user.isActive !== undefined) {
    values.isActive = user.isActive;
    updateSet.isActive = user.isActive;
  }

  // Owner is always active
  if (user.openId === ENV.ownerOpenId) {
    values.isActive = true;
    updateSet.isActive = true;
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function getAllActiveUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      displayName: users.displayName,
      email: users.email,
      department: users.department,
      position: users.position,
      avatarUrl: users.avatarUrl,
      role: users.role,
      isOnline: users.isOnline,
      lastSeenAt: users.lastSeenAt,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.isActive, true));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      displayName: users.displayName,
      email: users.email,
      department: users.department,
      position: users.position,
      avatarUrl: users.avatarUrl,
      role: users.role,
      isOnline: users.isOnline,
      lastSeenAt: users.lastSeenAt,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users);
}

export async function updateUser(
  id: number,
  data: Partial<{
    displayName: string | null;
    department: string | null;
    position: string | null;
    avatarUrl: string | null;
    role: "user" | "admin";
    isActive: boolean;
    isOnline: boolean;
    lastSeenAt: Date | null;
  }>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function setUserOnline(userId: number, online: boolean) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ isOnline: online, lastSeenAt: online ? null : new Date() })
    .where(eq(users.id, userId));
}

// ─── Message helpers ──────────────────────────────────────────────────────────

export async function createMessage(msg: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(messages).values(msg).$returningId();
  return result;
}

export async function getConversation(
  userAId: number,
  userBId: number,
  limit = 50,
  beforeId?: number
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    or(
      and(eq(messages.senderId, userAId), eq(messages.receiverId, userBId)),
      and(eq(messages.senderId, userBId), eq(messages.receiverId, userAId))
    ),
  ];

  if (beforeId) {
    conditions.push(lt(messages.id, beforeId));
  }

  return db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function markMessagesRead(senderId: number, receiverId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.senderId, senderId),
        eq(messages.receiverId, receiverId),
        eq(messages.readAt, null as unknown as Date)
      )
    );
}

export async function getUnreadCount(receiverId: number, senderId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.senderId, senderId),
        eq(messages.receiverId, receiverId),
        eq(messages.readAt, null as unknown as Date)
      )
    );
  return result.length;
}

export async function getLastMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get the latest message for each conversation partner
  return db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    .orderBy(desc(messages.createdAt))
    .limit(200);
}
