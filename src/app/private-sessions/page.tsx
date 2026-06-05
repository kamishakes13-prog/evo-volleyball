import { createPrivateSession } from "@/app/admin/actions";
import { money } from "../data";
import { PageHeader, PageWrap, StatusPill } from "@/components/ui";
import { requireRole } from "@/lib/security";
import { getCoaches, getPlayers, getPrivateSessions } from "@/lib/live-data";

export default async function PrivateSessionsPage() {
  const user = await requireRole(["admin", "coach", "parent"]);
  const [privateSessions, players, coaches] = await Promise.all([
    getPrivateSessions(),
    getPlayers(),
    getCoaches(),
  ]);
  const isAdmin = user.role === "admin";

  return (
    <PageWrap>
      <PageHeader
        kicker="Private sessions"
        title="Session bookings"
        description="Basic booking records with coach, player, time, price, and payment status."
      />
      {isAdmin ? (
        <form
          action={createPrivateSession}
          className="mb-5 grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-3"
        >
          <select
            className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
            name="coachId"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select coach
            </option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
            name="playerId"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select player
            </option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
            name="sessionType"
            defaultValue="one_on_one"
            required
          >
            <option value="one_on_one">1-on-1</option>
            <option value="small_group">Small group</option>
            <option value="skills_training">Skills training</option>
          </select>
          <input
            className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
            name="startsAt"
            type="datetime-local"
            required
          />
          <input
            className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
            name="price"
            placeholder="Price"
            type="number"
            min="1"
            step="0.01"
            required
          />
          <button
            className="rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
            type="submit"
          >
            Book Session
          </button>
        </form>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {privateSessions.map((session) => (
          <article
            key={session.id}
            className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black capitalize">
                  {session.type}
                </h2>
                <p className="text-sm font-bold text-slate-500">
                  {players.find((player) => player.id === session.playerId)?.name ??
                    "Player"}
                </p>
              </div>
              <StatusPill status={session.paymentStatus} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="font-bold text-slate-500">Coach</dt>
                <dd className="font-black">{session.coach}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold text-slate-500">Date</dt>
                <dd className="font-black">{session.date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold text-slate-500">Time</dt>
                <dd className="font-black">{session.time}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold text-slate-500">Price</dt>
                <dd className="font-black">{money(session.price)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </PageWrap>
  );
}
