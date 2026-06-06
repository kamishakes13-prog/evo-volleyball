import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { PageHeader, PageWrap } from "@/components/ui";

const playerSections = [
  { label: "Player 1", suffix: "", required: true },
  { label: "Player 2", suffix: "2", required: false },
  { label: "Player 3", suffix: "3", required: false },
];

const errorMessages: Record<string, string> = {
  player: "Parents must add at least one player before creating an account.",
  "rate-limit": "Too many signup attempts. Please wait a minute and try again.",
  signup: "We could not create that account. The email may already be registered.",
  validation: "Please check the required fields and try again.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const success = params.success === "check-email";
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <PageWrap>
      <div className="mx-auto max-w-md">
        <PageHeader
          kicker="Create account"
          title="Join the EVO portal"
          description="Parents can add their player during signup. Admin will assign the player to the right team."
        />
        {success ? (
          <div className="mb-4 rounded-lg border border-lime-300 bg-lime-50 p-4 text-sm leading-6 text-blue-950 shadow-sm">
            <p className="font-black">Check your email to confirm your account.</p>
            <p className="mt-1 font-bold">
              After confirmation, EVO admin will review the player info and
              place each player on the correct team.
            </p>
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700 shadow-sm">
            {errorMessage}
          </div>
        ) : null}
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
            Phone
            <input
              className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
              name="phone"
              placeholder="(214) 555-0123"
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
            Parent accounts are created as Parent/Player by default. Admin
            accounts must be created by an existing admin.
          </p>
          <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-3">
            <p className="text-sm font-black text-blue-900">Player info</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
              Player 1 is required for parents. Add Player 2 or 3 for siblings.
              Coaches can leave this section blank.
            </p>
            {playerSections.map((section) => (
              <fieldset
                className="mt-4 rounded-md border border-blue-100 bg-white p-3"
                key={section.label}
              >
                <legend className="px-1 text-xs font-black uppercase text-blue-900">
                  {section.label}
                  {!section.required ? " optional" : ""}
                </legend>
                <label className="mt-2 block text-sm font-black text-slate-700">
                  Player name
                  <input
                    className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                    name={`playerName${section.suffix}`}
                    placeholder={
                      section.suffix ? "Sibling name" : "Ava Thompson"
                    }
                  />
                </label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block text-sm font-black text-slate-700">
                    Age group
                    <input
                      className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                      name={`playerAgeGroup${section.suffix}`}
                      placeholder="14U"
                    />
                  </label>
                  <label className="block text-sm font-black text-slate-700">
                    Jersey #
                    <input
                      className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                      name={`jerseyNumber${section.suffix}`}
                      min="1"
                      placeholder="7"
                      type="number"
                    />
                  </label>
                </div>
                <label className="mt-3 block text-sm font-black text-slate-700">
                  Notes
                  <input
                    className="mt-2 w-full rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                    name={`playerNotes${section.suffix}`}
                    placeholder="Preferred position, previous team, or anything admin should know"
                  />
                </label>
              </fieldset>
            ))}
          </div>
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
