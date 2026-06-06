import { money } from "@/app/data";
import { PageHeader, PageWrap } from "@/components/ui";
import {
  getReceiptRecords,
  type ReceiptRecord,
} from "@/lib/live-data";
import { requireRole } from "@/lib/security";

type ReceiptsPageProps = {
  searchParams: Promise<{
    date?: string;
    q?: string;
  }>;
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

function formatTime(value: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupReceipts(receipts: ReceiptRecord[]) {
  type PlayerFolder = { playerName: string; receipts: ReceiptRecord[] };
  type TeamFolder = {
    receipts: ReceiptRecord[];
    teamAgeGroup: string;
    teamName: string;
    players: Map<string, PlayerFolder>;
  };
  const teams = new Map<
    string,
    TeamFolder
  >();

  for (const receipt of receipts) {
    const fallbackTeam: TeamFolder = {
      players: new Map(),
      receipts: [],
      teamAgeGroup: receipt.teamAgeGroup,
      teamName: receipt.teamName,
    };
    const team = teams.get(receipt.teamId) ?? fallbackTeam;
    const fallbackPlayer: PlayerFolder = {
      playerName: receipt.playerName,
      receipts: [],
    };
    const player = team.players.get(receipt.playerId) ?? fallbackPlayer;

    team.receipts.push(receipt);
    player.receipts.push(receipt);
    team.players.set(receipt.playerId, player);
    teams.set(receipt.teamId, team);
  }

  return Array.from(teams.entries()).sort(([, first], [, second]) =>
    first.teamName.localeCompare(second.teamName),
  );
}

export default async function ReceiptsPage({ searchParams }: ReceiptsPageProps) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const date = params.date ?? "";
  const receipts = await getReceiptRecords();
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesName =
      !query ||
      receipt.playerName.toLowerCase().includes(query) ||
      receipt.parentName.toLowerCase().includes(query) ||
      receipt.invoiceTitle.toLowerCase().includes(query) ||
      receipt.teamName.toLowerCase().includes(query);
    const matchesDate = !date || receipt.paidAt.slice(0, 10) === date;

    return matchesName && matchesDate;
  });
  const groupedTeams = groupReceipts(filteredReceipts);
  const totalPaid = filteredReceipts.reduce(
    (total, receipt) => total + receipt.amount,
    0,
  );

  return (
    <PageWrap>
      <PageHeader
        kicker="Receipts"
        title="Payment history"
        description="Admin-only receipt log organized by team, then by player."
      />

      <form
        className="mb-5 grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]"
        method="get"
      >
        <label className="block text-sm font-black text-slate-700">
          Search by name
          <input
            className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
            defaultValue={params.q ?? ""}
            name="q"
            placeholder="Player, parent, invoice, or team"
          />
        </label>
        <label className="block text-sm font-black text-slate-700">
          Payment date
          <input
            className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
            defaultValue={date}
            name="date"
            type="date"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="w-full rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white md:w-auto"
            type="submit"
          >
            Search
          </button>
          <a
            className="rounded-md border border-blue-100 px-4 py-3 text-sm font-black text-blue-800"
            href="/receipts"
          >
            Clear
          </a>
        </div>
      </form>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500">
            Receipts
          </p>
          <p className="mt-2 text-2xl font-black text-blue-900">
            {filteredReceipts.length}
          </p>
        </section>
        <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500">
            Total collected
          </p>
          <p className="mt-2 text-2xl font-black text-blue-900">
            {money(totalPaid)}
          </p>
        </section>
        <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500">
            Team folders
          </p>
          <p className="mt-2 text-2xl font-black text-blue-900">
            {groupedTeams.length}
          </p>
        </section>
      </div>

      <div className="space-y-4">
        {groupedTeams.map(([teamId, team]) => {
          const teamTotal = team.receipts.reduce(
            (total, receipt) => total + receipt.amount,
            0,
          );

          return (
            <details
              className="rounded-lg border border-blue-100 bg-white shadow-sm"
              key={teamId}
              open
            >
              <summary className="cursor-pointer list-none rounded-t-lg bg-blue-900 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-lime-300">
                      Team folder
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      {team.teamName}
                    </h2>
                    <p className="text-sm font-bold text-blue-100">
                      {team.teamAgeGroup || "Age group TBD"} |{" "}
                      {team.players.size} player folders
                    </p>
                  </div>
                  <p className="shrink-0 rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-blue-950">
                    {money(teamTotal)}
                  </p>
                </div>
              </summary>

              <div className="space-y-3 p-4">
                {Array.from(team.players.entries())
                  .sort(([, first], [, second]) =>
                    first.playerName.localeCompare(second.playerName),
                  )
                  .map(([playerId, player]) => {
                    const playerTotal = player.receipts.reduce(
                      (total, receipt) => total + receipt.amount,
                      0,
                    );

                    return (
                      <details
                        className="rounded-md border border-slate-100 bg-slate-50"
                        key={playerId}
                        open
                      >
                        <summary className="cursor-pointer list-none p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase text-slate-500">
                                Player folder
                              </p>
                              <h3 className="text-lg font-black text-slate-950">
                                {player.playerName}
                              </h3>
                            </div>
                            <p className="rounded-md bg-white px-3 py-2 text-sm font-black text-blue-900">
                              {money(playerTotal)}
                            </p>
                          </div>
                        </summary>

                        <div className="space-y-2 border-t border-slate-200 p-3">
                          {player.receipts.map((receipt) => (
                            <article
                              className="rounded-md border border-blue-100 bg-white p-3"
                              key={receipt.id}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-black text-blue-900">
                                    {receipt.invoiceTitle}
                                  </p>
                                  <p className="text-sm font-bold capitalize text-slate-500">
                                    {receipt.category} | {receipt.method}
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-slate-500">
                                    Parent: {receipt.parentName}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-blue-900">
                                    {money(receipt.amount)}
                                  </p>
                                  <p className="text-xs font-bold text-slate-500">
                                    {formatDate(receipt.paidAt)}
                                  </p>
                                  <p className="text-xs font-bold text-slate-400">
                                    {formatTime(receipt.paidAt)}
                                  </p>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </details>
                    );
                  })}
              </div>
            </details>
          );
        })}

        {!filteredReceipts.length ? (
          <section className="rounded-lg border border-blue-100 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">
            No receipts found for that search.
          </section>
        ) : null}
      </div>
    </PageWrap>
  );
}
