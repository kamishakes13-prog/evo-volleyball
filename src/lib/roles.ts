export type AppRole = "admin" | "coach" | "parent";

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  coach: "Coach",
  parent: "Parent/Player",
};

export const navigation = [
  { label: "Home", href: "/", roles: ["admin"] },
  { label: "Portal", href: "/portal", roles: ["parent"] },
  { label: "Teams", href: "/teams", roles: ["admin", "coach", "parent"] },
  { label: "Players", href: "/players", roles: ["admin", "coach"] },
  { label: "Attendance", href: "/attendance", roles: ["admin", "coach"] },
  { label: "Payments", href: "/payments", roles: ["admin", "parent"] },
  { label: "Calendar", href: "/calendar", roles: ["admin", "coach", "parent"] },
  {
    label: "Private Sessions",
    href: "/private-sessions",
    roles: ["admin", "coach", "parent"],
  },
  { label: "Settings", href: "/settings", roles: ["admin"] },
  { label: "Sign In", href: "/login", roles: ["admin", "coach", "parent"] },
] satisfies Array<{
  label: string;
  href: string;
  roles: AppRole[];
}>;

export function navForRole(role: AppRole) {
  return navigation.filter((item) => item.roles.includes(role));
}
