import { money } from "./data";
import { PageHeader, PageWrap, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/security";
import { getDashboard } from "@/lib/live-data";

export default async function DashboardPage() {
  await requireRole(["admin"]);
  const dashboard = await getDashboard();

  return (
    <>
      <section className="border-b border-blue-100 bg-blue-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
          <p className="text-xs font-black uppercase text-lime-300">
            Admin dashboard
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight">
            EVO club operations, ready for teams, players, and payments.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">
            Live club records, role-aware navigation, manual payment tracking,
            schedules, attendance, and private sessions are ready for admin use.
          </p>
        </div>
      </section>
      <PageWrap>
        <PageHeader
          kicker="Overview"
          title="Today at a glance"
          description="Core club numbers for the first admin view."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total players"
            value={String(dashboard.totalPlayers)}
            detail="Active player profiles"
          />
          <StatCard
            label="Active teams"
            value={String(dashboard.activeTeams)}
            detail="Roster capacity tracked"
          />
          <StatCard
            label="Monthly revenue"
            value={money(dashboard.monthlyRevenue)}
            detail="Recorded payments"
          />
          <StatCard
            label="Outstanding"
            value={money(dashboard.outstandingBalances)}
            detail="Open player balances"
          />
          <StatCard
            label="Overdue invoices"
            value={String(dashboard.overdueInvoices)}
            detail="Needs admin follow-up"
          />
          <StatCard
            label="Private sessions"
            value={String(dashboard.upcomingPrivateSessions)}
            detail="Upcoming bookings"
          />
        </div>
        <section className="mt-6 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-blue-900">Recent payments</h2>
          <div className="mt-4 space-y-3">
            {dashboard.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-md bg-slate-50 p-3"
              >
                <div>
                  <p className="font-black">{payment.player}</p>
                  <p className="text-sm text-slate-500">
                    {payment.title} via {payment.method}
                  </p>
                </div>
                <p className="font-black text-blue-800">
                  {money(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </PageWrap>
    </>
  );
}
