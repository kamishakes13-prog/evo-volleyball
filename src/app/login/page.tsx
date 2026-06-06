import Link from "next/link";
import { resendConfirmation, signIn } from "@/app/auth/actions";
import { PageHeader, PageWrap } from "@/components/ui";

const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const errorMessages: Record<string, string> = {
  "email-not-confirmed":
    "Check your email and click the confirmation link before signing in.",
  "rate-limit": "Too many login attempts. Please wait a minute and try again.",
  signin:
    "That email or password did not work. Make sure the account exists, the email is confirmed, and the password is correct.",
  validation: "Enter a valid email and a password with at least 8 characters.",
};

const successMessages: Record<string, string> = {
  "confirmation-sent":
    "Confirmation email sent. Check your inbox and spam folder, then click the link before signing in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const successMessage = params.success
    ? successMessages[params.success]
    : null;

  return (
    <PageWrap>
      <div className="mx-auto max-w-md">
        <PageHeader
          kicker="Sign in"
          title="Access your EVO portal"
          description="Use the email and password for your EVO account. New accounts must confirm email first."
        />
        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="mb-4 rounded-lg border border-lime-300 bg-lime-50 p-4 text-sm font-bold leading-6 text-blue-950 shadow-sm">
            {successMessage}
          </div>
        ) : null}
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
        <form
          action={resendConfirmation}
          className="mt-4 rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
        >
          <p className="text-sm font-black text-blue-900">
            Did not get the confirmation email?
          </p>
          <label className="mt-3 block text-sm font-black text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
              name="email"
              placeholder="parent@example.com"
              required
              type="email"
            />
          </label>
          <button
            className="mt-4 w-full rounded-md border border-blue-200 px-4 py-3 text-sm font-black text-blue-800"
            type="submit"
          >
            Resend Confirmation Email
          </button>
        </form>
      </div>
    </PageWrap>
  );
}
