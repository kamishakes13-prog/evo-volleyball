import { PageHeader, PageWrap } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <PageWrap>
      <PageHeader
        kicker="Privacy"
        title="Privacy policy"
        description="How the EVO portal handles parent, player, roster, schedule, and payment records."
      />
      <div className="space-y-4 rounded-lg border border-blue-100 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
        <p>
          EVO Volleyball Club stores only the information needed to operate the
          club portal, including parent contact details, player profiles,
          schedules, invoices, payments, attendance, and session bookings.
        </p>
        <p>
          Parent/player data is restricted by role-based access and Supabase Row
          Level Security. Parents can only access their own player records.
        </p>
        <p>
          Administrators may access club records to manage rosters, invoices,
          attendance, schedules, private sessions, and payment status. Coaches
          may access information related to assigned teams and sessions.
        </p>
        <p>
          The portal stores payment status, amount, method, date, and invoice
          reference. It does not store bank account details, card numbers, or
          card security codes. Card payments, when enabled, are processed by
          Stripe.
        </p>
        <p>
          Admin actions such as payment updates, invoice edits, player deletion,
          and balance changes may be recorded in audit logs for accountability.
        </p>
        <p>
          EVO Volleyball Club should review this starter policy before inviting
          parents and replace it with attorney-reviewed language when the club is
          ready.
        </p>
      </div>
    </PageWrap>
  );
}
