import { PageHeader, PageWrap } from "@/components/ui";
import { requireRole } from "@/lib/security";

const settings = [
  {
    title: "Launch status",
    body: "The app is live on evo-volleyball.vercel.app with Supabase login, role-based access, mobile pages, manual payments, schedules, attendance, and private sessions ready.",
  },
  {
    title: "Manual payments",
    body: "Use Payments to create invoices and record Cash, Zelle, Venmo, Cash App, card, or other payments. Until Stripe is added, card payments should be tracked manually after payment is confirmed outside the app.",
  },
  {
    title: "Parent access",
    body: "Create the parent's account, confirm their email, then link that parent profile to their player from the Players page. Parents only see linked player data.",
  },
  {
    title: "Coach access",
    body: "Create coach profiles and assign teams. Coaches can work with assigned teams, rosters, attendance, availability, and private sessions.",
  },
  {
    title: "Security",
    body: "Admin pages use server-side role checks. Supabase Row Level Security protects database rows, and service keys stay server-only.",
  },
  {
    title: "Before inviting parents",
    body: "Replace starter teams and players with real club data, verify one parent account, review Terms and Privacy, and confirm Supabase backups are enabled.",
  },
];

const launchSteps = [
  "Update teams with real names, coaches, monthly dues, max roster size, and practice schedules.",
  "Add real player profiles with parent contact details and jersey numbers.",
  "Create invoices for the current month and mark existing manual payments as paid or partial.",
  "Create coach accounts, set their role to coach, and assign their teams.",
  "Create one parent test account, link it to one player, and confirm the Parent Portal only shows that player.",
  "When EVO's Stripe account is ready, add Stripe keys in Vercel and test card checkout.",
];

export default async function SettingsPage() {
  await requireRole(["admin"]);

  return (
    <PageWrap>
      <PageHeader
        kicker="Settings"
        title="Launch setup"
        description="Keep EVO running on the current Vercel domain and finish the club data before inviting parents."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <section
            key={item.title}
            className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
          >
            <h2 className="text-lg font-black text-blue-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.body}
            </p>
          </section>
        ))}
      </div>
      <section className="mt-5 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-blue-900">
          Next owner checklist
        </h2>
        <div className="mt-3 space-y-3">
          {launchSteps.map((step) => (
            <label
              key={step}
              className="flex items-start gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm leading-5 text-slate-700"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-blue-200 text-blue-700"
              />
              <span>{step}</span>
            </label>
          ))}
        </div>
      </section>
    </PageWrap>
  );
}
