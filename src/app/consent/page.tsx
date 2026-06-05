import Link from "next/link";
import { saveConsent } from "./actions";
import { PageHeader, PageWrap } from "@/components/ui";

export default function ConsentPage() {
  return (
    <PageWrap>
      <div className="mx-auto max-w-xl">
        <PageHeader
          kicker="Consent"
          title="Parent/player data consent"
          description="A first-pass consent screen for collecting and using parent/player information in the portal."
        />
        <form
          action={saveConsent}
          className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
        >
          <label className="flex gap-3 text-sm font-bold leading-6 text-slate-700">
            <input className="mt-1 size-4" type="checkbox" required />
            I agree to the EVO Volleyball Club terms of use.
          </label>
          <label className="mt-3 flex gap-3 text-sm font-bold leading-6 text-slate-700">
            <input className="mt-1 size-4" type="checkbox" required />
            I acknowledge the privacy policy and consent to storage of
            parent/player data for club operations.
          </label>
          <button
            className="mt-5 w-full rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
            type="submit"
          >
            Save Consent
          </button>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <Link className="font-black text-blue-800" href="/terms">
              Terms
            </Link>
            <Link className="font-black text-blue-800" href="/privacy">
              Privacy
            </Link>
          </div>
        </form>
      </div>
    </PageWrap>
  );
}
