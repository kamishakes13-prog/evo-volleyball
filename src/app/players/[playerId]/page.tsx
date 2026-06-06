import Link from "next/link";
import { notFound } from "next/navigation";
import { createInvoice } from "@/app/admin/actions";
import { money } from "@/app/data";
import { PageHeader, PageWrap, StatusPill } from "@/components/ui";
import {
  getInvoices,
  getPlayers,
  getPrivateSessions,
  getReceiptRecords,
  getTeams,
} from "@/lib/live-data";
import { requireRole } from "@/lib/security";

type PlayerDetailPageProps = {
  params: Promise<{ playerId: string }>;
};

function formatDate(value: string) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PlayerDetailPage({
  params,
}: PlayerDetailPageProps) {
  const user = await requireRole(["admin", "coach"]);
  const { playerId } = await params;
  const [players, teams, invoices, receipts, sessions] = await Promise.all([
    getPlayers(),
    getTeams(),
    getInvoices(),
    getReceiptRecords(),
    getPrivateSessions(),
  ]);
  const player = players.find((item) => item.id === playerId);

  if (!player) {
    notFound();
  }

  const team = teams.find((item) => item.id === player.teamId);
  const playerInvoices = invoices.filter(
    (invoice) => invoice.playerId === player.id,
  );
  const invoiceTimeline = [...playerInvoices].sort((first, second) =>
    (first.dueDate || "9999-12-31").localeCompare(
      second.dueDate || "9999-12-31",
    ),
  );
  const playerReceipts = receipts.filter(
    (receipt) => receipt.playerId === player.id,
  );
  const playerSessions = sessions.filter(
    (session) => session.playerId === player.id,
  );
  const balance = playerInvoices.reduce(
    (summary, invoice) => {
      summary.total += invoice.amount;
      summary.paid += invoice.paid;
      summary.remaining += Math.max(invoice.amount - invoice.paid, 0);
      return summary;
    },
    { paid: 0, remaining: 0, total: 0 },
  );
  const progress =
    balance.total > 0
      ? Math.min(100, Math.round((balance.paid / balance.total) * 100))
      : 0;
  const isAdmin = user.role === "admin";

  return (
    <PageWrap>
      <Link className="text-sm font-black text-blue-800" href="/players">
        Back to Players
      </Link>
      <PageHeader
        kicker="Player profile"
        title={player.name}
        description="Full player information, balances, invoices, receipts, and private sessions."
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-blue-900">
                  {player.name}
                </h2>
                <p className="text-sm font-bold text-slate-500">
                  {player.jersey ? `#${player.jersey}` : "No jersey"} |{" "}
                  {team?.name ?? "No team yet"}
                </p>
              </div>
              <span
                className={`rounded-md px-3 py-2 text-sm font-black ${
                  player.active === false
                    ? "bg-lime-300 text-blue-950"
                    : "bg-blue-800 text-white"
                }`}
              >
                {player.active === false ? "Pending" : "Approved"}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              <p>
                <span className="font-black text-slate-950">Parent:</span>{" "}
                {player.parent}
              </p>
              <p>
                <span className="font-black text-slate-950">Phone:</span>{" "}
                {player.phone || "Not added"}
              </p>
              <p>
                <span className="font-black text-slate-950">Email:</span>{" "}
                {player.email || "Not added"}
              </p>
              <p>
                <span className="font-black text-slate-950">Team:</span>{" "}
                {team?.name ?? "Unassigned"}
              </p>
              <p>
                <span className="font-black text-slate-950">Schedule:</span>{" "}
                {team?.schedule ?? "No team schedule yet"}
              </p>
              <p>
                <span className="font-black text-slate-950">Notes:</span>{" "}
                {player.notes || "No notes"}
              </p>
            </div>
          </article>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Total billed</p>
              <p className="font-black">{money(balance.total)}</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Paid</p>
              <p className="font-black">{money(balance.paid)}</p>
            </div>
            <div className="rounded-lg border border-lime-200 bg-lime-50 p-3 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Remaining</p>
              <p className="font-black">{money(balance.remaining)}</p>
            </div>
          </div>

          <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-blue-900">
                  Payment progress
                </h2>
                <p className="text-sm font-bold text-slate-500">
                  {money(balance.paid)} paid of {money(balance.total)}
                </p>
              </div>
              <p className="text-xl font-black text-blue-900">{progress}%</p>
            </div>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-lime-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs font-black uppercase text-slate-500">
              <span>Paid {money(balance.paid)}</span>
              <span>Remaining {money(balance.remaining)}</span>
            </div>
          </article>

          {isAdmin ? (
            <form
              action={createInvoice}
              className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
            >
              <input name="playerId" type="hidden" value={player.id} />
              <h2 className="text-lg font-black text-blue-900">
                Set amount due
              </h2>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                Add a charge to this player profile. It will appear in the
                timeline and payment history once paid.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700 sm:col-span-2"
                  name="title"
                  placeholder="June Monthly Dues"
                  required
                />
                <select
                  className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
                  name="category"
                  defaultValue="monthly_dues"
                  required
                >
                  <option value="monthly_dues">Monthly dues</option>
                  <option value="tournament_fee">Tournament fee</option>
                  <option value="uniform">Uniform</option>
                  <option value="camp">Camp</option>
                  <option value="private_session">Private session</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                  name="amount"
                  placeholder="Amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                />
                <input
                  className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                  name="dueDate"
                  type="date"
                />
                <button
                  className="rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white sm:col-span-2"
                  type="submit"
                >
                  Add Amount Due
                </button>
              </div>
            </form>
          ) : null}

          <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-blue-900">
              Private sessions
            </h2>
            <div className="mt-4 space-y-3">
              {playerSessions.length ? (
                playerSessions.map((session) => (
                  <div className="rounded-md bg-slate-50 p-3" key={session.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black capitalize">{session.type}</p>
                        <p className="text-sm font-bold text-slate-500">
                          Coach {session.coach} | {session.date} at{" "}
                          {session.time}
                        </p>
                      </div>
                      <StatusPill status={session.paymentStatus} />
                    </div>
                    <p className="mt-2 text-sm font-black">
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
          </article>
        </section>

        <section className="space-y-4">
          <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-blue-900">
              Payment timeline
            </h2>
            <div className="mt-4 space-y-3">
              {invoiceTimeline.length ? (
                invoiceTimeline.map((invoice, index) => (
                  <div
                    className="grid grid-cols-[auto_1fr] gap-3 rounded-md bg-slate-50 p-3"
                    key={invoice.id}
                  >
                    <div className="flex flex-col items-center">
                      <span className="grid size-8 place-items-center rounded-full bg-blue-800 text-xs font-black text-white">
                        {index + 1}
                      </span>
                      {index < invoiceTimeline.length - 1 ? (
                        <span className="h-full min-h-8 w-0.5 bg-blue-100" />
                      ) : null}
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{invoice.title}</p>
                        <p className="text-sm font-bold text-slate-500">
                          {invoice.category} | due {invoice.dueDate || "TBD"}
                        </p>
                      </div>
                      <StatusPill status={invoice.status} />
                    </div>
                    <p className="mt-2 text-sm font-black">
                      {money(invoice.paid)} / {money(invoice.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-bold text-slate-500">
                  No invoices yet.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-blue-900">
              Payment history
            </h2>
            <div className="mt-4 space-y-3">
              {playerReceipts.length ? (
                playerReceipts.map((receipt) => (
                  <div className="rounded-md bg-slate-50 p-3" key={receipt.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{receipt.invoiceTitle}</p>
                        <p className="text-sm font-bold capitalize text-slate-500">
                          {receipt.method} | {formatDate(receipt.paidAt)}
                        </p>
                      </div>
                      <p className="font-black text-blue-900">
                        {money(receipt.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm font-bold text-slate-500">
                  No payments recorded yet.
                </p>
              )}
            </div>
          </article>
        </section>
      </div>
    </PageWrap>
  );
}
