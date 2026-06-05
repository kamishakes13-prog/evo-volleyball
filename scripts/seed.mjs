import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing Supabase URL or service role key.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const coaches = [
  { name: "Maya Ortiz", email: "maya@evovolleyball.com", phone: "(214) 555-0101" },
  { name: "Andre Cole", email: "andre@evovolleyball.com", phone: "(214) 555-0102" },
  { name: "Nina Park", email: "nina@evovolleyball.com", phone: "(214) 555-0103" },
];

const teams = [
  {
    name: "EVO 14 Blue",
    age_group: "14U",
    coach: "Maya Ortiz",
    max_player_count: 12,
    monthly_dues_cents: 27500,
    schedule: "Mon/Wed 6:00 PM, Sat 10:00 AM",
  },
  {
    name: "EVO 15 White",
    age_group: "15U",
    coach: "Andre Cole",
    max_player_count: 12,
    monthly_dues_cents: 29500,
    schedule: "Tue/Thu 6:30 PM, Sun 1:00 PM",
  },
  {
    name: "EVO 17 Elite",
    age_group: "17U",
    coach: "Nina Park",
    max_player_count: 10,
    monthly_dues_cents: 32500,
    schedule: "Mon/Thu 7:30 PM, Sat 12:00 PM",
  },
];

const players = [
  {
    player_name: "Ava Thompson",
    parent_name: "Kendra Thompson",
    phone: "(214) 555-0174",
    email: "kendra@example.com",
    team: "EVO 14 Blue",
    jersey_number: 7,
    notes: "Setter. Prefers Monday private sessions.",
  },
  {
    player_name: "Mia Sanchez",
    parent_name: "Rosa Sanchez",
    phone: "(972) 555-0190",
    email: "rosa@example.com",
    team: "EVO 14 Blue",
    jersey_number: 12,
    notes: "Needs uniform balance reminder.",
  },
  {
    player_name: "Lena Brooks",
    parent_name: "Chris Brooks",
    phone: "(469) 555-0168",
    email: "chris@example.com",
    team: "EVO 15 White",
    jersey_number: 4,
    notes: "Outside hitter. Cleared for tournament travel.",
  },
  {
    player_name: "Skye Patel",
    parent_name: "Mina Patel",
    phone: "(214) 555-0142",
    email: "mina@example.com",
    team: "EVO 17 Elite",
    jersey_number: 22,
    notes: "Libero. Private session package active.",
  },
  {
    player_name: "Nora Kim",
    parent_name: "Daniel Kim",
    phone: "(817) 555-0139",
    email: "daniel@example.com",
    team: "EVO 17 Elite",
    jersey_number: 9,
    notes: "College showcase target list in progress.",
  },
];

const invoices = [
  {
    player: "Ava Thompson",
    title: "June Monthly Dues",
    category: "monthly_dues",
    amount_cents: 27500,
    paid_cents: 27500,
    due_date: "2026-06-10",
    status: "paid",
    payment: { amount_cents: 27500, method: "zelle" },
  },
  {
    player: "Mia Sanchez",
    title: "Uniform Kit",
    category: "uniform",
    amount_cents: 18000,
    paid_cents: 7500,
    due_date: "2026-06-01",
    status: "partial",
    payment: { amount_cents: 7500, method: "venmo" },
  },
  {
    player: "Lena Brooks",
    title: "June Monthly Dues",
    category: "monthly_dues",
    amount_cents: 29500,
    paid_cents: 0,
    due_date: "2026-06-05",
    status: "overdue",
  },
  {
    player: "Skye Patel",
    title: "Skills Training Session",
    category: "private_session",
    amount_cents: 8500,
    paid_cents: 8500,
    due_date: "2026-06-08",
    status: "paid",
    payment: { amount_cents: 8500, method: "cash_app" },
  },
  {
    player: "Nora Kim",
    title: "Regional Tournament Fee",
    category: "tournament_fee",
    amount_cents: 22500,
    paid_cents: 0,
    due_date: "2026-06-18",
    status: "unpaid",
  },
];

async function upsertByName(table, rows) {
  const inserted = new Map();

  for (const row of rows) {
    const { data: existing, error: existingError } = await supabase
      .from(table)
      .select("*")
      .eq("name", row.name)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      inserted.set(row.name, existing);
      continue;
    }

    const { data, error } = await supabase.from(table).insert(row).select("*").single();
    if (error) throw error;
    inserted.set(row.name, data);
  }

  return inserted;
}

const coachMap = await upsertByName("coaches", coaches);
const teamRows = teams.map((team) => ({
  name: team.name,
  age_group: team.age_group,
  coach_id: coachMap.get(team.coach)?.id,
  max_player_count: team.max_player_count,
  monthly_dues_cents: team.monthly_dues_cents,
  schedule: team.schedule,
}));
const teamMap = await upsertByName("teams", teamRows);

const playerMap = new Map();
for (const player of players) {
  const { data: existing, error: existingError } = await supabase
    .from("players")
    .select("*")
    .eq("player_name", player.player_name)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    playerMap.set(player.player_name, existing);
    continue;
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      player_name: player.player_name,
      parent_name: player.parent_name,
      phone: player.phone,
      email: player.email,
      team_id: teamMap.get(player.team)?.id,
      jersey_number: player.jersey_number,
      notes: player.notes,
    })
    .select("*")
    .single();

  if (error) throw error;
  playerMap.set(player.player_name, data);
}

for (const invoice of invoices) {
  const player = playerMap.get(invoice.player);
  const { data: existing, error: existingError } = await supabase
    .from("invoices")
    .select("*")
    .eq("player_id", player.id)
    .eq("title", invoice.title)
    .maybeSingle();

  if (existingError) throw existingError;

  const invoiceRow =
    existing ??
    (
      await supabase
        .from("invoices")
        .insert({
          player_id: player.id,
          title: invoice.title,
          category: invoice.category,
          amount_cents: invoice.amount_cents,
          paid_cents: invoice.paid_cents,
          due_date: invoice.due_date,
          status: invoice.status,
        })
        .select("*")
        .single()
    ).data;

  if (!invoiceRow) throw new Error(`Could not create invoice ${invoice.title}`);

  if (invoice.payment) {
    const { data: paymentExists, error: paymentCheckError } = await supabase
      .from("payments")
      .select("id")
      .eq("invoice_id", invoiceRow.id)
      .maybeSingle();

    if (paymentCheckError) throw paymentCheckError;

    if (!paymentExists) {
      const { error } = await supabase.from("payments").insert({
        invoice_id: invoiceRow.id,
        amount_cents: invoice.payment.amount_cents,
        method: invoice.payment.method,
      });
      if (error) throw error;
    }
  }
}

for (const team of teams) {
  const coach = coachMap.get(team.coach);
  const teamRow = teamMap.get(team.name);

  const { data: eventExists, error: eventCheckError } = await supabase
    .from("calendar_events")
    .select("id")
    .eq("team_id", teamRow.id)
    .eq("title", `${team.name} Practice`)
    .maybeSingle();

  if (eventCheckError) throw eventCheckError;

  if (!eventExists) {
    const { error } = await supabase.from("calendar_events").insert({
      team_id: teamRow.id,
      coach_id: coach.id,
      title: `${team.name} Practice`,
      location: "EVO Training Center",
      starts_at: "2026-06-08T18:00:00-05:00",
      ends_at: "2026-06-08T20:00:00-05:00",
      event_type: "practice",
    });
    if (error) throw error;
  }
}

const availabilitySeeds = [
  { coach: "Maya Ortiz", starts_at: "2026-06-09T16:00:00-05:00", price_cents: 8500 },
  { coach: "Andre Cole", starts_at: "2026-06-10T17:30:00-05:00", price_cents: 7500 },
  { coach: "Nina Park", starts_at: "2026-06-11T17:00:00-05:00", price_cents: 9500 },
];

for (const availability of availabilitySeeds) {
  const coach = coachMap.get(availability.coach);
  const start = new Date(availability.starts_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const { data: exists, error: checkError } = await supabase
    .from("coach_availability")
    .select("id")
    .eq("coach_id", coach.id)
    .eq("starts_at", start.toISOString())
    .maybeSingle();

  if (checkError) throw checkError;

  if (!exists) {
    const { error } = await supabase.from("coach_availability").insert({
      coach_id: coach.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      price_cents: availability.price_cents,
      is_booked: false,
    });
    if (error) throw error;
  }
}

const sessionSeeds = [
  {
    coach: "Maya Ortiz",
    player: "Ava Thompson",
    session_type: "skills_training",
    price_cents: 8500,
    starts_at: "2026-06-07T16:00:00-05:00",
    ends_at: "2026-06-07T17:00:00-05:00",
    payment_status: "unpaid",
  },
  {
    coach: "Nina Park",
    player: "Skye Patel",
    session_type: "one_on_one",
    price_cents: 9500,
    starts_at: "2026-06-08T17:30:00-05:00",
    ends_at: "2026-06-08T18:30:00-05:00",
    payment_status: "paid",
  },
  {
    coach: "Andre Cole",
    player: "Lena Brooks",
    session_type: "small_group",
    price_cents: 5500,
    starts_at: "2026-06-11T18:00:00-05:00",
    ends_at: "2026-06-11T19:00:00-05:00",
    payment_status: "partial",
  },
];

for (const session of sessionSeeds) {
  const coach = coachMap.get(session.coach);
  const player = playerMap.get(session.player);
  const { data: exists, error: checkError } = await supabase
    .from("private_sessions")
    .select("id")
    .eq("coach_id", coach.id)
    .eq("starts_at", session.starts_at)
    .maybeSingle();

  if (checkError) throw checkError;

  if (!exists) {
    const { error } = await supabase.from("private_sessions").insert({
      coach_id: coach.id,
      player_id: player.id,
      session_type: session.session_type,
      price_cents: session.price_cents,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      payment_status: session.payment_status,
    });
    if (error) throw error;
  }
}

console.log("Seed complete.");
