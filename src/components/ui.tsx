import type { InvoiceStatus } from "@/app/data";

const statusStyles: Record<InvoiceStatus, string> = {
  unpaid: "border-blue-200 bg-blue-50 text-blue-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  partial: "border-lime-200 bg-lime-50 text-lime-800",
  overdue: "border-red-200 bg-red-50 text-red-800",
  waived: "border-slate-200 bg-slate-50 text-slate-700",
};

export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-black uppercase text-lime-500">{kicker}</p>
      <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-blue-800">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
