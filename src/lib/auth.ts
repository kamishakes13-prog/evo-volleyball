import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/roles";

export type SessionUser = {
  email: string;
  name: string;
  role: AppRole;
  isDemo: boolean;
  isAuthenticated: boolean;
};

function toAppRole(role: string | null | undefined): AppRole {
  if (role === "coach") {
    return "coach";
  }

  if (role === "parent_player") {
    return "parent";
  }

  return "admin";
}

export async function getSessionUser(): Promise<SessionUser> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      email: "demo@evovolleyball.com",
      name: "EVO Admin",
      role: "admin",
      isDemo: true,
      isAuthenticated: true,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      email: "guest@evovolleyball.com",
      name: "Guest",
      role: "parent",
      isDemo: false,
      isAuthenticated: false,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return {
    email: user.email ?? "user@evovolleyball.com",
    name: profile?.full_name ?? user.email ?? "EVO User",
    role: toAppRole(profile?.role),
    isDemo: false,
    isAuthenticated: true,
  };
}
