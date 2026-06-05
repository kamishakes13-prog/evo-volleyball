import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = createServiceClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !supabase || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoice_id;
    const amountPaid = session.amount_total ?? 0;

    if (invoiceId && amountPaid > 0) {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("id,amount_cents,paid_cents")
        .eq("id", invoiceId)
        .single();

      if (invoice) {
        const nextPaidCents = Math.min(
          Number(invoice.paid_cents) + amountPaid,
          Number(invoice.amount_cents),
        );
        const nextStatus =
          nextPaidCents >= Number(invoice.amount_cents) ? "paid" : "partial";

        await supabase.from("payments").insert({
          invoice_id: invoiceId,
          amount_cents: amountPaid,
          method: "card",
        });

        await supabase
          .from("invoices")
          .update({
            paid_cents: nextPaidCents,
            status: nextStatus,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
          })
          .eq("id", invoiceId);

        await supabase.from("audit_logs").insert({
          action: "payment.stripe_completed",
          entity_type: "invoice",
          entity_id: invoiceId,
          metadata: {
            amountPaid,
            checkoutSessionId: session.id,
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
