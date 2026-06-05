import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { PageHeader, PageWrap } from "@/components/ui";

export default function SignupPage() {
  return (
    <PageWrap>
      <div className="mx-auto max-w-md">
        <PageHeader
          kicker="Create account"
          title="Join the EVO portal"
          description="A first-pass signup screen for parents, players, coaches, and admins."
        />
        <form
          action={signUp}
          className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
        >
          <label className="block text-sm font-black text-slate-700">
            Full name
            <input
              className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
              name="fullName"
              placeholder="Kendra Thompson"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-black text-slate-700">
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
            Role
            <select
              className="mt-2 w-full rounded-md border border-blue-100 bg-white px-3 py-3 text-sm outline-none focus:border-blue-700"
              name="role"
              defaultValue="parent_player"
            >
              <option value="parent_player">Parent/Player</option>
              <option value="coach">Coach</option>
            </select>
          </label>
          <p className="mt-2 text-xs font-bold text-slate-500">
            Admin accounts must be created by an existing admin.
          </p>
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
            Create Account
          </button>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="font-black text-blue-800" href="/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </PageWrap>
  );
}
