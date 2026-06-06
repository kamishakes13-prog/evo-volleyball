"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  cleanMoneyToCents,
  cleanOptionalPositiveInteger,
  cleanPositiveInteger,
  cleanString,
  isEmail,
  rateLimit,
  requireRole,
} from "@/lib/security";

export async function createTeam(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`team-create:${user.email}`, 20, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const name = cleanString(formData.get("name"), 100);
  const ageGroup = cleanString(formData.get("ageGroup"), 20);
  const maxPlayers = cleanPositiveInteger(formData.get("maxPlayers"), 12);
  const monthlyDuesCents = cleanMoneyToCents(formData.get("monthlyDues"));
  const schedule = cleanString(formData.get("schedule"), 240);

  if (!name || !ageGroup) {
    return;
  }

  if (!supabase) {
    revalidatePath("/teams");
    return;
  }

  const { data } = await supabase
    .from("teams")
    .insert({
      name,
      age_group: ageGroup,
      max_player_count: maxPlayers,
      monthly_dues_cents: monthlyDuesCents,
      schedule,
    })
    .select("id")
    .single();

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "team.create",
    entity_type: "team",
    entity_id: data?.id,
    metadata: { name, ageGroup },
  });

  revalidatePath("/teams");
}

export async function updateTeam(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`team-update:${user.email}`, 40, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const teamId = cleanString(formData.get("teamId"), 80);
  const name = cleanString(formData.get("name"), 100);
  const ageGroup = cleanString(formData.get("ageGroup"), 20);
  const maxPlayers = cleanPositiveInteger(formData.get("maxPlayers"), 12);
  const monthlyDuesCents = cleanMoneyToCents(formData.get("monthlyDues"));
  const schedule = cleanString(formData.get("schedule"), 240);

  if (!teamId || !name || !ageGroup) {
    return;
  }

  if (!supabase) {
    revalidatePath("/teams");
    return;
  }

  await supabase
    .from("teams")
    .update({
      name,
      age_group: ageGroup,
      max_player_count: maxPlayers,
      monthly_dues_cents: monthlyDuesCents,
      schedule,
    })
    .eq("id", teamId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "team.update",
    entity_type: "team",
    entity_id: teamId,
    metadata: { name, ageGroup },
  });

  revalidatePath("/teams");
}

export async function deleteTeam(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`team-delete:${user.email}`, 20, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const teamId = cleanString(formData.get("teamId"), 80);

  if (!teamId) {
    return;
  }

  if (!supabase) {
    revalidatePath("/teams");
    return;
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id,name")
    .eq("id", teamId)
    .single();

  if (!team) {
    return;
  }

  await supabase.from("players").update({ team_id: null }).eq("team_id", teamId);
  await supabase.from("teams").delete().eq("id", teamId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "team.delete",
    entity_type: "team",
    entity_id: teamId,
    metadata: { name: team.name },
  });

  revalidatePath("/teams");
  revalidatePath("/players");
}

export async function createPlayer(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`player-create:${user.email}`, 20, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const playerName = cleanString(formData.get("playerName"), 120);
  const parentName = cleanString(formData.get("parentName"), 120);
  const phone = cleanString(formData.get("phone"), 40);
  const email = cleanString(formData.get("email"), 180).toLowerCase();
  const jerseyNumber = cleanOptionalPositiveInteger(
    formData.get("jerseyNumber"),
  );
  const teamId = cleanString(formData.get("teamId"), 80);
  const notes = cleanString(formData.get("notes"), 500);

  if (!playerName || !parentName || (email && !isEmail(email))) {
    return;
  }

  if (!supabase) {
    revalidatePath("/players");
    return;
  }

  const { data: team } = teamId
    ? await supabase.from("teams").select("id,name").eq("id", teamId).single()
    : { data: null };

  if (teamId && !team) {
    return;
  }

  const { data } = await supabase
    .from("players")
    .insert({
      player_name: playerName,
      parent_name: parentName,
      team_id: teamId || null,
      phone,
      email,
      jersey_number: jerseyNumber,
      notes,
    })
    .select("id")
    .single();

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "player.create",
    entity_type: "player",
    entity_id: data?.id,
    metadata: { playerName, parentName, teamId, teamName: team?.name },
  });

  revalidatePath("/players");
}

export async function updatePlayer(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`player-update:${user.email}`, 40, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const playerId = cleanString(formData.get("playerId"), 80);
  const playerName = cleanString(formData.get("playerName"), 120);
  const parentName = cleanString(formData.get("parentName"), 120);
  const phone = cleanString(formData.get("phone"), 40);
  const email = cleanString(formData.get("email"), 180).toLowerCase();
  const jerseyNumber = cleanOptionalPositiveInteger(
    formData.get("jerseyNumber"),
  );
  const teamId = cleanString(formData.get("teamId"), 80);
  const notes = cleanString(formData.get("notes"), 500);

  if (
    !playerId ||
    !playerName ||
    !parentName ||
    (email && !isEmail(email))
  ) {
    return;
  }

  if (!supabase) {
    revalidatePath("/players");
    return;
  }

  const { data: team } = teamId
    ? await supabase.from("teams").select("id,name").eq("id", teamId).single()
    : { data: null };

  if (teamId && !team) {
    return;
  }

  await supabase
    .from("players")
    .update({
      player_name: playerName,
      parent_name: parentName,
      team_id: teamId || null,
      phone,
      email,
      jersey_number: jerseyNumber,
      notes,
    })
    .eq("id", playerId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "player.update",
    entity_type: "player",
    entity_id: playerId,
    metadata: { playerName, parentName, teamId, teamName: team?.name },
  });

  revalidatePath("/players");
}

export async function deletePlayer(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`player-delete:${user.email}`, 20, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const playerId = cleanString(formData.get("playerId"), 80);

  if (!playerId) {
    return;
  }

  if (!supabase) {
    revalidatePath("/players");
    return;
  }

  const { data: player } = await supabase
    .from("players")
    .select("id,player_name,parent_name")
    .eq("id", playerId)
    .single();

  if (!player) {
    return;
  }

  await supabase.from("players").delete().eq("id", playerId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "player.delete",
    entity_type: "player",
    entity_id: playerId,
    metadata: {
      playerName: player.player_name,
      parentName: player.parent_name,
    },
  });

  revalidatePath("/players");
  revalidatePath("/payments");
  revalidatePath("/private-sessions");
}

export async function approvePlayer(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`player-approve:${user.email}`, 40, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const playerId = cleanString(formData.get("playerId"), 80);

  if (!playerId) {
    return;
  }

  if (!supabase) {
    revalidatePath("/players");
    return;
  }

  const { data: player } = await supabase
    .from("players")
    .select("id,player_name,team_id")
    .eq("id", playerId)
    .single();

  if (!player?.team_id) {
    return;
  }

  await supabase
    .from("players")
    .update({ active: true })
    .eq("id", playerId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "player.approve",
    entity_type: "player",
    entity_id: playerId,
    metadata: {
      playerName: player.player_name,
      teamId: player.team_id,
    },
  });

  revalidatePath("/players");
  revalidatePath("/portal");
}

export async function linkParentToPlayer(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`parent-link:${user.email}`, 40, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const playerId = cleanString(formData.get("playerId"), 80);
  const profileId = cleanString(formData.get("profileId"), 80);

  if (!playerId) {
    return;
  }

  if (!supabase) {
    revalidatePath("/players");
    return;
  }

  const { data: player } = await supabase
    .from("players")
    .select("id,player_name")
    .eq("id", playerId)
    .single();

  if (!player) {
    return;
  }

  if (profileId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,full_name,role")
      .eq("id", profileId)
      .eq("role", "parent_player")
      .single();

    if (!profile) {
      return;
    }

    await supabase
      .from("players")
      .update({ user_id: profileId })
      .eq("id", playerId);

    await supabase.from("audit_logs").insert({
      actor_email: user.email,
      action: "player.link_parent",
      entity_type: "player",
      entity_id: playerId,
      metadata: {
        playerName: player.player_name,
        profileId,
        parentName: profile.full_name,
      },
    });
  } else {
    await supabase.from("players").update({ user_id: null }).eq("id", playerId);

    await supabase.from("audit_logs").insert({
      actor_email: user.email,
      action: "player.unlink_parent",
      entity_type: "player",
      entity_id: playerId,
      metadata: { playerName: player.player_name },
    });
  }

  revalidatePath("/players");
  revalidatePath("/portal");
}

export async function markInvoicePaid(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`invoice-action:${user.email}`, 30, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const invoiceId = cleanString(formData.get("invoiceId"), 80);
  const amountCents = cleanMoneyToCents(formData.get("amount"));
  const method = cleanString(formData.get("method"), 20);
  const allowedMethods = ["cash", "zelle", "venmo", "cash_app", "card", "other"];

  if (!invoiceId || amountCents <= 0 || !allowedMethods.includes(method)) {
    return;
  }

  if (!supabase) {
    revalidatePath("/payments");
    return;
  }

  await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount_cents: amountCents,
    method,
  });

  await supabase
    .from("invoices")
    .update({ status: "paid", paid_cents: amountCents })
    .eq("id", invoiceId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "invoice.mark_paid",
    entity_type: "invoice",
    entity_id: invoiceId,
    metadata: { amountCents, method },
  });

  revalidatePath("/payments");
}

export async function createInvoice(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`invoice-create:${user.email}`, 30, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const playerId = cleanString(formData.get("playerId"), 80);
  const title = cleanString(formData.get("title"), 120);
  const category = cleanString(formData.get("category"), 40);
  const amountCents = cleanMoneyToCents(formData.get("amount"));
  const dueDate = cleanString(formData.get("dueDate"), 20);
  const allowedCategories = [
    "monthly_dues",
    "tournament_fee",
    "uniform",
    "camp",
    "private_session",
    "custom",
  ];

  if (
    !playerId ||
    !title ||
    amountCents <= 0 ||
    !allowedCategories.includes(category)
  ) {
    return;
  }

  if (!supabase) {
    revalidatePath("/payments");
    return;
  }

  const { data: player } = await supabase
    .from("players")
    .select("id,player_name")
    .eq("id", playerId)
    .single();

  if (!player) {
    return;
  }

  const { data } = await supabase
    .from("invoices")
    .insert({
      player_id: playerId,
      title,
      category,
      amount_cents: amountCents,
      paid_cents: 0,
      due_date: dueDate || null,
      status: "unpaid",
    })
    .select("id")
    .single();

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "invoice.create",
    entity_type: "invoice",
    entity_id: data?.id,
    metadata: { playerId, playerName: player.player_name, title, amountCents },
  });

  revalidatePath("/payments");
}

export async function updateInvoice(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`invoice-update:${user.email}`, 40, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const invoiceId = cleanString(formData.get("invoiceId"), 80);
  const title = cleanString(formData.get("title"), 120);
  const category = cleanString(formData.get("category"), 40);
  const amountCents = cleanMoneyToCents(formData.get("amount"));
  const dueDate = cleanString(formData.get("dueDate"), 20);
  const status = cleanString(formData.get("status"), 20);
  const allowedCategories = [
    "monthly_dues",
    "tournament_fee",
    "uniform",
    "camp",
    "private_session",
    "custom",
  ];
  const allowedStatuses = ["unpaid", "paid", "partial", "overdue", "waived"];

  if (
    !invoiceId ||
    !title ||
    amountCents < 0 ||
    !allowedCategories.includes(category) ||
    !allowedStatuses.includes(status)
  ) {
    return;
  }

  if (!supabase) {
    revalidatePath("/payments");
    return;
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id,paid_cents")
    .eq("id", invoiceId)
    .single();

  if (!invoice || Number(invoice.paid_cents) > amountCents) {
    return;
  }

  await supabase
    .from("invoices")
    .update({
      title,
      category,
      amount_cents: amountCents,
      due_date: dueDate || null,
      status,
    })
    .eq("id", invoiceId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "invoice.update",
    entity_type: "invoice",
    entity_id: invoiceId,
    metadata: { title, category, amountCents, status },
  });

  revalidatePath("/payments");
  revalidatePath("/");
}

export async function waiveInvoice(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`invoice-waive:${user.email}`, 20, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const invoiceId = cleanString(formData.get("invoiceId"), 80);

  if (!invoiceId) {
    return;
  }

  if (!supabase) {
    revalidatePath("/payments");
    return;
  }

  await supabase
    .from("invoices")
    .update({ status: "waived", paid_cents: 0 })
    .eq("id", invoiceId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "invoice.waive",
    entity_type: "invoice",
    entity_id: invoiceId,
    metadata: {},
  });

  revalidatePath("/payments");
  revalidatePath("/");
}

export async function deleteInvoice(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`invoice-delete:${user.email}`, 20, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const invoiceId = cleanString(formData.get("invoiceId"), 80);

  if (!invoiceId) {
    return;
  }

  if (!supabase) {
    revalidatePath("/payments");
    return;
  }

  await supabase.from("invoices").delete().eq("id", invoiceId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "invoice.delete",
    entity_type: "invoice",
    entity_id: invoiceId,
    metadata: {},
  });

  revalidatePath("/payments");
  revalidatePath("/");
}

export async function recordPayment(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`payment-record:${user.email}`, 30, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const invoiceId = cleanString(formData.get("invoiceId"), 80);
  const amountCents = cleanMoneyToCents(formData.get("amount"));
  const method = cleanString(formData.get("method"), 20);
  const allowedMethods = ["cash", "zelle", "venmo", "cash_app", "card", "other"];

  if (!invoiceId || amountCents <= 0 || !allowedMethods.includes(method)) {
    return;
  }

  if (!supabase) {
    revalidatePath("/payments");
    return;
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id,amount_cents,paid_cents,status")
    .eq("id", invoiceId)
    .single();

  if (!invoice || invoice.status === "waived") {
    return;
  }

  const nextPaidCents = Math.min(
    Number(invoice.paid_cents) + amountCents,
    Number(invoice.amount_cents),
  );
  const nextStatus =
    nextPaidCents >= Number(invoice.amount_cents) ? "paid" : "partial";

  await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount_cents: amountCents,
    method,
  });

  await supabase
    .from("invoices")
    .update({ status: nextStatus, paid_cents: nextPaidCents })
    .eq("id", invoiceId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "payment.record",
    entity_type: "invoice",
    entity_id: invoiceId,
    metadata: { amountCents, method, status: nextStatus },
  });

  revalidatePath("/payments");
  revalidatePath("/");
}

export async function createPrivateSession(formData: FormData) {
  const user = await requireRole(["admin"]);

  if (!rateLimit(`session-create:${user.email}`, 30, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const coachId = cleanString(formData.get("coachId"), 80);
  const playerId = cleanString(formData.get("playerId"), 80);
  const sessionType = cleanString(formData.get("sessionType"), 40);
  const startsAtValue = cleanString(formData.get("startsAt"), 40);
  const priceCents = cleanMoneyToCents(formData.get("price"));
  const allowedTypes = ["one_on_one", "small_group", "skills_training"];

  if (
    !coachId ||
    !playerId ||
    !startsAtValue ||
    priceCents <= 0 ||
    !allowedTypes.includes(sessionType)
  ) {
    return;
  }

  const startsAt = new Date(startsAtValue);
  if (Number.isNaN(startsAt.getTime())) {
    return;
  }

  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  if (!supabase) {
    revalidatePath("/private-sessions");
    return;
  }

  const [{ data: coach }, { data: player }] = await Promise.all([
    supabase.from("coaches").select("id,name").eq("id", coachId).single(),
    supabase.from("players").select("id,player_name").eq("id", playerId).single(),
  ]);

  if (!coach || !player) {
    return;
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      player_id: playerId,
      title: "Private Session",
      category: "private_session",
      amount_cents: priceCents,
      paid_cents: 0,
      due_date: startsAt.toISOString().slice(0, 10),
      status: "unpaid",
    })
    .select("id")
    .single();

  if (!invoice) {
    return;
  }

  const { data: session, error } = await supabase
    .from("private_sessions")
    .insert({
      coach_id: coachId,
      player_id: playerId,
      invoice_id: invoice.id,
      session_type: sessionType,
      price_cents: priceCents,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      payment_status: "unpaid",
    })
    .select("id")
    .single();

  if (error) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return;
  }

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "private_session.create",
    entity_type: "private_session",
    entity_id: session?.id,
    metadata: {
      coachId,
      coachName: coach.name,
      playerId,
      playerName: player.player_name,
      invoiceId: invoice.id,
      priceCents,
    },
  });

  revalidatePath("/private-sessions");
  revalidatePath("/payments");
}

export async function createCoachAvailability(formData: FormData) {
  const user = await requireRole(["admin", "coach"]);

  if (!rateLimit(`availability-create:${user.email}`, 40, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const coachId = cleanString(formData.get("coachId"), 80);
  const startsAtValue = cleanString(formData.get("startsAt"), 40);
  const priceCents = cleanMoneyToCents(formData.get("price"));

  if (!coachId || !startsAtValue || priceCents < 0) {
    return;
  }

  const startsAt = new Date(startsAtValue);
  if (Number.isNaN(startsAt.getTime())) {
    return;
  }

  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  if (!supabase) {
    revalidatePath("/calendar");
    return;
  }

  const { data: coach } = await supabase
    .from("coaches")
    .select("id,name")
    .eq("id", coachId)
    .single();

  if (!coach) {
    return;
  }

  const { data, error } = await supabase
    .from("coach_availability")
    .insert({
      coach_id: coachId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      price_cents: priceCents,
      is_booked: false,
    })
    .select("id")
    .single();

  if (error) {
    return;
  }

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "availability.create",
    entity_type: "coach_availability",
    entity_id: data?.id,
    metadata: { coachId, coachName: coach.name, priceCents },
  });

  revalidatePath("/calendar");
}

export async function deleteCoachAvailability(formData: FormData) {
  const user = await requireRole(["admin", "coach"]);

  if (!rateLimit(`availability-delete:${user.email}`, 30, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const availabilityId = cleanString(formData.get("availabilityId"), 80);

  if (!availabilityId) {
    return;
  }

  if (!supabase) {
    revalidatePath("/calendar");
    return;
  }

  const { data: slot } = await supabase
    .from("coach_availability")
    .select("id,coach_id")
    .eq("id", availabilityId)
    .single();

  if (!slot) {
    return;
  }

  await supabase.from("coach_availability").delete().eq("id", availabilityId);

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "availability.delete",
    entity_type: "coach_availability",
    entity_id: availabilityId,
    metadata: { coachId: slot.coach_id },
  });

  revalidatePath("/calendar");
}

export async function recordAttendance(formData: FormData) {
  const user = await requireRole(["admin", "coach"]);

  if (!rateLimit(`attendance-record:${user.email}`, 80, 60_000)) {
    return;
  }

  const supabase = await createClient();
  const playerId = cleanString(formData.get("playerId"), 80);
  const status = cleanString(formData.get("status"), 20);
  const notes = cleanString(formData.get("notes"), 240);
  const allowedStatuses = ["present", "absent", "late", "excused"];

  if (!playerId || !allowedStatuses.includes(status)) {
    return;
  }

  if (!supabase) {
    revalidatePath("/attendance");
    return;
  }

  const { data: player } = await supabase
    .from("players")
    .select("id,player_name,team_id")
    .eq("id", playerId)
    .single();

  if (!player?.team_id) {
    return;
  }

  const { data } = await supabase
    .from("attendance")
    .insert({
      player_id: playerId,
      team_id: player.team_id,
      status,
      notes,
    })
    .select("id")
    .single();

  await supabase.from("audit_logs").insert({
    actor_email: user.email,
    action: "attendance.record",
    entity_type: "attendance",
    entity_id: data?.id,
    metadata: {
      playerId,
      playerName: player.player_name,
      teamId: player.team_id,
      status,
    },
  });

  revalidatePath("/attendance");
  revalidatePath("/players");
}
