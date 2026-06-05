import { PageHeader, PageWrap } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <PageWrap>
      <PageHeader
        kicker="Privacy"
        title="Privacy policy"
        description="Starter privacy language for parent/player data. Replace with attorney-reviewed policy before launch."
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
          Payment card details are never stored in this app. Card payments are
          processed by Stripe.
        </p>
      </div>
    </PageWrap>
  );
}
