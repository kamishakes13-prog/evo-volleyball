import { createTeam, deleteTeam, updateTeam } from "@/app/admin/actions";
import { money } from "../data";
import { PageHeader, PageWrap } from "@/components/ui";
import { requireRole } from "@/lib/security";
import { getPlayers, getTeams } from "@/lib/live-data";

export default async function TeamsPage() {
  const user = await requireRole(["admin", "coach", "parent"]);
  const [teams, players] = await Promise.all([getTeams(), getPlayers()]);
  const isAdmin = user.role === "admin";

  return (
    <PageWrap>
      <PageHeader
        kicker="Teams"
        title="Roster capacity and dues"
        description="Admin can create teams later; this MVP shows the team structure and roster counts first."
      />
      <form
        action={createTeam}
        className="mb-5 grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-5"
      >
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="name"
          placeholder="Team name"
          required
        />
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="ageGroup"
          placeholder="Age group"
          required
        />
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="maxPlayers"
          placeholder="Max players"
          type="number"
          min="1"
          required
        />
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
          name="monthlyDues"
          placeholder="Monthly dues"
          type="number"
          min="0"
          required
        />
        <button
          className="rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
          type="submit"
        >
          Add Team
        </button>
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700 md:col-span-5"
          name="schedule"
          placeholder="Schedule"
        />
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {teams.map((team) => {
          const count = players.filter((player) => player.teamId === team.id).length;
          const percent = Math.round((count / team.maxPlayers) * 100);

          return (
            <article
              key={team.id}
              className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-blue-900">
                    {team.name}
                  </h2>
                  <p className="text-sm font-bold text-slate-500">
                    {team.ageGroup} with Coach {team.coach}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-800">
                  {count}/{team.maxPlayers}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-lime-400"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="font-bold text-slate-500">Monthly dues</dt>
                  <dd className="font-black">{money(team.monthlyDues)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Schedule</dt>
                  <dd className="mt-1 font-bold text-slate-800">
                    {team.schedule}
                  </dd>
                </div>
                  </dl>
                  {isAdmin ? (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                      <form action={updateTeam} className="grid gap-2">
                        <input name="teamId" type="hidden" value={team.id} />
                        <input
                          className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                          name="name"
                          defaultValue={team.name}
                          required
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                            name="ageGroup"
                            defaultValue={team.ageGroup}
                            required
                          />
                          <input
                            className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                            name="maxPlayers"
                            defaultValue={team.maxPlayers}
                            min="1"
                            type="number"
                            required
                          />
                        </div>
                        <input
                          className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                          name="monthlyDues"
                          defaultValue={team.monthlyDues}
                          min="0"
                          step="0.01"
                          type="number"
                          required
                        />
                        <input
                          className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                          name="schedule"
                          defaultValue={team.schedule}
                        />
                        <button
                          className="rounded-md bg-blue-800 px-3 py-2 text-sm font-black text-white"
                          type="submit"
                        >
                          Save Team
                        </button>
                      </form>
                      <form action={deleteTeam}>
                        <input name="teamId" type="hidden" value={team.id} />
                        <button
                          className="w-full rounded-md border border-red-200 px-3 py-2 text-sm font-black text-red-700"
                          type="submit"
                        >
                          Delete Team
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })}
      </div>
    </PageWrap>
  );
}
