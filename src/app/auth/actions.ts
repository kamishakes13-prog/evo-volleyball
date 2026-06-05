"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  if (!fullName || !isEmail(email) || password.length < 8) {
    redirect("/signup?error=validation");
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
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      role,
    });
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
