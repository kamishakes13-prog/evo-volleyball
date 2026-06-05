import { PageHeader, PageWrap } from "@/components/ui";
import { requireRole } from "@/lib/security";

const settings = [
  {
    title: "Roles",
    body: "Admin, Coach, and Parent/Player are enforced by server-side helpers and Supabase RLS.",
  },
  {
    title: "Supabase",
    body: "Auth and database tables are prepared in supabase/schema.sql for the first real backend pass.",
  },
  {
    title: "Payments",
    body: "Cards must use Stripe Checkout or payment links. The app stores status, amount, method, date, and invoice ID only.",
  },
  {
    title: "Vercel",
    body: "HTTPS redirects and security headers are configured. Add environment variables in Vercel before launch.",
  },
  {
    title: "Audit logs",
    body: "The schema includes audit_logs for admin actions such as invoice edits, payment updates, balance changes, and player deletion.",
  },
  {
    title: "Backups",
    body: "Enable Supabase daily backups and create manual backups before schema changes.",
  },
];

export default async function SettingsPage() {
  await requireRole(["admin"]);

  return (
    <PageWrap>
      <PageHeader
        kicker="Settings"
        title="MVP setup"
        description="A lightweight implementation checklist for the first version."
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
    </PageWrap>
  );
}
