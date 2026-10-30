import Link from "next/link"
import { Icon } from "../../components/icons"

export function generateStaticParams() {
  return [{ id: "rcp-2025-0847" }]
}

export default async function PublicReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const receiptNumber = id.toUpperCase()

  return (
    <main className="min-h-screen bg-[#eef4f2] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-white">
              <Icon name="receipt" className="size-5" />
            </span>
            <span className="font-bold tracking-tight text-slate-950">
              Receiptiq
            </span>
          </Link>
          <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Icon name="shield" className="size-4" /> Verified receipt
          </span>
        </div>
        <article className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <header className="bg-[#103f3b] p-7 text-white sm:p-9">
            <p className="text-sm font-semibold text-teal-200">
              Common Ground Cafée
            </p>
            <p className="mt-1 text-xs text-teal-100/60">
              21 Market Street, Singapore 048941
            </p>
            <div className="mt-10 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-teal-100/60">
                  Total paid
                </p>
                <p className="mt-2 text-4xl font-semibold">$24.80</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-50">
                Issued
              </span>
            </div>
          </header>
          <div className="p-7 sm:p-9">
            <div className="grid grid-cols-2 gap-5 border-b border-slate-100 pb-7 text-sm">
              <div>
                <p className="text-xs text-slate-400">Receipt number</p>
                <p className="mt-1 font-semibold">{receiptNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Transaction date</p>
                <p className="mt-1 font-semibold">14 May 2025, 10:42 AM</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Cashier</p>
                <p className="mt-1 font-semibold">Daniel Lim</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Payment</p>
                <p className="mt-1 font-semibold">PayNow</p>
              </div>
            </div>
            <div className="py-7">
              <h2 className="font-semibold">Items</h2>
              <div className="mt-4 space-y-4">
                {[
                  ["Iced oat latte", "2 × $7.50", "$15.00"],
                  ["Almond croissant", "1 × $5.80", "$5.80"],
                  ["GST & service", "", "$4.00"],
                ].map(([name, detail, price]) => (
                  <div key={name} className="flex items-center text-sm">
                    <span className="flex-1 font-medium">{name}</span>
                    <span className="mr-8 text-xs text-slate-400">
                      {detail}
                    </span>
                    <span className="font-semibold">{price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-7 sm:flex-row">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <Icon name="download" className="size-4" /> Download PDF
              </button>
              <Link
                href="/"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white"
              >
                View in Receiptiq <Icon name="arrow" className="size-4" />
              </Link>
            </div>
          </div>
        </article>
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          This public page shows transaction details only. Customer contact and
          payment information remain private.
        </p>
      </div>
    </main>
  )
}
