# MARSNet Deployment Guide

## Overview

MARSNet is a closed-door corporate messenger with email/password authentication. This guide covers deployment on **Railway** or **Render** with **Supabase** as the database.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Create a new project:
   - **Name**: marsnet
   - **Database Password**: Save this securely
   - **Region**: Choose closest to you
3. Wait for project to initialize (~2 min)
4. Go to **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy entire content of `SUPABASE_MIGRATIONS.sql` and paste
4. Click **Run**
5. Done! Tables are created

---

## Step 2: Push Code to GitHub

```bash
# Clone this repo locally
git clone <your-repo-url>
cd marsnet

# Create .env.local with your Supabase keys
cp .env.example .env.local
# Edit .env.local and add your Supabase credentials

# Push to GitHub
git add .
git commit -m "Initial MARSNet setup"
git push origin main
```

---

## Step 3: Deploy Backend (Choose One)

### Option A: Railway (Recommended - Easiest)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **New Project → Deploy from GitHub repo**
4. Select your marsnet repository
5. Railway auto-detects Node.js
6. Go to **Variables** tab and add:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=xxx
   SUPABASE_SERVICE_ROLE_KEY=xxx
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=<generate: openssl rand -base64 32>
   ```
7. Click **Deploy**
8. Copy the generated URL (e.g., `https://marsnet-prod.railway.app`)

### Option B: Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Settings:
   - **Name**: marsnet
   - **Environment**: Node
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
6. Add environment variables (same as Railway)
7. Click **Create Web Service**

---

## Step 4: Connect Domain (marsnet.teduza.com)

### In Cloudflare (Your Domain Host)

1. Go to your Cloudflare dashboard
2. Select **teduza.com** domain
3. Go to **DNS** tab
4. Add CNAME record:
   - **Name**: `marsnet`
   - **Target**: Your Railway/Render URL (without https://)
   - **Proxy status**: Proxied (orange cloud)
5. Wait 5 minutes for DNS to propagate

### In Railway/Render

1. Go to your deployment settings
2. Add custom domain: `marsnet.teduza.com`
3. Add SSL certificate (auto-generated)

---

## Step 5: Create First Admin User

### Via Supabase Console

1. Go to Supabase → **SQL Editor**
2. Run:
```sql
INSERT INTO users (email, name, display_name, password_hash, role, is_active, created_at)
VALUES (
  'admin@teduza.com',
  'Admin',
  'Administrator',
  '$2b$10$...', -- bcrypt hash of your password
  'admin',
  true,
  NOW()
);
```

**To generate bcrypt hash:**
```bash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your-password', 10))"
```

---

## Step 6: Create Landing Page (Optional)

Create `public/landing.html` or use a separate landing service:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>MARSNet - Corporate Messenger</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index, follow">
</head>
<body>
  <h1>MARSNet - Secure Team Communication</h1>
  <p>A closed-door messenger for your team.</p>
  <p>To join, contact us: <a href="mailto:contact@teduza.com">contact@teduza.com</a></p>
  <a href="https://marsnet.teduza.com/login">Sign In</a>
</body>
</html>
```

---

## Step 7: Manage Users (Admin Panel)

1. Log in as admin at `marsnet.teduza.com`
2. Go to `/admin`
3. Create new users:
   - Email
   - Name
   - Department
   - Position
   - Role (user/admin)
4. Click **Create** — user gets email invite
5. User signs up with provided email/password

---

## Troubleshooting

### "Connection refused"
- Check Railway/Render deployment logs
- Verify `SUPABASE_URL` and keys are correct

### "Database error"
- Run `SUPABASE_MIGRATIONS.sql` again in Supabase SQL Editor
- Check RLS policies are enabled

### Domain not working
- Wait 10 minutes for DNS propagation
- Check Cloudflare DNS settings
- Verify SSL certificate is issued

### Users can't log in
- Verify user `is_active = true` in Supabase
- Check password hash is bcrypt format

---

## Production Checklist

- [ ] Supabase project created and schema migrated
- [ ] GitHub repo with code pushed
- [ ] Railway/Render deployment running
- [ ] Domain `marsnet.teduza.com` pointing to deployment
- [ ] First admin user created
- [ ] SSL certificate issued
- [ ] Contact email configured
- [ ] Backup Supabase database

---

## Support

For issues:
1. Check Railway/Render logs
2. Check Supabase database
3. Verify environment variables
4. Contact: contact@teduza.com
