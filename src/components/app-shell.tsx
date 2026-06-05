import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { navForRole, roleLabels } from "@/lib/roles";
import { SignOutButton } from "./sign-out-button";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const navItems = navForRole(user.role);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-blue-800 text-lg font-black text-white">
              EV
            </div>
            <div>
              <p className="text-lg font-black leading-tight text-blue-900">
                EVO Volleyball
              </p>
              <p className="text-xs font-bold uppercase text-slate-500">
                {roleLabels[user.role]} portal
              </p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-800"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-right text-xs font-bold text-slate-500 sm:block">
              {user.name}
            </span>
            <span className="rounded-full bg-lime-300 px-3 py-1.5 text-xs font-black text-blue-950">
              {user.isDemo ? "Demo" : "Live"}
            </span>
            <SignOutButton isDemo={user.isDemo} />
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-black uppercase text-blue-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <footer className="border-t border-blue-100 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4 text-xs font-bold text-slate-500 sm:px-2">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/consent">Parent Consent</Link>
        </div>
      </footer>
    </main>
  );
}
