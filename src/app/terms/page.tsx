import { PageHeader, PageWrap } from "@/components/ui";

export default function TermsPage() {
  return (
    <PageWrap>
      <PageHeader
        kicker="Legal"
        title="Terms of use"
        description="Starter terms for the EVO Volleyball Club portal. Replace with attorney-reviewed terms before launch."
      />
      <div className="space-y-4 rounded-lg border border-blue-100 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
        <p>
          The EVO Volleyball Club portal is used to manage team rosters,
          schedules, invoices, private sessions, and parent/player records.
        </p>
        <p>
          Users agree to keep login credentials private, access only records
          they are authorized to view, and notify the club if account access may
          be compromised.
        </p>
        <p>
          Card payments must be completed through Stripe Checkout or Stripe
          payment links. The portal does not collect or store card numbers.
        </p>
      </div>
    </PageWrap>
  );
}
