# EVO Volleyball Club Security Notes

## Access Control

- Supabase Auth is the login provider.
- Admin can access all club records.
- Coach access is scoped to assigned teams, rosters, attendance, availability, and private sessions.
- Parent/Player access is scoped to their own player, invoices, schedule, and bookings.
- Admin pages and admin write actions use server-side role checks.
- Supabase Row Level Security is enabled on every app table in `supabase/schema.sql`.

## Secrets

- API keys belong in environment variables only.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code or `NEXT_PUBLIC_*` variables.
- Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and public Stripe publishable keys may be used in the browser.

## Payments

- Use Stripe Checkout or Stripe payment links for cards.
- Never collect or store card numbers in the app.
- Store only payment status, amount, method, date, and invoice ID.
- Manual payment methods are cash, Zelle, Venmo, Cash App, card, and other.

## Audit Logs

The `audit_logs` table records sensitive admin actions such as:

- marking payments paid or partial
- editing invoices
- deleting players
- changing balances
- creating teams or players

## Validation and Rate Limiting

- Current auth and admin create actions validate on the server.
- Current forms use basic browser validation.
- Login and admin create actions include starter in-memory rate limiting.
- For production, move rate limiting to durable storage such as Upstash Redis or Vercel KV.

## HTTPS

- Production requests are redirected to HTTPS by middleware.
- Security headers are configured in `next.config.ts`.
- Vercel provides HTTPS automatically for deployed domains.

## Backups

- Enable Supabase daily backups before launch.
- Export a manual backup before schema changes.
- Test restores periodically, especially before tournament or billing periods.

## Legal and Consent

- Starter pages exist at `/terms`, `/privacy`, and `/consent`.
- Replace starter legal copy with attorney-reviewed terms and privacy policy before launch.
