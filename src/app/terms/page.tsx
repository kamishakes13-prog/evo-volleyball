import { PageHeader, PageWrap } from "@/components/ui";

export default function TermsPage() {
  return (
    <PageWrap>
      <PageHeader
        kicker="Legal"
        title="Terms of use"
        description="Portal rules for parents, players, coaches, and administrators."
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
          Parents and players are responsible for reviewing invoices, schedules,
          session bookings, and account balances for accuracy. Contact club
          administration if a balance, payment status, roster assignment, or
          schedule appears incorrect.
        </p>
        <p>
          Manual payments such as Cash, Zelle, Venmo, and Cash App may be
          recorded by club administrators after payment is confirmed. Card
          payments, when enabled, must be completed through Stripe Checkout or
          Stripe payment links. The portal does not collect or store card
          numbers.
        </p>
        <p>
          Private session bookings are subject to coach availability and club
          approval. Duplicate bookings for the same coach and time are not
          allowed.
        </p>
        <p>
          These starter terms should be reviewed by EVO Volleyball Club before
          inviting parents and replaced with attorney-reviewed language when the
          club is ready.
        </p>
      </div>
    </PageWrap>
  );
}
