# MARSNet - Standalone Version

This is a **standalone, self-hosted** version of MARSNet corporate messenger.

## What's Included

✅ Full React + Node.js source code  
✅ Email/password authentication (no Manus OAuth)  
✅ Supabase PostgreSQL database  
✅ Socket.io real-time messaging  
✅ Admin panel for user management  
✅ PWA support (installable)  
✅ Dark theme  
✅ Responsive mobile layout  

## What's NOT Included

❌ Manus OAuth (use email/password instead)  
❌ Manus analytics  
❌ Manus storage  
❌ Pre-configured hosting  

## Quick Start

**See `QUICK_START.md` for 5-minute setup!**

## Full Deployment Guide

**See `DEPLOYMENT.md` for detailed instructions.**

## File Structure

```
marsnet/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Login, Messenger, Admin
│   │   ├── components/ # UI components
│   │   └── hooks/      # useSocket, useAuth
│   └── public/         # PWA manifest, service worker
├── server/             # Node.js backend
│   ├── routers/        # tRPC procedures
│   ├── db.ts           # Database helpers
│   ├── realtime.ts     # Socket.io setup
│   └── auth.ts         # Email/password auth
├── drizzle/            # Database schema (ORM)
├── SUPABASE_MIGRATIONS.sql  # Database schema (SQL)
├── .env.example        # Environment variables template
├── DEPLOYMENT.md       # Full deployment guide
└── QUICK_START.md      # 5-minute quick start
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

## Development

```bash
# Install dependencies
pnpm install

# Add Supabase packages
pnpm add @supabase/supabase-js bcrypt nodemailer

# Run dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test
```

## Deployment Platforms (Free)

- **Railway**: Recommended, easiest setup
- **Render**: Good alternative
- **Fly.io**: For Docker enthusiasts
- **Your own VPS**: Full control

See `DEPLOYMENT.md` for step-by-step instructions for each platform.

## Database

Uses **Supabase** (PostgreSQL) - free tier includes:
- 500 MB database
- 2 GB bandwidth
- Unlimited API requests
- Real-time subscriptions

Run `SUPABASE_MIGRATIONS.sql` in Supabase SQL Editor to create tables.

## Features

### Messaging
- Direct messages between employees
- Real-time delivery via Socket.io
- Message history with timestamps
- Read receipts
- Typing indicators (optional)

### Users
- Email/password authentication
- Admin approval required
- User profiles (name, department, position)
- Online/offline status
- Last seen timestamp

### Admin Panel
- Create/edit/delete users
- Activate/deactivate accounts
- Change user roles
- View all users and activity

### Security
- Password hashing (bcrypt)
- Row-level security (RLS) in database
- Session-based auth
- No public registration

### PWA
- Installable from browser
- Works offline (cached pages)
- Push notifications (optional)
- Add to home screen

## Customization

### Change Domain
Replace `marsnet.teduza.com` with your domain in:
- Cloudflare DNS settings
- Railway/Render custom domain
- `.env` variables

### Change Colors
Edit `client/src/index.css` - dark theme uses OKLCH color format

### Change App Name
Search and replace "MARSNet" throughout codebase

### Add Email Notifications
Configure SMTP in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Troubleshooting

**Can't connect to database?**
- Check `SUPABASE_URL` and keys in `.env`
- Verify Supabase project is running
- Check network connectivity

**Users can't log in?**
- Verify user `is_active = true` in database
- Check password hash is bcrypt format
- Review server logs

**Real-time messages not working?**
- Check Socket.io connection in browser console
- Verify `SUPABASE_URL` is correct
- Check firewall allows WebSocket

**Domain not resolving?**
- Wait 10 minutes for DNS propagation
- Check Cloudflare DNS settings
- Verify SSL certificate is issued

## Support

For issues:
1. Check Railway/Render logs
2. Check Supabase database
3. Review `DEPLOYMENT.md`
4. Contact: contact@teduza.com

## License

MIT - Use freely for personal or commercial projects

## What's Next?

1. Follow `QUICK_START.md` to deploy in 5 minutes
2. Create admin user and first employees
3. Customize branding and colors
4. Set up domain and SSL
5. Enable email notifications
6. Share with your team!

---

**Ready to deploy?** Start with `QUICK_START.md` now!
