import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import type { AppRole } from "@/lib/roles";

const buckets = new Map<string, { count: number; resetAt: number }>();

export async function requireRole(roles: AppRole[]) {
  const user = await getSessionUser();

  if (user.isDemo) {
    return user;
  }

  if (!user.isAuthenticated) {
    redirect("/login");
  }

  if (!roles.includes(user.role)) {
    redirect("/calendar");
  }

  return user;
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

export function cleanString(value: FormDataEntryValue | null, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

export function cleanMoneyToCents(value: FormDataEntryValue | null) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

export function cleanPositiveInteger(
  value: FormDataEntryValue | null,
  fallback: number,
) {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
