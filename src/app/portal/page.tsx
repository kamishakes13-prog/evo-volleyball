import { money, type Invoice } from "@/app/data";
import { createInvoiceCheckout } from "@/app/payments/actions";
import { PageHeader, PageWrap, StatusPill } from "@/components/ui";
import {
  getInvoices,
  getPlayers,
  getPrivateSessions,
  getTeams,
} from "@/lib/live-data";
import { requireRole } from "@/lib/security";

function balanceFor(playerId: string, invoices: Invoice[]) {
  return invoices
    .filter((invoice) => invoice.playerId === playerId)
    .reduce(
      (summary, invoice) => {
        summary.total += invoice.amount;
        summary.paid += invoice.paid;
        summary.remaining += Math.max(invoice.amount - invoice.paid, 0);
        return summary;
      },
      { total: 0, paid: 0, remaining: 0 },
    );
}

const portalMessages: Record<string, string> = {
  "invoice-not-payable": "That invoice is not payable right now.",
  "stripe-not-configured":
    "Card payments are not enabled yet. Please use Cash, Zelle, Venmo, or Cash App and EVO admin will confirm the payment.",
  "stripe-session":
    "Card checkout could not start. Please try another payment method.",
};

export default async function ParentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; stripe?: string }>;
}) {
  await requireRole(["parent"]);
  const params = await searchParams;
  const message = params.error ? portalMessages[params.error] : null;
  const stripeSuccess =
    params.stripe === "success" ? "Card payment submitted." : null;
  const [players, teams, invoices, sessions] = await Promise.all([
    getPlayers(),
    getTeams(),
    getInvoices(),
    getPrivateSessions(),
  ]);
  const approvedPlayers = players.filter((player) => player.active !== false);
  const pendingPlayers = players.filter((player) => player.active === false);
  const approvedPlayerIds = new Set(approvedPlayers.map((player) => player.id));
  const visibleInvoices = invoices.filter((invoice) =>
    approvedPlayerIds.has(invoice.playerId),
  );
  const visibleSessions = sessions.filter((session) =>
    approvedPlayerIds.has(session.playerId),
  );

  return (
    <PageWrap>
      <PageHeader
        kicker="Parent portal"
        title="My player"
        description="Player details, balances, invoices, team schedule, and private session bookings."
      />
      {message ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700 shadow-sm">
          {message}
        </div>
      ) : null}
      {stripeSuccess ? (
        <div className="mb-4 rounded-lg border border-lime-300 bg-lime-50 p-4 text-sm font-bold leading-6 text-blue-950 shadow-sm">
          {stripeSuccess}
        </div>
      ) : null}

      {players.length ? (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-4">
            {pendingPlayers.map((player) => (
              <article
                key={player.id}
                className="rounded-lg border border-lime-300 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-blue-900">
                      {player.name}
                    </h2>
                    <p className="text-sm font-bold text-slate-500">
                      Waiting for admin team placement
                    </p>
                  </div>
                  <span className="rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-blue-950">
                    Pending
                  </span>
                </div>
                <p className="mt-4 rounded-md bg-blue-50 p-3 text-sm font-bold leading-6 text-slate-700">
                  EVO has this player. An admin will confirm the account and
                  place the player on the correct team before invoices,
                  schedules, and bookings appear here.
                </p>
              </article>
            ))}
            {approvedPlayers.map((player) => {
              const balance = balanceFor(player.id, visibleInvoices);
              const team = teams.find((item) => item.id === player.teamId);

              return (
                <article
                  key={player.id}
                  className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-blue-900">
                        {player.name}
                      </h2>
                      <p className="text-sm font-bold text-slate-500">
                        #{player.jersey} | {team?.name ?? "No team"}
                      </p>
                    </div>
                    <span className="rounded-md bg-blue-800 px-3 py-2 text-sm font-black text-white">
                      {money(balance.remaining)} due
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-500">Total</p>
                      <p className="font-black">{money(balance.total)}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-500">Paid</p>
                      <p className="font-black">{money(balance.paid)}</p>
                    </div>
                    <div className="rounded-md bg-lime-50 p-3">
                      <p className="text-xs font-bold text-slate-500">
                        Remaining
                      </p>
                      <p className="font-black">{money(balance.remaining)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-black text-slate-950">Schedule</p>
                    <p className="mt-1 font-bold text-slate-600">
                      {team?.schedule ?? "Schedule TBD"}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-blue-900">Invoices</h2>
              <div className="mt-4 space-y-3">
                {visibleInvoices.length ? (
                  visibleInvoices.map((invoice) => (
                    <div key={invoice.id} className="rounded-md bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{invoice.title}</p>
                          <p className="text-sm text-slate-500">
                            {invoice.category} | due {invoice.dueDate || "TBD"}
                          </p>
                        </div>
                        <StatusPill status={invoice.status} />
                      </div>
                      <p className="mt-2 text-sm font-black text-slate-700">
                        {money(invoice.paid)} / {money(invoice.amount)}
                      </p>
                      {invoice.status !== "paid" &&
                      invoice.status !== "waived" ? (
                        <div className="mt-3 rounded-md border border-blue-100 bg-white p-3">
                          <p className="text-xs font-black uppercase text-slate-500">
                            Payment options
                          </p>
                          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                            Pay by card when online payments are enabled, or
                            pay EVO by Cash, Zelle, Venmo, or Cash App. Admin
                            will confirm manual payments after they are
                            received.
                          </p>
                          <form
                            action={createInvoiceCheckout}
                            className="mt-3"
                          >
                            <input
                              name="invoiceId"
                              type="hidden"
                              value={invoice.id}
                            />
                            <input name="returnTo" type="hidden" value="/portal" />
                            <button
                              className="rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-blue-950"
                              type="submit"
                            >
                              Pay Card
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-bold text-slate-500">
                    No invoices yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-blue-900">
                Private sessions
              </h2>
              <div className="mt-4 space-y-3">
                {visibleSessions.length ? (
                  visibleSessions.map((session) => (
                    <div key={session.id} className="rounded-md bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black capitalize">{session.type}</p>
                          <p className="text-sm text-slate-500">
                            Coach {session.coach} | {session.date} at{" "}
                            {session.time}
                          </p>
                        </div>
                        <StatusPill status={session.paymentStatus} />
                      </div>
                      <p className="mt-2 text-sm font-black text-slate-700">
                        {money(session.price)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-bold text-slate-500">
                    No private sessions yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-blue-900">
            No player linked yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ask an EVO admin to link your account to your player profile.
          </p>
        </section>
      )}
    </PageWrap>
  );
}
