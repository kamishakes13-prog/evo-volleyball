"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { cleanString, rateLimit, requireRole } from "@/lib/security";

export async function createInvoiceCheckout(formData: FormData) {
  const user = await requireRole(["admin", "parent"]);

  if (!rateLimit(`checkout:${user.email}`, 20, 60_000)) {
    return;
  }

  const stripe = getStripe();
  const supabase = await createClient();
  const invoiceId = cleanString(formData.get("invoiceId"), 80);
  const requestedReturnTo = cleanString(formData.get("returnTo"), 120);
  const returnTo = requestedReturnTo.startsWith("/")
    ? requestedReturnTo
    : "/payments";

  if (!invoiceId || !supabase || !stripe) {
    redirect(`${returnTo}?error=stripe-not-configured`);
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id,title,amount_cents,paid_cents,status,players(player_name)")
    .eq("id", invoiceId)
    .single();

  if (!invoice || invoice.status === "paid" || invoice.status === "waived") {
    redirect(`${returnTo}?error=invoice-not-payable`);
  }

  const amountDue = Math.max(
    Number(invoice.amount_cents) - Number(invoice.paid_cents),
    0,
  );

  if (amountDue <= 0) {
    redirect(`${returnTo}?error=invoice-not-payable`);
  }

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountDue,
          product_data: {
            name: invoice.title,
            description: "EVO Volleyball Club invoice payment",
          },
        },
      },
    ],
    metadata: {
      invoice_id: invoice.id,
    },
    success_url: `${origin}${returnTo}?stripe=success`,
    cancel_url: `${origin}${returnTo}?stripe=cancelled`,
  });

  await supabase
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", invoice.id);

  if (!session.url) {
    redirect(`${returnTo}?error=stripe-session`);
  }

  redirect(session.url);
}
