-- 1. Create Role Enum
DO $$ BEGIN
    CREATE TYPE "role" AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    "name" TEXT,
    "email" VARCHAR(320),
    "loginMethod" VARCHAR(64),
    "role" "role" DEFAULT 'user' NOT NULL,
    "displayName" VARCHAR(128),
    "department" VARCHAR(128),
    "position" VARCHAR(128),
    "avatarUrl" TEXT,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "isOnline" BOOLEAN DEFAULT false NOT NULL,
    "lastSeenAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
    "lastSignedIn" TIMESTAMP DEFAULT now() NOT NULL
);

-- 3. Create Messages Table
CREATE TABLE IF NOT EXISTS "messages" (
    "id" SERIAL PRIMARY KEY,
    "senderId" INTEGER NOT NULL REFERENCES "users"("id"),
    "receiverId" INTEGER NOT NULL REFERENCES "users"("id"),
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- 4. Enable Realtime (Optional, for Supabase Realtime features)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;
