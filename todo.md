# MARSNet — TODO

## Phase 1: Database Schema & Migrations
- [x] Extend users table with: displayName, avatarUrl, isActive, isOnline, lastSeenAt, department, position
- [x] Create messages table: id, senderId, receiverId, content, createdAt, readAt
- [x] Run drizzle migration and apply SQL

## Phase 2: Backend — tRPC Routers & Real-time
- [x] Block public registration — only admin can create users
- [x] Implement user approval/activation flow
- [x] Create messages router: send, getHistory, markRead, getUnreadCount, getConversationPreviews
- [x] Create contacts router: list all active users with presence
- [x] Create admin router: createUser, deactivateUser, updateRole, listUsers, activateUser, promoteToAdmin, demoteToUser
- [x] WebSocket server setup with socket.io for real-time message delivery and presence
- [x] Block deactivated users in protectedProcedure middleware
- [x] Block deactivated users in OAuth callback (redirect to /access-denied)

## Phase 3: Frontend — Global Theme, Layout, Login, Contacts
- [x] Set dark theme as default in App.tsx and index.css
- [x] Design dark corporate color palette (OKLCH deep navy + accent blue)
- [x] Add Inter font via Google Fonts CDN
- [x] Create LoginPage with Manus OAuth redirect and "access restricted" messaging
- [x] Create AccessDenied page for unapproved users
- [x] Create main MessengerPage with sidebar (contacts) + chat area
- [x] Create ContactList component with online/offline status badges
- [x] useSocket hook for Socket.io client connection

## Phase 4: Chat Interface
- [x] Create ChatWindow component with message bubbles
- [x] Message timestamps in user's local timezone
- [x] Auto-scroll to latest message
- [x] Send message input with Enter key support
- [x] Real-time incoming messages via Socket.io
- [x] Read receipts (readAt timestamp)
- [x] Empty state for new conversations
- [x] Loading skeleton for message history

## Phase 5: Admin Panel
- [x] Create AdminPage with user management table
- [x] Create user form: name, email, department, position, role
- [x] Activate/deactivate user accounts
- [x] Change user roles (admin/user)
- [x] Admin-only route guard on frontend
- [x] Admin procedure guard on backend

## Phase 6: PWA
- [x] Create manifest.json with app name, icons, theme colors
- [x] Create service worker (sw.js) with cache-first strategy
- [x] Generate PWA icons (192x192, 512x512)
- [x] Add meta tags for iOS PWA support
- [x] Register service worker in main.tsx

## Phase 7: Tests & Delivery
- [x] Write vitest tests for messages router (4 tests)
- [x] Write vitest tests for admin router (6 tests)
- [x] Write vitest tests for contacts router (4 tests)
- [x] TypeScript check passes (0 errors)
- [x] All 15 tests pass
- [x] Save checkpoint
- [x] Deliver result to user
