"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cleanString, isEmail, rateLimit } from "@/lib/security";

export async function signIn(formData: FormData) {
  const email = cleanString(formData.get("email"), 180).toLowerCase();

  if (!rateLimit(`login:${email}`, 5, 60_000)) {
    redirect("/login?error=rate-limit");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/");
  }

  const password = cleanString(formData.get("password"), 200);

  if (!isEmail(email) || password.length < 8) {
    redirect("/login?error=validation");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=signin");
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = cleanString(formData.get("email"), 180).toLowerCase();

  if (!rateLimit(`signup:${email}`, 3, 60_000)) {
    redirect("/signup?error=rate-limit");
  }

  const supabase = await createClient();

  if (!supabase) {
    redirect("/");
  }

  const fullName = cleanString(formData.get("fullName"), 120);
  const password = cleanString(formData.get("password"), 200);
  const requestedRole = cleanString(formData.get("role"), 20);
  const role = ["coach", "parent_player"].includes(requestedRole)
    ? requestedRole
    : "parent_player";
  const phone = cleanString(formData.get("phone"), 40);
  const players = [1, 2, 3]
    .map((index) => {
      const suffix = index === 1 ? "" : String(index);
      const playerName = cleanString(formData.get(`playerName${suffix}`), 120);
      const playerAgeGroup = cleanString(
        formData.get(`playerAgeGroup${suffix}`),
        30,
      );
      const jerseyNumber = Number(
        cleanString(formData.get(`jerseyNumber${suffix}`), 4),
      );
      const playerNotes = cleanString(
        formData.get(`playerNotes${suffix}`),
        240,
      );

      return {
        jerseyNumber,
        playerAgeGroup,
        playerName,
        playerNotes,
      };
    })
    .filter((player) => player.playerName);

  if (!fullName || !isEmail(email) || password.length < 8) {
    redirect("/signup?error=validation");
  }

  if (role === "parent_player" && players.length === 0) {
    redirect("/signup?error=player");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    redirect("/signup?error=signup");
  }

  if (data.user) {
    const adminSupabase = createServiceClient();
    const client = adminSupabase ?? supabase;

    await client.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      phone,
      role,
    });

    if (role === "parent_player" && players.length > 0) {
      await client.from("players").insert(
        players.map((player) => {
          const notes = [
            player.playerAgeGroup
              ? `Requested age group: ${player.playerAgeGroup}`
              : "",
            player.playerNotes,
          ]
            .filter(Boolean)
            .join(" | ");

          return {
            user_id: data.user?.id,
            team_id: null,
            player_name: player.playerName,
            parent_name: fullName,
            phone,
            email,
            jersey_number:
              Number.isInteger(player.jerseyNumber) && player.jerseyNumber > 0
                ? player.jerseyNumber
                : null,
            active: false,
            notes: notes || "Parent signup - needs team assignment.",
          };
        }),
      );
    }
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
