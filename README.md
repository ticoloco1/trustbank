# TrustBank — Mini Sites, Slugs & Video Paywall

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + DB + Storage)
- Zustand (cart, theme)
- i18next (EN, ES, PT, DE, IT, JA, ZH)

## Setup

### 1. Supabase
1. Create new project at supabase.com
2. Go to SQL Editor → run `banco.sql`
3. At the end of banco.sql, uncomment and run the admin line with your email
4. Go to Authentication → Settings → add your Vercel URL to Site URL
5. Enable Google OAuth in Authentication → Providers

### 2. Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
NEXT_PUBLIC_COINBASE_APP_ID=      # portal.cdp.coinbase.com
NEXT_PUBLIC_PLATFORM_WALLET=      # your Polygon wallet
NEXT_PUBLIC_WALLETCONNECT_ID=     # cloud.walletconnect.com
```

### 3. Deploy to Vercel
```bash
git init
git remote add origin https://github.com/youruser/trustbank.git
git add -A
git commit -m "init"
git branch -M main
git push origin main --force
```
Then add environment variables in Vercel → Settings → Environment Variables.

## Routes
| Path | Description |
|------|-------------|
| `/` | Homepage |
| `/auth` | Sign in / Sign up |
| `/editor` | Mini site editor |
| `/s/[slug]` | Public mini site |
| `/slugs` | Slug marketplace |
| `/imoveis` | Properties directory |
| `/carros` | Cars directory |
| `/planos` | Plans & pricing |
| `/dashboard` | User dashboard |
| `/governance` | Admin panel |

## Admin
Go to `/governance` — only accessible to users with `admin` role.
To add admin role, run in Supabase SQL Editor:
```sql
insert into user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'your@email.com'
on conflict do nothing;
```
