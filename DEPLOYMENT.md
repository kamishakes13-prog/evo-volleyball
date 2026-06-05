# EVO Volleyball Club Deployment

## Current Launch Status

- Production app is live at `https://evo-volleyball.vercel.app`.
- Supabase is connected and seeded with starter club data.
- Production smoke test has passed for public routes and security headers.
- Stripe Checkout code is ready, but card payments require real Stripe keys before launch.
- This local folder is not connected to GitHub yet; push it to a GitHub repo to enable automatic Vercel deploys.

## Vercel Environment Variables

Add these in Vercel Project Settings -> Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

Only the two `NEXT_PUBLIC_*` values are browser-visible. Keep
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`
server-only.

## Supabase Before Launch

- `supabase/schema.sql` has been applied.
- `supabase/patches/001_auth_profile_trigger.sql` has been applied.
- First admin profile exists.
- Supabase daily backups are enabled.
- Email confirmation settings are intentional for production.

## Deploy Steps

1. Create a GitHub repository named `evo-volleyball`.
2. Push this project folder to that repository.
3. In Vercel, connect the GitHub repository to the existing `evo-volleyball` project.
4. Confirm the Supabase environment variables are still present in Vercel.
5. Add the Stripe environment variables when the Stripe account is ready.
6. Deploy.
7. Open the deployed URL.
8. Log in as the admin user.
9. Verify Teams, Players, Payments, Calendar, Private Sessions, Attendance, and Settings.

## Post-Deploy Smoke Test

Run this locally after Vercel deploys:

```bash
$env:SMOKE_URL="https://your-vercel-url.vercel.app"
npm run smoke:deployed
```

The smoke test checks public pages and security headers.

## Production Notes

- Use Stripe Checkout or Stripe payment links for cards.
- Do not store card numbers in this app.
- Stripe webhook endpoint:

```text
https://evo-volleyball.vercel.app/api/stripe/webhook
```

- Add the webhook in Stripe for `checkout.session.completed`.
- After creating the webhook, copy its signing secret into Vercel as
  `STRIPE_WEBHOOK_SECRET`.
- Replace starter Terms and Privacy pages with final reviewed text.
- Invite coaches and parents only after role checks and parent-player links are verified.
