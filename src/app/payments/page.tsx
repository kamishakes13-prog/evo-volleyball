import {
  createInvoice,
  deleteInvoice,
  recordPayment,
  updateInvoice,
  waiveInvoice,
} from "@/app/admin/actions";
import { createInvoiceCheckout } from "@/app/payments/actions";
import { money } from "../data";
import { PageHeader, PageWrap, StatusPill } from "@/components/ui";
import { requireRole } from "@/lib/security";
import { getInvoices, getPlayers } from "@/lib/live-data";

export default async function PaymentsPage() {
  const user = await requireRole(["admin", "parent"]);
  const [invoices, players] = await Promise.all([getInvoices(), getPlayers()]);
  const isAdmin = user.role === "admin";

  return (
    <PageWrap>
      <PageHeader
        kicker="Payments"
        title="Invoices and manual payments"
        description="Track invoice status and payment methods before adding live payment collection."
      />
      {isAdmin ? (
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <form
            action={createInvoice}
            className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
          >
            <h2 className="text-lg font-black text-blue-900">Create invoice</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
                name="playerId"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select player
                </option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
                name="category"
                defaultValue="monthly_dues"
                required
              >
                <option value="monthly_dues">Monthly dues</option>
                <option value="tournament_fee">Tournament fee</option>
                <option value="uniform">Uniform</option>
                <option value="camp">Camp</option>
                <option value="private_session">Private session</option>
                <option value="custom">Custom</option>
              </select>
              <input
                className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                name="title"
                placeholder="Invoice title"
                required
              />
              <input
                className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                name="amount"
                placeholder="Amount"
                type="number"
                min="1"
                step="0.01"
                required
              />
              <input
                className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                name="dueDate"
                type="date"
              />
              <button
                className="rounded-md bg-blue-800 px-4 py-3 text-sm font-black text-white"
                type="submit"
              >
                Add Invoice
              </button>
            </div>
          </form>

          <form
            action={recordPayment}
            className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"
          >
            <h2 className="text-lg font-black text-blue-900">Record payment</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select
                className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700 sm:col-span-2"
                name="invoiceId"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select invoice
                </option>
                {invoices.map((invoice) => {
                  const player =
                    players.find((item) => item.id === invoice.playerId)?.name ??
                    "Player";
                  const remaining = Math.max(invoice.amount - invoice.paid, 0);
                  return (
                    <option key={invoice.id} value={invoice.id}>
                      {player} | {invoice.title} | {money(remaining)} due
                    </option>
                  );
                })}
              </select>
              <input
                className="rounded-md border border-blue-100 px-3 py-3 text-sm outline-none focus:border-blue-700"
                name="amount"
                placeholder="Amount"
                type="number"
                min="1"
                step="0.01"
                required
              />
              <select
                className="rounded-md border border-blue-100 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-700"
                name="method"
                defaultValue="cash"
                required
              >
                <option value="cash">Cash</option>
                <option value="zelle">Zelle</option>
                <option value="venmo">Venmo</option>
                <option value="cash_app">Cash App</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
              <button
                className="rounded-md bg-lime-300 px-4 py-3 text-sm font-black text-blue-950 sm:col-span-2"
                type="submit"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 bg-blue-50 p-4 text-sm font-black text-blue-900 md:grid-cols-[1.3fr_1fr_0.9fr_0.8fr_0.8fr_0.7fr]">
          <span>Invoice</span>
          <span>Player</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Method</span>
          <span>Card</span>
        </div>
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="grid gap-3 border-b border-slate-100 p-4 text-sm last:border-0 md:grid-cols-[1.3fr_1fr_0.9fr_0.8fr_0.8fr_0.7fr]"
          >
            <div>
              <p className="font-black">{invoice.title}</p>
              <p className="text-slate-500">
                {invoice.category} | due {invoice.dueDate}
              </p>
            </div>
            <p className="font-bold">
              {players.find((player) => player.id === invoice.playerId)?.name ??
                "Player"}
            </p>
            <p className="font-black">
              {money(invoice.paid)} / {money(invoice.amount)}
            </p>
            <StatusPill status={invoice.status} />
            <p className="font-bold capitalize text-slate-600">
              {invoice.method ?? "pending"}
            </p>
            {invoice.status !== "paid" && invoice.status !== "waived" ? (
              <form action={createInvoiceCheckout}>
                <input name="invoiceId" type="hidden" value={invoice.id} />
                <button
                  className="w-fit rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-blue-950"
                  type="submit"
                >
                  Pay Card
                </button>
              </form>
            ) : null}
            {isAdmin ? (
              <div className="md:col-span-6">
                <div className="mt-2 grid gap-2 rounded-md bg-slate-50 p-3 md:grid-cols-[1fr_0.8fr_0.7fr_0.7fr_0.7fr_auto]">
                  <form
                    action={updateInvoice}
                    className="grid gap-2 md:col-span-5 md:grid-cols-[1fr_0.8fr_0.7fr_0.7fr_0.7fr_auto]"
                  >
                    <input name="invoiceId" type="hidden" value={invoice.id} />
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="title"
                      defaultValue={invoice.title}
                      required
                    />
                    <select
                      className="rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-700"
                      name="category"
                      defaultValue={invoice.category.replaceAll(" ", "_")}
                      required
                    >
                      <option value="monthly_dues">Monthly dues</option>
                      <option value="tournament_fee">Tournament fee</option>
                      <option value="uniform">Uniform</option>
                      <option value="camp">Camp</option>
                      <option value="private_session">Private session</option>
                      <option value="custom">Custom</option>
                    </select>
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="amount"
                      defaultValue={invoice.amount}
                      min={invoice.paid}
                      step="0.01"
                      type="number"
                      required
                    />
                    <input
                      className="rounded-md border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-700"
                      name="dueDate"
                      defaultValue={invoice.dueDate}
                      type="date"
                    />
                    <select
                      className="rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-700"
                      name="status"
                      defaultValue={invoice.status}
                      required
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="overdue">Overdue</option>
                      <option value="waived">Waived</option>
                    </select>
                    <button
                      className="rounded-md bg-blue-800 px-3 py-2 text-sm font-black text-white"
                      type="submit"
                    >
                      Save
                    </button>
                  </form>
                  <form action={waiveInvoice}>
                    <input name="invoiceId" type="hidden" value={invoice.id} />
                    <button
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700"
                      type="submit"
                    >
                      Waive
                    </button>
                  </form>
                  <form action={deleteInvoice}>
                    <input name="invoiceId" type="hidden" value={invoice.id} />
                    <button
                      className="w-full rounded-md border border-red-200 px-3 py-2 text-sm font-black text-red-700"
                      type="submit"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </PageWrap>
  );
}
