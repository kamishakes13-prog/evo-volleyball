import { signOut } from "@/app/auth/actions";

export function SignOutButton({ isDemo }: { isDemo: boolean }) {
  if (isDemo) {
    return null;
  }

  return (
    <form action={signOut}>
      <button
        className="rounded-md border border-blue-100 px-3 py-1.5 text-xs font-black text-blue-800"
        type="submit"
      >
        Sign Out
      </button>
    </form>
  );
}
