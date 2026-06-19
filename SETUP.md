# Steel Logistics & Dispatch Tracker — Setup Guide

## Prerequisites
- Node.js ≥ 20
- A [Supabase](https://supabase.com) account (free tier is fine for MVP)
- A [Vercel](https://vercel.com) account (free tier) for deployment

---

## 1. Supabase Project Setup

### 1a. Create a project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Name: `steel-tracker` | Region: **South Asia (ap-south-1)** (Mumbai — closest to Pune)
3. Note your **Project URL** and **anon public key** (Settings → API)

### 1b. Run the database migration
1. In Supabase Dashboard → **SQL Editor**
2. Paste the full contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** — this creates all tables, RLS policies, enums, and triggers

### 1c. Seed lookup data
1. In SQL Editor, paste and run `supabase/seed.sql`
2. This adds demo suppliers, service centres, and customers

### 1d. Create storage buckets
In **Storage** → **New bucket**:
- Name: `expense-photos` | Public: **OFF**
- Name: `do-documents`   | Public: **OFF**

Then in **SQL Editor**, add storage policies:
```sql
-- expense-photos: agents can upload, admin/planner can read
create policy "expense_photos_insert" on storage.objects
  for insert with check (bucket_id = 'expense-photos' and auth.uid() is not null);
create policy "expense_photos_read" on storage.objects
  for select using (bucket_id = 'expense-photos' and auth.uid() is not null);

-- do-documents: purchase/admin can upload, all can read
create policy "do_docs_insert" on storage.objects
  for insert with check (bucket_id = 'do-documents' and auth.uid() is not null);
create policy "do_docs_read" on storage.objects
  for select using (bucket_id = 'do-documents' and auth.uid() is not null);
```

### 1e. Create user accounts
In **Authentication** → **Users** → **Add user** (or use the CLI):

| Email | Password | Role (set after creation) |
|---|---|---|
| admin@steelco.in | admin123 | admin |
| purchase@steelco.in | steel123 | purchase |
| planner@steelco.in | steel123 | planner |
| agent1@steelco.in | agent123 | agent |
| agent2@steelco.in | agent123 | agent |

After creating each user, run this SQL to set role and name (replace values):
```sql
UPDATE profiles
SET full_name = 'Amit Kulkarni', role = 'admin'
WHERE id = '<user-uuid-from-auth-dashboard>';
```

---

## 2. Local Development

```bash
# Clone the repo
git clone https://github.com/digvijayboya-sketch/steel-logistics-tracker
cd steel-logistics-tracker

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
# → Opens at http://localhost:5173
```

---

## 3. Deploy to Vercel

### Option A: Vercel Dashboard (easiest)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import GitHub repo: `digvijayboya-sketch/steel-logistics-tracker`
3. Framework: **Vite** (auto-detected)
4. Add environment variables:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy** → live in ~90 seconds

### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
# Follow prompts; add env vars when asked
```

### Post-deploy
- Add your Vercel domain to Supabase → **Authentication** → **URL Configuration** → **Site URL**
- Also add it to **Redirect URLs**: `https://your-app.vercel.app/**`

---

## 4. PWA Installation (Field Agents)

Agents on Android Chrome:
1. Open the app URL in Chrome
2. Tap **⋮ menu** → **Add to Home Screen**
3. App installs as a standalone PWA — works offline for viewing cached data

Offline capability:
- Previously loaded DOs, jobs, and queue data are cached by the service worker
- Expense forms can be filled out offline (data queued locally)
- Syncs automatically when connectivity is restored

---

## 5. Architecture Overview

```
Browser / Android PWA
        │
   React + Zustand (src/)
        │
   api.ts (thin query layer)
        │
   Supabase (PostgreSQL + Auth + Storage)
        │
   Row-Level Security (per-role policies)
```

---

## 6. User Role Permissions

| Action | Admin | Planner | Purchase | Agent |
|---|:---:|:---:|:---:|:---:|
| Create DO | ✅ | ❌ | ✅ | ❌ |
| Create Job | ✅ | ✅ | ❌ | ❌ |
| Assign Agent | ✅ | ✅ | ❌ | ❌ |
| Log Queue Update | ✅ | ✅ | ✅ | ✅ |
| Log Expense | ✅ | ✅ | ✅ | ✅ |
| Approve Expense | ✅ | ✅ | ❌ | ❌ |
| Log Delivery | ✅ | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ | ❌ |
| View Audit Log | ✅ | ❌ | ❌ | ❌ |
