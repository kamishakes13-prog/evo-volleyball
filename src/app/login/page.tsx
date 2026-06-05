import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { PageHeader, PageWrap } from "@/components/ui";

const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginPage() {
  return (
    <PageWrap>
      <div className="mx-auto max-w-md">
        <PageHeader
          kicker="Sign in"
          title="Access your EVO portal"
          description="Supabase auth is wired for the live app. Add environment variables to enable real sign in."
        />
        <form
          action={signIn}
          className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
        >
          {!hasSupabaseEnv ? (
            <div className="mb-4 rounded-md bg-lime-50 p-3 text-sm font-bold text-blue-950">
              Demo mode is active. Add Supabase keys in `.env.local` to turn on
              authentication.
            </div>
          ) : null}
          <label className="block text-sm font-black text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
              name="email"
              type="email"
              placeholder="parent@example.com"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-black text-slate-700">
            Password
            <input
              className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
              name="password"
              type="password"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </label>
          <button
            className="mt-5 w-full rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
            type="submit"
          >
            Sign In
          </button>
          <p className="mt-4 text-center text-sm text-slate-600">
            Need an account?{" "}
            <Link className="font-black text-blue-800" href="/signup">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </PageWrap>
  );
}
