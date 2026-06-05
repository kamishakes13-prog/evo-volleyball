"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/security";

export async function saveConsent() {
  await requireRole(["parent"]);
  const supabase = await createClient();

  if (!supabase) {
    redirect("/portal");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date().toISOString();

  await supabase.from("parent_consents").insert({
    profile_id: user.id,
    terms_accepted_at: now,
    privacy_accepted_at: now,
    data_consent_at: now,
  });

  redirect("/portal");
}
