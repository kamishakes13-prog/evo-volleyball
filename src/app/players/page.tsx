import {
  approvePlayer,
  createPlayer,
  deletePlayer,
  linkParentToPlayer,
  updatePlayer,
} from "@/app/admin/actions";
import Link from "next/link";
import { money, type Invoice, type Player, type Team } from "../data";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader, PageWrap } from "@/components/ui";
import { requireRole } from "@/lib/security";
import {
  getInvoices,
  getParentProfiles,
  getPlayers,
  getTeams,
} from "@/lib/live-data";

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

type PlayersPageProps = {
  searchParams: Promise<{ team?: string }>;
};

function groupedPlayers(players: Player[], teams: Team[]) {
  const groups = [
    {
      id: "unassigned",
      label: "Unassigned",
      helper: "Parent-created players and players waiting for team placement.",
      players: players.filter((player) => !player.teamId),
    },
    ...teams.map((team) => ({
      id: team.id,
      label: team.name,
      helper: `${team.ageGroup} | ${team.schedule}`,
      players: players.filter((player) => player.teamId === team.id),
    })),
  ];

  return groups.filter((group) => group.players.length > 0);
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const user = await requireRole(["admin", "coach"]);
  const params = await searchParams;
  const [players, teams, invoices, parentProfiles] = await Promise.all([
    getPlayers(),
    getTeams(),
    getInvoices(),
    getParentProfiles(),
  ]);
  const isAdmin = user.role === "admin";
  const selectedTeam = params.team ?? "all";
  const visiblePlayers =
    selectedTeam === "all"
      ? players
      : selectedTeam === "unassigned"
        ? players.filter((player) => !player.teamId)
        : players.filter((player) => player.teamId === selectedTeam);
  const playerGroups = groupedPlayers(visiblePlayers, teams);

  return (
    <PageWrap>
      <PageHeader
        kicker="Players"
        title="Player profiles"
        description="Parent contact info, team assignment, jersey number, notes, and balance summary."
      />
      <form
        className="mb-5 rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
        method="get"
      >
        <label className="block text-sm font-black text-slate-700">
          Filter players
          <select
            className="mt-2 w-full rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
            defaultValue={selectedTeam}
            name="team"
          >
            <option value="all">All players by team</option>
            <option value="unassigned">Unassigned only</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="mt-3 w-full rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
          type="submit"
        >
          Apply Filter
        </button>
      </form>
      <form
        action={createPlayer}
        className="mb-5 grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-3"
      >
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="playerName"
          placeholder="Player name"
          required
        />
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="parentName"
          placeholder="Parent name"
          required
        />
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="jerseyNumber"
          placeholder="Jersey #"
          type="number"
          min="1"
        />
        <select
          className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
          name="teamId"
          defaultValue=""
        >
          <option value="">No team yet</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="phone"
          placeholder="Phone"
        />
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="email"
          placeholder="Email"
          type="email"
        />
        <button
          className="rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
          type="submit"
        >
          Add Player
        </button>
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700 md:col-span-3"
          name="notes"
          placeholder="Notes"
        />
      </form>
      <div className="space-y-5">
        {playerGroups.map((group) => (
          <section
            className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
            key={group.id}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-lime-700">
                  Player group
                </p>
                <h2 className="text-xl font-black text-blue-900">
                  {group.label}
                </h2>
                <p className="text-sm font-bold text-slate-500">
                  {group.helper}
                </p>
              </div>
              <span className="rounded-md bg-blue-800 px-3 py-2 text-sm font-black text-white">
                {group.players.length}
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
        {group.players.map((player) => {
          const balance = balanceFor(player.id, invoices);
          const teamName =
            teams.find((team) => team.id === player.teamId)?.name ?? "No team";
          const needsTeam = !player.teamId;
          const needsApproval = player.active === false;
          const linkedParent = parentProfiles.find(
            (profile) => profile.id === player.userId,
          );

          return (
            <article
              key={player.id}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                needsTeam || needsApproval ? "border-lime-300" : "border-blue-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{player.name}</h2>
                  <p className="text-sm font-bold text-slate-500">
                    {player.jersey ? `#${player.jersey}` : "No jersey"} |{" "}
                    {teamName}
                  </p>
                  {linkedParent ? (
                    <p className="mt-1 text-xs font-black uppercase text-lime-700">
                      Linked parent: {linkedParent.name}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-black uppercase text-slate-400">
                      No parent account linked
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {needsApproval ? (
                      <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-black uppercase text-blue-950">
                        Pending admin approval
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black uppercase text-blue-800">
                        Approved
                      </span>
                    )}
                    {needsTeam ? (
                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black uppercase text-yellow-800">
                        Needs team
                      </span>
                    ) : null}
                  </div>
                </div>
                <span
                  className={`rounded-md px-3 py-2 text-sm font-black ${
                    needsTeam || needsApproval
                      ? "bg-lime-300 text-blue-950"
                      : "bg-blue-800 text-white"
                  }`}
                >
                  {needsApproval
                    ? "Confirm player"
                    : needsTeam
                      ? "Assign team"
                      : `${money(balance.remaining)} due`}
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
                  <p className="text-xs font-bold text-slate-500">Remaining</p>
                  <p className="font-black">{money(balance.remaining)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-1 text-sm text-slate-600">
                <p>
                  <span className="font-black text-slate-950">Parent:</span>{" "}
                  {player.parent}
                </p>
                <p>
                  <span className="font-black text-slate-950">
                    Account link:
                  </span>{" "}
                  {linkedParent
                    ? `${linkedParent.name} is connected to this player`
                    : "Not linked yet"}
                </p>
                <p>
                  <span className="font-black text-slate-950">Phone:</span>{" "}
                  {player.phone}
                </p>
                <p>
                  <span className="font-black text-slate-950">Email:</span>{" "}
                  {player.email}
                </p>
                <p>
                  <span className="font-black text-slate-950">Notes:</span>{" "}
                  {player.notes}
                </p>
              </div>
              <Link
                className="mt-4 block rounded-md bg-blue-800 px-3 py-2 text-center text-sm font-black text-white"
                href={`/players/${player.id}`}
              >
                View Profile
              </Link>
              {isAdmin ? (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <form action={updatePlayer} className="grid gap-2">
                    <input name="playerId" type="hidden" value={player.id} />
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="playerName"
                      defaultValue={player.name}
                      required
                    />
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="parentName"
                      defaultValue={player.parent}
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-700"
                        name="teamId"
                        defaultValue={player.teamId}
                      >
                        <option value="">No team yet</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                        name="jerseyNumber"
                        defaultValue={player.jersey || ""}
                        min="1"
                        placeholder="Jersey #"
                        type="number"
                      />
                    </div>
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="phone"
                      defaultValue={player.phone}
                    />
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="email"
                      defaultValue={player.email}
                      type="email"
                    />
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="notes"
                      defaultValue={player.notes}
                    />
                    <button
                      className="rounded-md bg-blue-800 px-3 py-2 text-sm font-black text-white"
                      type="submit"
                    >
                      Save Player
                    </button>
                  </form>
                  <form action={deletePlayer}>
                    <input name="playerId" type="hidden" value={player.id} />
                    <ConfirmSubmitButton
                      className="w-full rounded-md border border-red-200 px-3 py-2 text-sm font-black text-red-700"
                      message={`Are you sure you would like to delete ${player.name}? This will remove the player profile and related player records.`}
                    >
                      Delete Player
                    </ConfirmSubmitButton>
                  </form>
                  {needsApproval ? (
                    <form action={approvePlayer}>
                      <input name="playerId" type="hidden" value={player.id} />
                      <button
                        className="w-full rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={needsTeam}
                        title={
                          needsTeam
                            ? "Assign a team and save before approving."
                            : "Approve this player for the parent portal."
                        }
                        type="submit"
                      >
                        {needsTeam
                          ? "Assign Team Before Approval"
                          : "Approve Player"}
                      </button>
                    </form>
                  ) : null}
                  <form action={linkParentToPlayer} className="grid gap-2">
                    <input name="playerId" type="hidden" value={player.id} />
                    <select
                      className="rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-700"
                      name="profileId"
                      defaultValue={player.userId ?? ""}
                    >
                      <option value="">No linked parent</option>
                      {parentProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-blue-950"
                      type="submit"
                    >
                      Link Parent
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          );
        })}
            </div>
          </section>
        ))}
        {!playerGroups.length ? (
          <section className="rounded-lg border border-blue-100 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm">
            No players found for this filter.
          </section>
        ) : null}
      </div>
    </PageWrap>
  );
}
