import Link from "next/link";
import { notFound } from "next/navigation";
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
  await requireRole(["admin", "coach"]);
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
            <h2 className="text-lg font-black text-blue-900">Invoices</h2>
            <div className="mt-4 space-y-3">
              {playerInvoices.length ? (
                playerInvoices.map((invoice) => (
                  <div className="rounded-md bg-slate-50 p-3" key={invoice.id}>
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
