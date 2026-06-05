import { createCoachAvailability } from "@/app/admin/actions";
import { PageHeader, PageWrap } from "@/components/ui";
import { requireRole } from "@/lib/security";
import { getCalendarData, getCoaches } from "@/lib/live-data";

export default async function CalendarPage() {
  const user = await requireRole(["admin", "coach", "parent"]);
  const [{ teams, availability }, coaches] = await Promise.all([
    getCalendarData(),
    getCoaches(),
  ]);
  const canManageAvailability = user.role === "admin" || user.role === "coach";

  return (
    <PageWrap>
      <PageHeader
        kicker="Calendar"
        title="Schedule and coach availability"
        description="A simple schedule view for team practices and available coach time slots."
      />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-blue-900">Team schedule</h2>
          <div className="mt-4 space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="rounded-md bg-slate-50 p-3">
                <p className="font-black">{team.name}</p>
                <p className="text-sm font-bold text-slate-600">
                  {team.schedule}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black text-blue-900">
            Coach availability
          </h2>
          {canManageAvailability ? (
            <form
              action={createCoachAvailability}
              className="mt-4 grid gap-3 rounded-md bg-slate-50 p-3"
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
                min="0"
                step="0.01"
                required
              />
              <button
                className="rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
                type="submit"
              >
                Add Slot
              </button>
            </form>
          ) : null}
          <div className="mt-4 space-y-4">
            {availability.map((coach) => (
              <div key={coach.coach}>
                <p className="font-black">{coach.coach}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {coach.slots.map((slot) => (
                    <span
                      key={slot}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-800"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageWrap>
  );
}
