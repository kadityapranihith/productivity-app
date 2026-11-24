# Barely Productive

> **Consistency over intensity. Progress over perfection. Growing together instead of competing.**

A premium personal growth and accountability platform for students, professionals, and ambitious people who want to build lasting habits alongside a trusted circle of friends.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| State | TanStack Query + Zustand |
| Auth | Firebase Authentication |
| Database | Supabase PostgreSQL |
| Security | Supabase RLS + Firebase JWT |
| Realtime | Supabase Realtime |
| Deployment | Vercel |

---

## Features

### 🎯 Daily Task Management
- Create tasks across any life category (coding, fitness, health, reading, career…)
- **Normal** and **bare-minimum** completion levels
- Fixed point values per task — backend-validated, never trusted from client
- Recurring tasks with day-of-week scheduling
- Rest day support — doesn't break streaks
- Optional bonus tasks for extra effort

### 🔥 Consistency Heatmap (GitHub-style)
- Full-year visual heatmap with **exactly 3 states**:
  - 🟩 Dark green — full completion
  - 🟨 Light green — bare-minimum completion (still counts!)
  - ⬜ Neutral — no qualifying work
- Hover tooltips showing daily breakdown
- Streak statistics and yearly milestone progress

### 🏆 Achievement System
Three meaningful categories:
1. **Active-day milestones** (50 / 100 / 200 / 300 days per year)
2. **Monthly consistency badges** (12 unique monthly badges)
3. **Full-year prestige badge**

No cheap daily badges. Every achievement means something.

### 👥 Friend Groups
- Create / join private or public groups
- Group leaderboard (daily / weekly / monthly / all-time)
- Achievement announcements to group feed
- **Strict privacy**: task names, journal entries, and goal details are NEVER shared

### 📊 Personal Goals
- Weekly, monthly, and yearly goal tracking
- Progress percentage and deadline tracking
- Optional sharing with group members

### 📝 Private Journal
- Full markdown support with writing prompts
- Calendar-based navigation
- Completely private — zero leakage into group feeds

---

## Project Structure

```
src/
  components/
    ui/           # Reusable design system components
    layout/       # Sidebar, mobile nav
    heatmap/      # ConsistencyHeatmap component
  pages/          # Route-level page components
  layouts/        # AppLayout wrapper
  lib/
    utils.ts      # Helper functions
    mockData.ts   # Demo data for UI development
    supabase.ts   # Supabase client
    firebase.ts   # Firebase auth client
  types/          # TypeScript type definitions

supabase/
  migrations/
    001_initial_schema.sql  # Full database schema
    002_rls_policies.sql    # Row Level Security
    003_functions.sql       # PostgreSQL RPC functions
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd productivity-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase and Firebase credentials in `.env.local`.

### 3. Run database migrations

In Supabase SQL editor, run in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql`

### 4. Start development server

```bash
npm run dev
```

> **Demo mode**: The app runs fully with mock data if environment variables are not set. All UI is functional without a backend.

---

## Security Design

| Data | Visibility |
|---|---|
| Task names and descriptions | Owner only |
| Journal entries | Owner only (enforced by RLS — not even admins can read) |
| Personal goals | Private by default; opt-in sharing |
| Points and leaderboard | Group members (opt-out available) |
| Consistency heatmap | Group members (opt-out available) |
| Earned badges | Group members (opt-out available) |

All scoring is validated by PostgreSQL functions. Points are never trusted from the frontend.

---

## Deployment

```bash
# Build
npm run build

# Deploy to Vercel
vercel deploy --prod
```

Set all `VITE_*` environment variables in Vercel project settings.

---

## Philosophy

The goal is not to make users obsessed with points.  
The goal is to help them **become consistent, build confidence, and grow together** with people they trust.

Every feature is built around this principle.
