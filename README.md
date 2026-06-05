# EVO Volleyball Club MVP

Mobile-first Next.js app for EVO Volleyball Club operations.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase auth and database-ready schema
- Vercel deployment-ready
- Stripe-ready helper plus manual payment methods

## MVP Included

- App routes for dashboard, teams, players, payments, calendar, private sessions, and settings
- Shared role-aware layout for Admin, Coach, and Parent/Player navigation
- Login and signup routes wired to Supabase server actions
- Mobile-first Tailwind UI
- Mock data for the first working screens
- First-pass admin forms for creating teams and players
- Team roster capacity and monthly dues
- Player profiles with parent contact info and balance summary
- Invoice tracking with unpaid, paid, partial, overdue, and waived statuses
- Manual payment methods: cash, Zelle, Venmo, Cash App, card, and other
- Supabase schema for the first backend pass
- Security runbook in `SECURITY.md`
- Starter Terms, Privacy, and Consent pages

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor to create:

- Profiles with Admin, Coach, and Parent/Player roles
- Coaches, teams, players, invoices, payments, availability, private sessions, calendar events, attendance, consent records, and audit logs
- Row Level Security policies for Admin, Coach, and Parent/Player data isolation
- Double-booking prevention for private sessions

## Environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Without Supabase keys, the app runs in demo mode with mock data. After keys are
added and `supabase/schema.sql` is applied, auth actions and admin create forms
can write to Supabase.

## Seed Data

After running the schema, load starter EVO records:

```bash
npm run seed
```

This uses `SUPABASE_SERVICE_ROLE_KEY` locally and does not expose it in the
browser.

## Auth Patch

If you already ran `supabase/schema.sql`, also run this SQL file in Supabase:

```text
supabase/patches/001_auth_profile_trigger.sql
```

This creates profiles automatically when new users sign up.

## Local Development

```bash
npm run dev
```

## Deploy

Use `DEPLOYMENT.md` for the Vercel launch checklist.
