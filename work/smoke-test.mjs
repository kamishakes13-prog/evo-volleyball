import { config } from "dotenv";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = "http://localhost:3000";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const stamp = Date.now();
const email = `evo-smoke-${stamp}@example.com`;
const password = `SmokeTest-${stamp}!`;
const parentEmail = `evo-smoke-parent-${stamp}@example.com`;
const parentPassword = `SmokeParent-${stamp}!`;
const teamName = `Smoke Test Team ${stamp}`;
const updatedTeamName = `${teamName} Updated`;
const playerName = `Smoke Test Player ${stamp}`;
const updatedPlayerName = `${playerName} Updated`;
const invoiceTitle = `Smoke Test Invoice ${stamp}`;
const updatedInvoiceTitle = `${invoiceTitle} Updated`;
const sessionStart = "2026-07-15T17:00";
const availabilityStart = "2026-07-16T17:00";

if (!url || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

let userId;
let parentUserId;
let browser;

async function cleanup() {
  await supabase.from("audit_logs").delete().eq("actor_email", email);

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("player_name", playerName)
    .maybeSingle();

  if (player) {
    const { data: sessions } = await supabase
      .from("private_sessions")
      .select("id")
      .eq("player_id", player.id);
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .eq("player_id", player.id);

    for (const session of sessions ?? []) {
      await supabase.from("audit_logs").delete().eq("entity_id", session.id);
    }

    for (const invoice of invoices ?? []) {
      await supabase.from("audit_logs").delete().eq("entity_id", invoice.id);
    }

    await supabase.from("private_sessions").delete().eq("player_id", player.id);
    await supabase.from("attendance").delete().eq("player_id", player.id);
    await supabase.from("invoices").delete().eq("player_id", player.id);
  }

  const { data: smokeSlots } = await supabase
    .from("coach_availability")
    .select("id")
    .gte("starts_at", "2026-07-16T00:00:00.000Z")
    .lte("starts_at", "2026-07-17T00:00:00.000Z");

  for (const slot of smokeSlots ?? []) {
    await supabase.from("audit_logs").delete().eq("entity_id", slot.id);
    await supabase.from("coach_availability").delete().eq("id", slot.id);
  }

  await supabase.from("audit_logs").delete().eq("metadata->>title", invoiceTitle);
  await supabase.from("audit_logs").delete().eq("metadata->>title", updatedInvoiceTitle);
  await supabase.from("audit_logs").delete().eq("metadata->>playerName", playerName);
  await supabase.from("audit_logs").delete().eq("metadata->>playerName", updatedPlayerName);
  await supabase.from("audit_logs").delete().eq("entity_type", "player").eq("metadata->>playerName", playerName);
  await supabase.from("audit_logs").delete().eq("entity_type", "team").eq("metadata->>name", teamName);
  await supabase.from("audit_logs").delete().eq("entity_type", "team").eq("metadata->>name", updatedTeamName);
  await supabase.from("players").delete().eq("player_name", playerName);
  await supabase.from("players").delete().eq("player_name", updatedPlayerName);
  await supabase.from("teams").delete().eq("name", teamName);
  await supabase.from("teams").delete().eq("name", updatedTeamName);

  if (userId) {
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
  }

  if (parentUserId) {
    await supabase.from("parent_consents").delete().eq("profile_id", parentUserId);
    await supabase.from("profiles").delete().eq("id", parentUserId);
    await supabase.auth.admin.deleteUser(parentUserId);
  }

  if (browser) {
    await browser.close();
  }
}

try {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "EVO Smoke Admin",
      role: "admin",
    },
  });

  if (createError) throw createError;
  userId = created.user.id;

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: "EVO Smoke Admin",
    role: "admin",
  });

  if (profileError) throw profileError;

  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });

  await page.goto(`${appUrl}/login`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("parent@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(`${appUrl}/`, { timeout: 15000 });
  await page.getByRole("heading", { name: /EVO club operations/i }).waitFor();

  const routes = [
    "/teams",
    "/players",
    "/attendance",
    "/payments",
    "/calendar",
    "/private-sessions",
    "/settings",
  ];

  for (const route of routes) {
    await page.goto(`${appUrl}${route}`, { waitUntil: "networkidle" });
    if (!(await page.locator("body").innerText()).includes("EVO Volleyball")) {
      throw new Error(`Route did not render shell: ${route}`);
    }
  }

  await page.goto(`${appUrl}/teams`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Team name").fill(teamName);
  await page.getByPlaceholder("Age group").fill("12U");
  await page.getByPlaceholder("Max players").fill("10");
  await page.getByPlaceholder("Monthly dues").fill("199");
  await page.getByPlaceholder("Schedule").fill("Fri 5:00 PM");
  await page.getByRole("button", { name: "Add Team" }).click();
  await page.waitForTimeout(1500);

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id,name")
    .eq("name", teamName)
    .maybeSingle();

  if (teamError) throw teamError;
  if (!team) throw new Error("Team create smoke test failed");

  const { data: audit, error: auditError } = await supabase
    .from("audit_logs")
    .select("action")
    .eq("entity_type", "team")
    .eq("entity_id", team.id)
    .maybeSingle();

  if (auditError) throw auditError;
  if (audit?.action !== "team.create") {
    throw new Error("Audit log smoke test failed");
  }

  await page.goto(`${appUrl}/teams`, { waitUntil: "networkidle" });
  const teamCard = page
    .locator("article")
    .filter({ hasText: teamName })
    .first();
  await teamCard.locator('input[name="name"]').fill(updatedTeamName);
  await teamCard.getByRole("button", { name: "Save Team" }).click();
  await page.waitForTimeout(1200);

  const { data: updatedTeam, error: updatedTeamError } = await supabase
    .from("teams")
    .select("id,name")
    .eq("id", team.id)
    .single();

  if (updatedTeamError) throw updatedTeamError;
  if (updatedTeam.name !== updatedTeamName) {
    throw new Error("Team update smoke test failed");
  }

  await page.goto(`${appUrl}/players`, { waitUntil: "networkidle" });
  const createPlayerForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Add Player" }) })
    .first();
  await createPlayerForm.getByPlaceholder("Player name").fill(playerName);
  await createPlayerForm.getByPlaceholder("Parent name").fill("Smoke Parent");
  await createPlayerForm.getByPlaceholder("Jersey #").fill("99");
  await createPlayerForm.locator('select[name="teamId"]').selectOption(team.id);
  await createPlayerForm.getByPlaceholder("Phone").fill("(214) 555-0199");
  await createPlayerForm.getByPlaceholder("Email").fill("smoke-parent@example.com");
  await createPlayerForm.getByPlaceholder("Notes").fill("Smoke player create test");
  await createPlayerForm.getByRole("button", { name: "Add Player" }).click();
  await page.waitForTimeout(1500);

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id,team_id")
    .eq("player_name", playerName)
    .maybeSingle();

  if (playerError) throw playerError;
  if (!player || player.team_id !== team.id) {
    throw new Error("Player team assignment smoke test failed");
  }

  const { data: playerAudit, error: playerAuditError } = await supabase
    .from("audit_logs")
    .select("action")
    .eq("entity_type", "player")
    .eq("entity_id", player.id)
    .maybeSingle();

  if (playerAuditError) throw playerAuditError;
  if (playerAudit?.action !== "player.create") {
    throw new Error("Player audit log smoke test failed");
  }

  await page.goto(`${appUrl}/players`, { waitUntil: "networkidle" });
  const playerCard = page
    .locator("article")
    .filter({ hasText: playerName })
    .first();
  await playerCard.locator('input[name="playerName"]').fill(updatedPlayerName);
  await playerCard.getByRole("button", { name: "Save Player" }).click();
  await page.waitForTimeout(1200);

  const { data: updatedPlayer, error: updatedPlayerError } = await supabase
    .from("players")
    .select("id,player_name")
    .eq("id", player.id)
    .single();

  if (updatedPlayerError) throw updatedPlayerError;
  if (updatedPlayer.player_name !== updatedPlayerName) {
    throw new Error("Player update smoke test failed");
  }

  await page.goto(`${appUrl}/payments`, { waitUntil: "networkidle" });
  const createInvoiceForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Add Invoice" }) })
    .first();
  await createInvoiceForm.locator('select[name="playerId"]').selectOption(player.id);
  await createInvoiceForm.locator('select[name="category"]').selectOption("custom");
  await createInvoiceForm.getByPlaceholder("Invoice title").fill(invoiceTitle);
  await createInvoiceForm.getByPlaceholder("Amount").fill("50");
  await createInvoiceForm.locator('input[name="dueDate"]').fill("2026-07-20");
  await createInvoiceForm.getByRole("button", { name: "Add Invoice" }).click();
  await page.waitForTimeout(1500);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id,amount_cents,paid_cents,status")
    .eq("player_id", player.id)
    .eq("title", invoiceTitle)
    .maybeSingle();

  if (invoiceError) throw invoiceError;
  if (!invoice || invoice.amount_cents !== 5000 || invoice.status !== "unpaid") {
    throw new Error("Invoice create smoke test failed");
  }

  await page.goto(`${appUrl}/payments`, { waitUntil: "networkidle" });
  const invoiceEditForm = page
    .locator(`form:has(input[name="invoiceId"][value="${invoice.id}"])`)
    .filter({ has: page.getByRole("button", { name: "Save" }) })
    .first();
  await invoiceEditForm.locator('input[name="title"]').fill(updatedInvoiceTitle);
  await invoiceEditForm.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(1200);

  const { data: updatedInvoice, error: updatedInvoiceError } = await supabase
    .from("invoices")
    .select("id,title")
    .eq("id", invoice.id)
    .single();

  if (updatedInvoiceError) throw updatedInvoiceError;
  if (updatedInvoice.title !== updatedInvoiceTitle) {
    throw new Error("Invoice update smoke test failed");
  }

  await page.goto(`${appUrl}/payments`, { waitUntil: "networkidle" });
  const recordPaymentForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Record Payment" }) })
    .first();
  await recordPaymentForm.locator('select[name="invoiceId"]').selectOption(invoice.id);
  await recordPaymentForm.getByPlaceholder("Amount").fill("25");
  await recordPaymentForm.locator('select[name="method"]').selectOption("cash");
  await recordPaymentForm.getByRole("button", { name: "Record Payment" }).click();
  await page.waitForTimeout(1500);

  const { data: paidInvoice, error: paidInvoiceError } = await supabase
    .from("invoices")
    .select("paid_cents,status")
    .eq("id", invoice.id)
    .single();

  if (paidInvoiceError) throw paidInvoiceError;
  if (paidInvoice.paid_cents !== 2500 || paidInvoice.status !== "partial") {
    throw new Error("Payment record smoke test failed");
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id,amount_cents,method")
    .eq("invoice_id", invoice.id)
    .maybeSingle();

  if (paymentError) throw paymentError;
  if (!payment || payment.amount_cents !== 2500 || payment.method !== "cash") {
    throw new Error("Payment metadata smoke test failed");
  }

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .order("name")
    .limit(1)
    .single();

  if (coachError) throw coachError;

  await page.goto(`${appUrl}/private-sessions`, { waitUntil: "networkidle" });
  await page.locator('select[name="coachId"]').selectOption(coach.id);
  await page.locator('select[name="playerId"]').selectOption(player.id);
  await page.locator('select[name="sessionType"]').selectOption("skills_training");
  await page.locator('input[name="startsAt"]').fill(sessionStart);
  await page.getByPlaceholder("Price").fill("75");
  await page.getByRole("button", { name: "Book Session" }).click();
  await page.waitForTimeout(1500);

  const { data: session, error: sessionError } = await supabase
    .from("private_sessions")
    .select("id,invoice_id,price_cents,payment_status")
    .eq("player_id", player.id)
    .eq("coach_id", coach.id)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session || session.price_cents !== 7500 || session.payment_status !== "unpaid") {
    throw new Error("Private session smoke test failed");
  }

  const { data: sessionInvoice, error: sessionInvoiceError } = await supabase
    .from("invoices")
    .select("id,category,amount_cents")
    .eq("id", session.invoice_id)
    .single();

  if (sessionInvoiceError) throw sessionInvoiceError;
  if (
    sessionInvoice.category !== "private_session" ||
    sessionInvoice.amount_cents !== 7500
  ) {
    throw new Error("Private session invoice smoke test failed");
  }

  await page.goto(`${appUrl}/calendar`, { waitUntil: "networkidle" });
  const availabilityForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Add Slot" }) })
    .first();
  await availabilityForm.locator('select[name="coachId"]').selectOption(coach.id);
  await availabilityForm.locator('input[name="startsAt"]').fill(availabilityStart);
  await availabilityForm.getByPlaceholder("Price").fill("40");
  await availabilityForm.getByRole("button", { name: "Add Slot" }).click();
  await page.waitForTimeout(1200);

  const { data: availability, error: availabilityError } = await supabase
    .from("coach_availability")
    .select("id,price_cents")
    .eq("coach_id", coach.id)
    .gte("starts_at", "2026-07-16T00:00:00.000Z")
    .lte("starts_at", "2026-07-17T00:00:00.000Z")
    .maybeSingle();

  if (availabilityError) throw availabilityError;
  if (!availability || availability.price_cents !== 4000) {
    throw new Error("Availability create smoke test failed");
  }

  await page.goto(`${appUrl}/attendance`, { waitUntil: "networkidle" });
  const attendanceForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Record" }) })
    .first();
  await attendanceForm.locator('select[name="playerId"]').selectOption(player.id);
  await attendanceForm.locator('select[name="status"]').selectOption("present");
  await attendanceForm.getByPlaceholder("Notes").fill("Smoke attendance test");
  await attendanceForm.getByRole("button", { name: "Record" }).click();
  await page.waitForTimeout(1200);

  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("id,status")
    .eq("player_id", player.id)
    .maybeSingle();

  if (attendanceError) throw attendanceError;
  if (!attendance || attendance.status !== "present") {
    throw new Error("Attendance record smoke test failed");
  }

  const { data: parentUser, error: parentCreateError } =
    await supabase.auth.admin.createUser({
      email: parentEmail,
      password: parentPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "EVO Smoke Parent",
        role: "parent_player",
      },
    });

  if (parentCreateError) throw parentCreateError;
  parentUserId = parentUser.user.id;

  const { error: parentProfileError } = await supabase.from("profiles").upsert({
    id: parentUserId,
    full_name: "EVO Smoke Parent",
    role: "parent_player",
  });

  if (parentProfileError) throw parentProfileError;

  await page.goto(`${appUrl}/players`, { waitUntil: "networkidle" });
  const linkPlayerCard = page
    .locator("article")
    .filter({ hasText: updatedPlayerName })
    .first();
  const linkParentForm = linkPlayerCard
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Link Parent" }) })
    .first();
  await linkParentForm.locator('select[name="profileId"]').selectOption(parentUserId);
  await linkParentForm.getByRole("button", { name: "Link Parent" }).click();
  await page.waitForTimeout(1200);

  const { data: linkedPlayer, error: linkedPlayerError } = await supabase
    .from("players")
    .select("user_id")
    .eq("id", player.id)
    .single();

  if (linkedPlayerError) throw linkedPlayerError;
  if (linkedPlayer.user_id !== parentUserId) {
    throw new Error("Parent link smoke test failed");
  }

  const parentContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const parentPage = await parentContext.newPage();
  await parentPage.goto(`${appUrl}/login`, { waitUntil: "networkidle" });
  await parentPage.getByPlaceholder("parent@example.com").fill(parentEmail);
  await parentPage.getByPlaceholder("••••••••").fill(parentPassword);
  await parentPage.getByRole("button", { name: "Sign In" }).click();
  await parentPage.waitForURL(`${appUrl}/`, { timeout: 15000 }).catch(async () => {
    await parentPage.goto(`${appUrl}/portal`, { waitUntil: "networkidle" });
  });
  await parentPage.goto(`${appUrl}/portal`, { waitUntil: "networkidle" });
  await parentPage.getByText(updatedPlayerName).waitFor();
  await parentPage.goto(`${appUrl}/consent`, { waitUntil: "networkidle" });
  await parentPage.locator('input[type="checkbox"]').nth(0).check();
  await parentPage.locator('input[type="checkbox"]').nth(1).check();
  await parentPage.getByRole("button", { name: "Save Consent" }).click();
  await parentPage.waitForURL(`${appUrl}/portal`, { timeout: 15000 });

  const { data: consent, error: consentError } = await supabase
    .from("parent_consents")
    .select("id")
    .eq("profile_id", parentUserId)
    .maybeSingle();

  await parentContext.close();

  if (consentError) throw consentError;
  if (!consent) {
    throw new Error("Parent consent smoke test failed");
  }

  console.log("smoke=ok");
  console.log("login=ok");
  console.log("protected_routes=ok");
  console.log("team_create=ok");
  console.log("team_update=ok");
  console.log("player_create=ok");
  console.log("player_update=ok");
  console.log("player_team_assignment=ok");
  console.log("invoice_create=ok");
  console.log("invoice_update=ok");
  console.log("payment_record=ok");
  console.log("private_session_create=ok");
  console.log("private_session_invoice=ok");
  console.log("availability_create=ok");
  console.log("attendance_record=ok");
  console.log("parent_portal=ok");
  console.log("parent_link=ok");
  console.log("parent_consent=ok");
  console.log("audit_log=ok");
} finally {
  await cleanup();
}
