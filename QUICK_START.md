# MARSNet Quick Start (5 Minutes)

## What You Need

- GitHub account
- Supabase account (free)
- Railway or Render account (free)
- Cloudflare domain (teduza.com)

## 1. Create Supabase Project (2 min)

```
1. Go to supabase.com → Sign up
2. Create project "marsnet"
3. Copy these keys:
   - Project URL
   - Anon Key
   - Service Role Key
```

## 2. Run Database Migration (1 min)

```
1. In Supabase → SQL Editor
2. Paste content of SUPABASE_MIGRATIONS.sql
3. Click Run
```

## 3. Push to GitHub (1 min)

```bash
git clone <this-repo>
cd marsnet
cp .env.example .env.local
# Edit .env.local with your Supabase keys
git add .
git commit -m "Initial setup"
git push
```

## 4. Deploy (1 min)

**Railway:**
```
1. Go to railway.app
2. New Project → Deploy from GitHub
3. Select marsnet repo
4. Add env vars from .env.example
5. Done!
```

**Render:**
```
1. Go to render.com
2. New → Web Service
3. Connect GitHub repo
4. Add env vars
5. Deploy
```

## 5. Connect Domain (1 min)

```
1. Cloudflare → teduza.com → DNS
2. Add CNAME: marsnet → your-railway-url
3. Wait 5 minutes
```

## 6. Create Admin User (1 min)

```bash
# Generate password hash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your-password', 10))"

# In Supabase SQL Editor, run:
INSERT INTO users (email, name, display_name, password_hash, role, is_active)
VALUES ('admin@teduza.com', 'Admin', 'Administrator', '<hash-from-above>', 'admin', true);
```

## Done!

Visit `marsnet.teduza.com` and log in!

---

## Next Steps

- [ ] Create more users via admin panel
- [ ] Customize landing page
- [ ] Set up contact email
- [ ] Configure SMTP for notifications
