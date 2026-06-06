import {
  availability as mockAvailability,
  dashboard as mockDashboard,
  invoices as mockInvoices,
  players as mockPlayers,
  privateSessions as mockPrivateSessions,
  teams as mockTeams,
  type Invoice,
  type Player,
  type PrivateSession,
  type Team,
} from "@/app/data";
import { createClient } from "@/lib/supabase/server";

type DbTeam = {
  id: string;
  name: string;
  age_group: string;
  max_player_count: number;
  monthly_dues_cents: number;
  schedule: string | null;
  coaches: { name: string } | null;
};

type DbPlayer = {
  id: string;
  user_id: string | null;
  player_name: string;
  parent_name: string;
  phone: string | null;
  email: string | null;
  team_id: string | null;
  jersey_number: number | null;
  notes: string | null;
  active: boolean;
};

type DbCoach = {
  id: string;
  name: string;
};

type DbProfile = {
  id: string;
  full_name: string;
  role: string;
};

type DbInvoice = {
  id: string;
  player_id: string;
  title: string;
  category: string;
  amount_cents: number;
  paid_cents: number;
  due_date: string | null;
  status: Invoice["status"];
  payments?: { method: string }[];
};

type DbPrivateSession = {
  id: string;
  session_type: string;
  price_cents: number;
  starts_at: string;
  payment_status: Invoice["status"];
  player_id: string;
  coaches: { name: string } | null;
};

type DbAvailability = {
  id: string;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  is_booked: boolean;
  coaches: { name: string } | null;
};

type DbAttendance = {
  id: string;
  player_id: string;
  team_id: string;
  status: "present" | "absent" | "late" | "excused";
  notes: string | null;
  recorded_at: string;
  players: { player_name: string } | null;
  teams: { name: string } | null;
};

type DbReceipt = {
  id: string;
  amount_cents: number;
  method: string;
  paid_at: string;
  invoices: {
    id: string;
    title: string;
    category: string;
    players: {
      id: string;
      player_name: string;
      parent_name: string;
      teams: {
        id: string;
        name: string;
        age_group: string;
      } | null;
    } | null;
  } | null;
};

export type ReceiptRecord = {
  id: string;
  amount: number;
  category: string;
  invoiceId: string;
  invoiceTitle: string;
  method: string;
  paidAt: string;
  parentName: string;
  playerId: string;
  playerName: string;
  teamAgeGroup: string;
  teamId: string;
  teamName: string;
};

function invoiceCategory(category: string): Invoice["category"] {
  return category.replaceAll("_", " ") as Invoice["category"];
}

function sessionType(type: string): PrivateSession["type"] {
  if (type === "one_on_one") {
    return "1-on-1";
  }

  if (type === "small_group") {
    return "small group";
  }

  return "skills training";
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient();

  if (!supabase) {
    return mockTeams;
  }

  const { data, error } = await supabase
    .from("teams")
    .select("id,name,age_group,max_player_count,monthly_dues_cents,schedule,coaches(name)")
    .order("age_group");

  if (error || !data) {
    return [];
  }

  return (data as unknown as DbTeam[]).map((team) => ({
    id: team.id,
    name: team.name,
    ageGroup: team.age_group,
    coach: team.coaches?.name ?? "Unassigned",
    maxPlayers: team.max_player_count,
    monthlyDues: Math.round(team.monthly_dues_cents / 100),
    schedule: team.schedule ?? "Schedule TBD",
  }));
}

export async function getPlayers(): Promise<Player[]> {
  const supabase = await createClient();

  if (!supabase) {
    return mockPlayers;
  }

  const { data, error } = await supabase.from("players").select("*").order("player_name");

  if (error || !data) {
    return [];
  }

  return (data as DbPlayer[]).map((player) => ({
    id: player.id,
    userId: player.user_id ?? undefined,
    name: player.player_name,
    parent: player.parent_name,
    phone: player.phone ?? "",
    email: player.email ?? "",
    teamId: player.team_id ?? "",
    jersey: player.jersey_number ?? 0,
    notes: player.notes ?? "",
    active: player.active,
  }));
}

export async function getCoaches() {
  const fallback = Array.from(new Set(mockTeams.map((team) => team.coach))).map(
    (name, index) => ({ id: `mock-coach-${index}`, name }),
  );
  const supabase = await createClient();

  if (!supabase) {
    return fallback;
  }

  const { data, error } = await supabase
    .from("coaches")
    .select("id,name")
    .order("name");

  if (error || !data) {
    return [];
  }

  return (data as DbCoach[]).map((coach) => ({
    id: coach.id,
    name: coach.name,
  }));
}

export async function getParentProfiles() {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,role")
    .eq("role", "parent_player")
    .order("full_name");

  if (error || !data) {
    return [];
  }

  return (data as DbProfile[]).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
  }));
}

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient();

  if (!supabase) {
    return mockInvoices;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("id,player_id,title,category,amount_cents,paid_cents,due_date,status,payments(method)")
    .order("due_date");

  if (error || !data) {
    return [];
  }

  return (data as unknown as DbInvoice[]).map((invoice) => ({
    id: invoice.id,
    playerId: invoice.player_id,
    title: invoice.title,
    category: invoiceCategory(invoice.category),
    amount: Math.round(invoice.amount_cents / 100),
    paid: Math.round(invoice.paid_cents / 100),
    dueDate: invoice.due_date ?? "",
    status: invoice.status,
    method: invoice.payments?.[0]?.method?.replaceAll("_", " ") as Invoice["method"],
  }));
}

export async function getPrivateSessions(): Promise<PrivateSession[]> {
  const supabase = await createClient();

  if (!supabase) {
    return mockPrivateSessions;
  }

  const { data, error } = await supabase
    .from("private_sessions")
    .select("id,session_type,price_cents,starts_at,payment_status,player_id,coaches(name)")
    .order("starts_at");

  if (error || !data) {
    return [];
  }

  return (data as unknown as DbPrivateSession[]).map((session) => {
    const date = new Date(session.starts_at);

    return {
      id: session.id,
      type: sessionType(session.session_type),
      price: Math.round(session.price_cents / 100),
      coach: session.coaches?.name ?? "Unassigned",
      date: date.toLocaleDateString("en-US"),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      playerId: session.player_id,
      paymentStatus: session.payment_status,
    };
  });
}

export async function getCoachAvailability() {
  const supabase = await createClient();

  if (!supabase) {
    return mockAvailability;
  }

  const { data, error } = await supabase
    .from("coach_availability")
    .select("id,starts_at,ends_at,price_cents,is_booked,coaches(name)")
    .order("starts_at");

  if (error || !data) {
    return [];
  }

  const grouped = new Map<string, { coach: string; slots: string[] }>();

  for (const slot of data as unknown as DbAvailability[]) {
    const coachName = slot.coaches?.name ?? "Unassigned";
    const start = new Date(slot.starts_at);
    const label = `${start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} ${start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}${slot.is_booked ? " booked" : ""}`;

    const current = grouped.get(coachName) ?? { coach: coachName, slots: [] };
    current.slots.push(label);
    grouped.set(coachName, current);
  }

  return Array.from(grouped.values());
}

export async function getAttendanceRecords() {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("attendance")
    .select("id,player_id,team_id,status,notes,recorded_at,players(player_name),teams(name)")
    .order("recorded_at", { ascending: false })
    .limit(40);

  if (error || !data) {
    return [];
  }

  return (data as unknown as DbAttendance[]).map((record) => ({
    id: record.id,
    playerId: record.player_id,
    teamId: record.team_id,
    playerName: record.players?.player_name ?? "Player",
    teamName: record.teams?.name ?? "Team",
    status: record.status,
    notes: record.notes ?? "",
    recordedAt: record.recorded_at,
  }));
}

export async function getReceiptRecords(): Promise<ReceiptRecord[]> {
  const supabase = await createClient();

  if (!supabase) {
    const playersById = new Map(mockPlayers.map((player) => [player.id, player]));
    const teamsById = new Map(mockTeams.map((team) => [team.id, team]));

    return mockInvoices
      .filter((invoice) => invoice.paid > 0)
      .map((invoice) => {
        const player = playersById.get(invoice.playerId);
        const team = player ? teamsById.get(player.teamId) : undefined;

        return {
          id: `mock-receipt-${invoice.id}`,
          amount: invoice.paid,
          category: invoice.category,
          invoiceId: invoice.id,
          invoiceTitle: invoice.title,
          method: invoice.method ?? "other",
          paidAt: invoice.dueDate,
          parentName: player?.parent ?? "Parent",
          playerId: player?.id ?? "unknown",
          playerName: player?.name ?? "Player",
          teamAgeGroup: team?.ageGroup ?? "",
          teamId: team?.id ?? "unassigned",
          teamName: team?.name ?? "No team",
        };
      });
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id,amount_cents,method,paid_at,invoices(id,title,category,players(id,player_name,parent_name,teams(id,name,age_group)))",
    )
    .order("paid_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as DbReceipt[]).map((receipt) => {
    const player = receipt.invoices?.players;
    const team = player?.teams;

    return {
      id: receipt.id,
      amount: Math.round(receipt.amount_cents / 100),
      category: receipt.invoices
        ? invoiceCategory(receipt.invoices.category)
        : "custom",
      invoiceId: receipt.invoices?.id ?? "",
      invoiceTitle: receipt.invoices?.title ?? "Deleted invoice",
      method: receipt.method.replaceAll("_", " "),
      paidAt: receipt.paid_at,
      parentName: player?.parent_name ?? "Parent",
      playerId: player?.id ?? "unknown",
      playerName: player?.player_name ?? "Player",
      teamAgeGroup: team?.age_group ?? "",
      teamId: team?.id ?? "unassigned",
      teamName: team?.name ?? "No team",
    };
  });
}

export async function getDashboard() {
  const [players, teams, invoices, sessions] = await Promise.all([
    getPlayers(),
    getTeams(),
    getInvoices(),
    getPrivateSessions(),
  ]);

  if (
    players === mockPlayers &&
    teams === mockTeams &&
    invoices === mockInvoices &&
    sessions === mockPrivateSessions
  ) {
    return mockDashboard;
  }

  return {
    totalPlayers: players.length,
    activeTeams: teams.length,
    monthlyRevenue: invoices.reduce((total, invoice) => total + invoice.paid, 0),
    outstandingBalances: invoices.reduce(
      (total, invoice) => total + Math.max(invoice.amount - invoice.paid, 0),
      0,
    ),
    overdueInvoices: invoices.filter((invoice) => invoice.status === "overdue").length,
    upcomingPrivateSessions: sessions.length,
    recentPayments: invoices
      .filter((invoice) => invoice.paid > 0)
      .slice(0, 3)
      .map((invoice) => ({
        id: invoice.id,
        player: players.find((player) => player.id === invoice.playerId)?.name ?? "Player",
        amount: invoice.paid,
        method: invoice.method ?? "other",
        title: invoice.title,
      })),
  };
}

export async function getCalendarData() {
  return {
    teams: await getTeams(),
    availability: await getCoachAvailability(),
  };
}
