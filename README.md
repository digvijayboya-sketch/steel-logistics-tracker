# 🏗️ Steel Logistics & Dispatch Tracker

A mobile-first PWA for tracking the complete lifecycle of Delivery Orders (DO) — from supplier receipt through service centre processing to final customer delivery — built for a steel trading and manufacturing company in Pune, India.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **DO Management** | Create DOs with coil specs, attach PDFs, track Draft → Closed status |
| **Job Assignment** | Planning team sets cut sizes, assigns agents, generates Job Cards |
| **Queue Tracker** | Agents check in at service centres, log queue number & processing status |
| **Expense Logger** | Field cash payments with photo proof, GPS, manager approval flow |
| **Delivery Tracker** | Log deliveries, capture location changes, partial delivery support |
| **Billing Reconciliation** | Consolidated cost view per DO; export to Excel/PDF |
| **Dashboard** | Active DOs, agent status, pending approvals, cost summaries |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Offline | Vite PWA Plugin (Workbox) |
| Deployment | Vercel |

---

## 🚀 Local Development

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & install

```bash
git clone https://github.com/digvijayboya-sketch/steel-logistics-tracker.git
cd steel-logistics-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from **Supabase Dashboard → Settings → API**.

### 3. Apply database migrations

All migrations are in `supabase/migrations/`. They have already been applied to the Supabase project. If you're starting fresh:

```bash
# Option A: apply via Supabase CLI
supabase db push

# Option B: copy-paste each .sql file in the Supabase SQL Editor
```

Migrations applied:
1. `initial_schema` – all tables, enums, indexes, RLS enable
2. `rls_policies_triggers_v2` – all RLS policies, storage buckets, triggers, auto-profile creation

### 4. Run dev server

```bash
npm run dev
```

App will be at `http://localhost:5173`.

---

## 👤 User Roles

| Role | Access |
|------|--------|
| `admin` | Full access to everything |
| `purchase` | Create/manage DOs and suppliers |
| `planner` | Assign jobs, approve expenses, view all |
| `agent` | View own jobs, log queue updates, log expenses, record deliveries |

Roles are set in `raw_user_meta_data` when creating users via Supabase Auth, or manually updated in the `profiles` table.

### Create your first admin user

1. Go to **Supabase Dashboard → Authentication → Users → Invite user**
2. After the user confirms their email, run:
   ```sql
   update public.profiles set role = 'admin' where id = '<user-uuid>';
   ```

---

## ☁️ Deploy to Vercel

1. Push to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import `steel-logistics-tracker`
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**

`vercel.json` is already configured with SPA rewrites and security headers.

---

## 📁 Project Structure

```
src/
├── components/         # Shared UI components
│   ├── do/             # Delivery Order components
│   ├── jobs/           # Job assignment & card components
│   ├── queue/          # Service centre queue tracker
│   ├── expenses/       # Field expense logger
│   ├── deliveries/     # Delivery log components
│   └── layout/         # Sidebar, Topbar, Mobile nav
├── pages/              # Route-level pages
├── store/
│   ├── appStore.ts     # Auth state (Zustand)
│   └── dataStore.ts    # All data fetching & mutations (Zustand + Supabase)
├── lib/
│   ├── supabase.ts     # Supabase client (reads .env)
│   └── api.ts          # All Supabase query functions
├── types/              # TypeScript interfaces
supabase/
└── migrations/         # SQL migration files
```

---

## 📷 Storage Buckets

| Bucket | Purpose | Max Size |
|--------|---------|----------|
| `expense-photos` | Expense receipt photos from agents | 10 MB per file |
| `do-documents` | DO PDFs and attachments | 20 MB per file |

Both buckets are **private** — files are accessed via signed URLs generated server-side.

---

## 🗺 Offline Support (PWA)

The app registers a Service Worker via `vite-plugin-pwa`. When offline:
- All previously viewed data is available from cache
- Agents can draft expense logs and queue updates
- Changes sync automatically when connectivity is restored

---

## 🔒 Security Notes

- Row-Level Security (RLS) is enabled on **all tables**
- Agents can only read their own expenses; office roles see all
- Storage buckets are private; direct public URLs do not work
- All monetary values are stored and displayed in **INR**
- Audit log captures every record change (who, when, old → new value)

---

## 📋 Open Questions (pre-production)

- [ ] Should agents be able to create new customers/service centres on-the-fly from mobile, or only select from pre-seeded lists?
- [ ] What is the expense reimbursement cycle — weekly, per-trip, or monthly?
- [ ] Should the DO document (PDF) attachment be mandatory at creation, or optional?
- [ ] Is Marathi/Hindi UI translation needed for the agent mobile screens in Phase 1 or Phase 2?
- [ ] What is the maximum number of coil items per DO (to size pagination correctly)?

---

## 📜 License

Proprietary — Internal use only.
