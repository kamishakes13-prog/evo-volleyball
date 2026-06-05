import { recordAttendance } from "@/app/admin/actions";
import { PageHeader, PageWrap, StatusPill } from "@/components/ui";
import { getAttendanceRecords, getPlayers, getTeams } from "@/lib/live-data";
import { requireRole } from "@/lib/security";

const statusOptions = ["present", "absent", "late", "excused"] as const;

export default async function AttendancePage() {
  await requireRole(["admin", "coach"]);
  const [players, teams, attendance] = await Promise.all([
    getPlayers(),
    getTeams(),
    getAttendanceRecords(),
  ]);

  return (
    <PageWrap>
      <PageHeader
        kicker="Attendance"
        title="Roster attendance"
        description="Record player attendance for practices, events, and team sessions."
      />

      <form
        action={recordAttendance}
        className="mb-5 grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-4"
      >
        <select
          className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700 md:col-span-2"
          name="playerId"
          defaultValue=""
          required
        >
          <option value="" disabled>
            Select player
          </option>
          {players.map((player) => {
            const teamName =
              teams.find((team) => team.id === player.teamId)?.name ?? "No team";
            return (
              <option key={player.id} value={player.id}>
                {player.name} | {teamName}
              </option>
            );
          })}
        </select>
        <select
          className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
          name="status"
          defaultValue="present"
          required
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          className="rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
          type="submit"
        >
          Record
        </button>
        <input
          className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700 md:col-span-4"
          name="notes"
          placeholder="Notes"
        />
      </form>

      <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 bg-blue-50 p-4 text-sm font-black text-blue-900 md:grid-cols-[1fr_1fr_0.7fr_1fr]">
          <span>Player</span>
          <span>Team</span>
          <span>Status</span>
          <span>Recorded</span>
        </div>
        {attendance.length ? (
          attendance.map((record) => (
            <div
              key={record.id}
              className="grid gap-3 border-b border-slate-100 p-4 text-sm last:border-0 md:grid-cols-[1fr_1fr_0.7fr_1fr]"
            >
              <p className="font-black">{record.playerName}</p>
              <p className="font-bold text-slate-600">{record.teamName}</p>
              <StatusPill
                status={
                  record.status === "present"
                    ? "paid"
                    : record.status === "late"
                      ? "partial"
                      : record.status === "excused"
                        ? "waived"
                        : "overdue"
                }
              />
              <p className="text-slate-600">
                {new Date(record.recordedAt).toLocaleString("en-US")}
              </p>
              {record.notes ? (
                <p className="text-slate-500 md:col-span-4">{record.notes}</p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="p-4 text-sm font-bold text-slate-500">
            No attendance recorded yet.
          </p>
        )}
      </section>
    </PageWrap>
  );
}
