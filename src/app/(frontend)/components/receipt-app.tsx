"use client"

import { useEffect, useMemo, useState } from "react"
import { Icon, type IconName } from "./icons"
import { useUserReceipts, useCreateReceipt, useReceipt } from "@/hook/useReceipt"
import {useMerchantRefunds, useUpdateRefundStatus} from "@/hook/useRefund"
import {useCashiersByStatus, useCreateApprovalCode, useUpdateCashierStatus,useActiveApprovalCodes} from "@/hook/useMerchant"
import { Receipt,Refund,RefundStatus,CreateReceiptInput } from "@/types/types"

type Role = "customer" | "cashier" | "merchant" | "admin"
type Screen = "login" | "register" | "dashboard"
type MerchantApprovalCode = {
  code: string
  status: "New" | "Used"
  cashier?: {
    name: string;
    email: string;
  }
}

const receipts = [
  {
    id: "RCP-2025-0847",
    customer: "Sophia Tan",
    merchant: "Common Ground Café",
    cashier: "Daniel Lim",
    date: "14 May 2025",
    time: "10:42 AM",
    amount: 24.8,
    status: "Issued",
    payment: "PayNow",
  },
  {
    id: "RCP-2025-0846",
    customer: "Marcus Lee",
    merchant: "Common Ground Café",
    cashier: "Alicia Wong",
    date: "14 May 2025",
    time: "9:18 AM",
    amount: 68.4,
    status: "Refund pending",
    payment: "Card",
  },
  {
    id: "RCP-2025-0843",
    customer: "Nadia Rahman",
    merchant: "Common Ground Café",
    cashier: "Daniel Lim",
    date: "13 May 2025",
    time: "4:36 PM",
    amount: 41.2,
    status: "Viewed",
    payment: "PayNow",
  },
  {
    id: "RCP-2025-0839",
    customer: "Ethan Koh",
    merchant: "Common Ground Café",
    cashier: "Alicia Wong",
    date: "13 May 2025",
    time: "1:05 PM",
    amount: 18.9,
    status: "Refunded",
    payment: "Cash",
  },
  {
    id: "RCP-2025-0834",
    customer: "Sophia Tan",
    merchant: "Harbour Grocer",
    cashier: "Daniel Lim",
    date: "12 May 2025",
    time: "6:52 PM",
    amount: 92.15,
    status: "Issued",
    payment: "Card",
  },
]

const merchantRequests = [
  {
    name: "Juniper Bakehouse",
    owner: "Melissa Goh",
    uen: "202411847K",
    date: "Today, 9:42 AM",
    risk: "Low risk",
  },
  {
    name: "Northstar Supplies",
    owner: "Zachary Ong",
    uen: "201938246D",
    date: "Yesterday, 3:16 PM",
    risk: "Review",
  },
  {
    name: "Kumo Homeware",
    owner: "Hana Suzuki",
    uen: "202208731N",
    date: "12 May, 11:08 AM",
    risk: "Low risk",
  },
]

const cashierRequests = [
  {
    name: "Nur Aisyah",
    ic: "S****381D",
    code: "CGC-2048",
    date: "Today, 8:20 AM",
  },
  {
    name: "Ryan Teo",
    ic: "T****729H",
    code: "No code",
    date: "Yesterday, 4:42 PM",
  },
  {
    name: "Priya Nair",
    ic: "S****116J",
    code: "CGC-1903",
    date: "12 May, 2:05 PM",
  },
]

const merchantCashiers = [
  {
    name: "Daniel Lim",
    email: "daniel@commonground.sg",
    phone: "+65 8123 4567",
    ic: "S****381D",
    status: "Active",
    lastActive: "Today, 10:42 AM",
  },
  {
    name: "Alicia Wong",
    email: "alicia@commonground.sg",
    phone: "+65 8765 4321",
    ic: "T****729H",
    status: "Active",
    lastActive: "Today, 9:18 AM",
  },
  {
    name: "Marcus Ng",
    email: "marcus@commonground.sg",
    phone: "+65 8899 1122",
    ic: "S****116J",
    status: "Active",
    lastActive: "Yesterday, 4:36 PM",
  },
]

type MerchantCashier = typeof merchantCashiers[number] & { id?: string }
type PersistedMerchantCashier = {
  id: string
  name: string
  email: string
}

const merchantCashiersStorageKey =
  "receiptiq:merchant:common-ground-cafe:cashiers"

function isPersistedMerchantCashier(
  value: unknown,
): value is PersistedMerchantCashier {
  if (!value || typeof value !== "object") return false
  const cashier = value as Record<string, unknown>
  return (
    typeof cashier.id === "string" &&
    typeof cashier.name === "string" &&
    typeof cashier.email === "string"
  )
}

function generateCashierPassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*"
  const randomValues = crypto.getRandomValues(new Uint8Array(18))
  return Array.from(
    randomValues,
    (value) => alphabet[value % alphabet.length],
  ).join("")
}

const initialApprovalCodes: MerchantApprovalCode[] = [
  {
    code: "CGC-2048",
    status: "Used",
    cashier: { name: "Daniel Lim", email: "daniel@commonground.sg" },
  },
  {
    code: "CGC-1903",
    status: "Used",
    cashier: { name: "Alicia Wong", email: "alicia@commonground.sg" },
  },
  { code: "CGC-5831", status: "New" },
]

const roleCopy: Record<
  Role,
  {
    title: string
    subtitle: string
  }
> = {
  customer: {
    title: "Your receipts, all in one place",
    subtitle:
      "Keep every purchase organised and request refunds without the paperwork.",
  },
  cashier: {
    title: "Issue receipts in seconds",
    subtitle:
      "Create digital receipts, collect payments, and close every shift with confidence.",
  },
  merchant: {
    title: "Run receipt operations clearly",
    subtitle: "Track sales, review refunds, and keep your cashier team moving.",
  },
  admin: {
    title: "Keep the network trusted",
    subtitle:
      "Review merchant applications and manage platform access securely.",
  },
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid size-10 place-items-center rounded-xl ${
          light ? "bg-white text-teal-700" : "bg-teal-700 text-white"
        }`}
      >
        <Icon name="receipt" className="size-5" />
      </div>
      <div>
        <p
          className={`text-lg font-bold tracking-tight ${
            light ? "text-white" : "text-slate-950"
          }`}
        >
          Receiptiq
        </p>
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
            light ? "text-teal-100" : "text-slate-400"
          }`}
        >
          Smart receipt cloud
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status.includes("pending") || status === "Review"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : status === "Refunded"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-emerald-50 text-emerald-700 ring-emerald-200"
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      {status}
    </span>
  )
}

function AuthScreen({ initialScreen = "login" }: { initialScreen?: Screen }) {
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [role, setRole] = useState<Role>("merchant")
  const [showPassword, setShowPassword] = useState(false)
  const copy = roleCopy[role]

  if (screen === "dashboard")
    return <Dashboard role={role} onLogout={() => setScreen("login")} />

  return (
    <main className="min-h-screen bg-[#f3f7f6] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[0.96fr_1.04fr]">
        <section className="relative hidden overflow-hidden bg-[#0f665f] p-14 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute -bottom-40 -right-24 size-[560px] rounded-full border-[80px] border-white/5" />
          <div className="relative z-10">
            <Logo light />
          </div>
          <div className="relative z-10 my-auto max-w-lg">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-teal-50 backdrop-blur">
              <Icon name="shield" className="size-4" /> Secure, paperless,
              effortless
            </div>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em]">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-teal-50/80">
              {copy.subtitle}
            </p>
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/15 pt-8">
              {[
                ["6,541", "Receipts issued"],
                ["1,205", "Active customers"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs text-teal-100/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-xs text-teal-100/60">
            PCI-conscious data handling · Encrypted in transit
          </p>
        </section>

        <section className="flex min-h-full items-center justify-center px-6 py-10 sm:px-12 lg:px-20">
          <div className="w-full max-w-[520px]">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Logo />
            </div>
            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-teal-700">
                {screen === "login" ? "Welcome back" : "Create your account"}
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {screen === "login" ? "Sign in to Receiptiq" : "Join Receiptiq"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {screen === "login"
                  ? "Choose a role to preview the tailored workspace."
                  : "Admin accounts are managed internally and cannot be registered."}
              </p>
            </div>

            <div className="mb-7 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
              {(screen === "login"
                ? ["customer", "cashier", "merchant", "admin"]
                : ["customer", "cashier", "merchant"]
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item as Role)}
                  className={`rounded-lg px-2 py-2.5 text-xs font-semibold capitalize transition ${
                    role === item
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                setScreen("dashboard")
              }}
            >
              {screen === "register" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" placeholder="e.g. Amanda Lee" />
                  <Field label="Phone number" placeholder="+65 8123 4567" />
                </div>
              )}
              <Field
                label="Email address"
                placeholder="you@example.com"
                type="email"
              />
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {screen === "login" && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-teal-700"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {screen === "register" && role === "merchant" && (
                <div className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="building"
                      className="mt-0.5 size-5 text-teal-700"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Business verification
                      </p>
                      <p className="text-xs leading-5 text-slate-500">
                        Your application will be reviewed by an admin.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Company name"
                      placeholder="Legal business name"
                    />
                    <Field
                      label="Registration no."
                      placeholder="UEN / company no."
                    />
                  </div>
                  <Field
                    label="Settlement account"
                    placeholder="Bank account ending digits"
                  />
                </div>
              )}
              {screen === "register" && role === "cashier" && (
                <div className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    
                    <Field
                      label="Approval code (optional)"
                      placeholder="e.g. CGC-2048"
                    />
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Merchant to work under
                    </span>
                    <select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none focus:border-teal-600">
                      <option>Common Ground Café</option>
                      <option>Harbour Grocer</option>
                      <option>Juniper Bakehouse</option>
                    </select>
                  </label>
                </div>
              )}
              {screen === "register" && role === "customer" && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon name="card" className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Add a payment method later
                      </p>
                      <p className="text-xs text-slate-500">
                        We only store tokenized payment references.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Optional
                    </span>
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-800"
              >
                {screen === "login" ? "Sign in" : "Create account"}{" "}
                <Icon name="arrow" className="size-4" />
              </button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">
              {screen === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setScreen(screen === "login" ? "register" : "login")
                  if (screen === "login" && role === "admin")
                    setRole("merchant")
                }}
                className="font-semibold text-teal-700"
              >
                {screen === "login" ? "Register now" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string
  placeholder: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
      />
    </label>
  )
}

const navigation: Record<
  Role,
  {
    label: string
    icon: IconName
    key: string
  }[]
> = {
    customer: [
      { label: "Overview", icon: "grid", key: "overview" },
      { label: "My receipts", icon: "receipt", key: "receipts" },
      { label: "Refund requests", icon: "refund", key: "refunds" },
    ],
    cashier: [
      { label: "Overview", icon: "grid", key: "overview" },
      { label: "New receipt", icon: "plus", key: "new" },
      { label: "Receipts", icon: "receipt", key: "receipts" },
      { label: "Import receipts", icon: "import", key: "import" },
      
    ],
    merchant: [
      { label: "Overview", icon: "grid", key: "overview" },
      { label: "Receipts", icon: "receipt", key: "receipts" },
      { label: "Refund requests", icon: "refund", key: "refunds" },
      { label: "Cashiers", icon: "cashier", key: "cashiers" },
      { label: "Cashier approvals", icon: "cashier", key: "approvals" },
      { label: "Import receipts", icon: "import", key: "import" },
      { label: "Reports", icon: "history", key: "reports" },
    ],
    admin: [
      { label: "Overview", icon: "grid", key: "overview" },
      { label: "Merchant approvals", icon: "building", key: "approvals" },
      { label: "User management", icon: "users", key: "users" },
      { label: "Audit log", icon: "shield", key: "audit" },
    ],
  }

function Dashboard({
  role,
  onLogout,
}: {
  role: Role
  onLogout: () => void
}) {
  const [active, setActive] = useState("overview")
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState("")
  const [selectedReceipt, setSelectedReceipt] =
    useState<typeof receipts[0] | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [approvalCodesOpen, setApprovalCodesOpen] = useState(false)
  const [createCashierOpen, setCreateCashierOpen] = useState(false)
  const [cashiers, setCashiers] = useState<MerchantCashier[]>(merchantCashiers)
  const [cashiersLoaded, setCashiersLoaded] = useState(false)
  const [cashierStorageError, setCashierStorageError] = useState("")
  const [approvalCodes, setApprovalCodes] =
    useState<MerchantApprovalCode[]>(initialApprovalCodes)
  const roleName =
    role === "merchant"
      ? "Common Ground Café"
      : role === "admin"
        ? "System Administrator"
        : role === "cashier"
          ? "Daniel Lim"
          : "Sophia Tan"

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }
  const nav = navigation[role]

  useEffect(() => {
    try {
      const savedCashiers = window.localStorage.getItem(
        merchantCashiersStorageKey,
      )
      if (savedCashiers) {
        const parsedCashiers: unknown = JSON.parse(savedCashiers)
        if (
          !Array.isArray(parsedCashiers) ||
          !parsedCashiers.every(isPersistedMerchantCashier)
        ) {
          throw new Error("Saved cashier data has an invalid format.")
        }
        setCashiers((current) => [
          ...parsedCashiers.map((cashier) => ({
            ...cashier,
            phone: "—",
            ic: "—",
            status: "Active",
            lastActive: "Never",
          })),
          ...current,
        ])
      }
    } catch {
      setCashierStorageError(
        "Saved cashier accounts could not be loaded. Please check browser storage before creating accounts.",
      )
    } finally {
      setCashiersLoaded(true)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f7f7] text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#103f3b] px-4 py-6 text-white transition-transform lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-2">
          <Logo light />
        </div>
        <nav className="mt-10 space-y-1">
          {nav.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActive(item.key)
                setMobileMenu(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                active === item.key
                  ? "bg-white text-teal-800 shadow-lg"
                  : "text-teal-50/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="size-[18px]" />
              {item.label}
              {(role === "merchant" || role === "admin") &&
                item.key === "approvals" && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active === item.key
                        ? "bg-teal-100 text-teal-800"
                        : "bg-amber-400 text-amber-950"
                    }`}
                  >
                    3
                  </span>
                )}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-teal-50/70 hover:bg-white/10 hover:text-white"
          >
            <Icon name="help" className="size-[18px]" />
            Help & support
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-teal-50/70 hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" className="size-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="mr-4 text-slate-600 lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              placeholder="Search receipts, customers..."
              className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            >
              <Icon name="bell" className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-amber-500" />
            </button>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-[#dff1ed] text-sm font-bold text-teal-800">
                {roleName
                  .split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {roleName}
                </p>
                <p className="text-xs capitalize text-slate-400">{role}</p>
              </div>
              <Icon
                name="chevron"
                className="hidden size-4 rotate-90 text-slate-400 sm:block"
              />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 lg:p-8">
          <PageContent
            role={role}
            active={active}
            setActive={setActive}
            notify={notify}
            selectReceipt={setSelectedReceipt}
            openApprovalCodes={() => setApprovalCodesOpen(true)}
            openCreateCashier={() => setCreateCashierOpen(true)}
            cashiers={cashiers}
            cashierStorageError={cashierStorageError}
            cashiersLoaded={cashiersLoaded}
          />
        </main>
      </div>

      {approvalCodesOpen && role === "merchant" && (
        <ApprovalCodesDrawer
          codes={approvalCodes}
          onClose={() => setApprovalCodesOpen(false)}
          onGenerate={() => {
            setApprovalCodes((current) => {
              let code: string
              do {
                const randomValue =
                  crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
                code = `CGC-${String((randomValue % 9000) + 1000)}`
              } while (current.some((item) => item.code === code))
              return [{ code, status: "New" }, ...current]
            })
          }}
        />
      )}

      {createCashierOpen && role === "merchant" && (
        <CreateCashierDrawer
          onClose={() => setCreateCashierOpen(false)}
          onCreate={(name, email) => {
            const normalizedEmail = email.trim().toLowerCase()
            if (
              cashiers.some(
                (cashier) => cashier.email.toLowerCase() === normalizedEmail,
              )
            ) {
              return { error: "A cashier with this email already exists." }
            }

            const newCashier: MerchantCashier = {
              id: crypto.randomUUID(),
              name,
              email: normalizedEmail,
              phone: "—",
              ic: "—",
              status: "Active",
              lastActive: "Never",
            }
            const nextCashiers = [newCashier, ...cashiers]
            const savedCashiers = nextCashiers
              .filter((cashier): cashier is MerchantCashier & { id: string } =>
                Boolean(cashier.id),
              )
              .map(({ id, name: cashierName, email: cashierEmail }) => ({
                id,
                name: cashierName,
                email: cashierEmail,
              }))

            try {
              window.localStorage.setItem(
                merchantCashiersStorageKey,
                JSON.stringify(savedCashiers),
              )
            } catch {
              const error =
                "The cashier account could not be saved in this browser. Check available browser storage and try again."
              setCashierStorageError(error)
              return { error }
            }

            setCashiers(nextCashiers)
            setCashierStorageError("")
            return { password: generateCashierPassword() }
          }}
        />
      )}

      {selectedReceipt && (
        <ReceiptDrawer
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          notify={notify}
        />
      )}
      {profileOpen && (
        <ProfileModal
          role={role}
          name={roleName}
          onClose={() => setProfileOpen(false)}
          notify={notify}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <span className="grid size-6 place-items-center rounded-full bg-emerald-500">
            <Icon name="check" className="size-4" />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}

function PageContent({
  role,
  active,
  setActive,
  notify,
  selectReceipt,
  openApprovalCodes,
  openCreateCashier,
  cashiers,
  cashierStorageError,
  cashiersLoaded,
}: {
  role: Role
  active: string
  setActive: (key: string) => void
  notify: (message: string) => void
  selectReceipt: (receipt: typeof receipts[0]) => void
  openApprovalCodes: () => void
  openCreateCashier: () => void
  cashiers: MerchantCashier[]
  cashierStorageError: string
  cashiersLoaded: boolean
}) {
  if (active === "new") return <NewReceipt notify={notify} />
  if (active === "import") return <ImportReceipts notify={notify} />
  if (active === "approvals") return <Approvals role={role} notify={notify} />
  if (active === "cashiers" && role === "merchant")
    return (
      <Cashiers
        cashiers={cashiers}
        openApprovalCodes={openApprovalCodes}
        openCreateCashier={openCreateCashier}
        cashierStorageError={cashierStorageError}
        cashiersLoaded={cashiersLoaded}
      />
    )
  if (active === "refunds")
    return <Refunds role={role} notify={notify} selectReceipt={selectReceipt} />
  if (active === "users") return <UserManagement notify={notify} />
  if (active === "reports") return <Reports notify={notify} />
  if (active === "receipts")
    return (
      <Receipts
        title={role === "customer" ? "My receipts" : "All receipts"}
        selectReceipt={selectReceipt}
        notify={notify}
      />
    )
  if (active === "audit") return <AuditLog />
  return (
    <Overview
      role={role}
      setActive={setActive}
      notify={notify}
      selectReceipt={selectReceipt}
    />
  )
}

function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  )
}

function Overview({
  role,
  setActive,
  notify,
  selectReceipt,
}: {
  role: Role
  setActive: (key: string) => void
  notify: (message: string) => void
  selectReceipt: (receipt: typeof receipts[0]) => void
}) {
  const cards =
    role === "admin"
      ? [
          ["Pending merchants", "3", "+2 this week", "building"],
          ["Active users", "420", "+8.2%", "users"],
          
          ["Platform volume", "$84k", "+6.8%", "wallet"],
        ]
      : role === "customer"
        ? [
            ["Total receipts", "18", "All time", "receipt"],
            ["Total spent", "$848.60", "This year", "wallet"],
            ["Refunded", "$84.90", "3 requests", "refund"],
          ]
        : role === "cashier"
          ? [
              ["Total sales", "$7,482.40", "+8.5%", "wallet"],
              ["Receipts issued", "84", "+8.4%", "receipt"],
              ["Avg. transaction", "$15.95", "+3.2%", "history"],
            ]
          : [
              ["Gross sales", "$126,482.40", "+12.5%", "wallet"],
              ["Receipts", "1284", "+8.4%", "receipt"],

              ["Pending refunds", "6", "$248.20", "refund"],
            ]
  return (
    <>
      <PageHeader
        eyebrow={role === "customer" ? "Good morning" : "Wednesday, 14 May"}
        title={
          role === "merchant"
            ? "Business overview"
            : role === "admin"
              ? "Platform overview"
              : role === "cashier"
                ? "Good morning, Daniel"
                : "Good morning, Sophia"
        }
        description={
          role === "admin"
            ? "Monitor activity and keep the merchant network trusted."
            : role === "customer"
              ? "Here is a quick look at your recent purchases."
              : "Here is what is happening across your workspace today."
        }
      >
        {role === "cashier" && (
          <button
            type="button"
            onClick={() => setActive("new")}
            className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Icon name="plus" className="size-4" />
            New receipt
          </button>
        )}
        {role === "merchant" && (
          <button
            type="button"
            onClick={() => setActive("import")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <Icon name="import" className="size-4" />
            Import
          </button>
        )}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, change, icon]) => (
          <MetricCard
            key={label}
            label={label}
            value={value}
            change={change}
            icon={icon as IconName}
          />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                {role === "customer" ? "Spending activity" : "Receipt volume"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Last 7 days</p>
            </div>
            <button
              type="button"
              onClick={() => notify("Report downloaded as PDF")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              <Icon name="download" className="size-4" />
              Export
            </button>
          </div>
          <div className="mt-8 flex h-52 items-end gap-3 border-b border-l border-slate-200 px-3 pt-4">
            {[42, 65, 48, 78, 60, 92, 73].map((height, index) => (
              <div
                key={index}
                className="group relative flex h-full flex-1 items-end"
              >
                <div
                  className={`w-full rounded-t-lg transition group-hover:bg-teal-700 ${
                    index === 5 ? "bg-teal-700" : "bg-teal-100"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">
                  {["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"][index]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Peak activity on Tuesday, 2–4 PM
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              +12.5% vs last week
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                {role === "admin"
                  ? "Review queue"
                  : role === "merchant"
                    ? "Payment mix"
                    : "Quick actions"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Updated just now</p>
            </div>
            <button type="button" className="text-slate-400">
              <Icon name="more" />
            </button>
          </div>
          {role === "merchant" ? (
            <div className="mt-7">
              <div className="mx-auto grid size-36 place-items-center rounded-full bg-[conic-gradient(#0f766e_0_54%,#5eead4_54%_78%,#fbbf24_78%_91%,#e2e8f0_91%)]">
                <div className="grid size-24 place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-2xl font-semibold">$12.4k</p>
                    <p className="text-[10px] text-slate-400">Total</p>
                  </div>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  ["PayNow", "54%", "bg-teal-700"],
                  ["Card", "24%", "bg-teal-300"],
                  ["Cash", "13%", "bg-amber-400"],
                  ["Other", "9%", "bg-slate-200"],
                ].map(([name, value, color]) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <span className={`size-2 rounded-full ${color}`} />
                    <span className="text-slate-500">{name}</span>
                    <span className="ml-auto font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {(role === "admin" ? merchantRequests : receipts.slice(0, 3)).map(
                (item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      role === "admin"
                        ? setActive("approvals")
                        : selectReceipt(item as typeof receipts[0])
                    }
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-teal-200 hover:bg-teal-50/40"
                  >
                    <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon
                        name={role === "admin" ? "building" : "receipt"}
                        className="size-5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {"name" in item ? item.name : item.merchant}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {"uen" in item ? item.uen : item.id}
                      </p>
                    </div>
                    <Icon name="chevron" className="size-4 text-slate-300" />
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6">
        <Receipts
          title="Recent receipts"
          compact
          selectReceipt={selectReceipt}
          notify={notify}
        />
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  change,
  icon,
}: {
  label: string
  value: string
  change: string
  icon: IconName
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
          <Icon name={icon} className="size-5" />
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
          {change}
        </span>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  )
}

function Receipts({
  title,
  compact = false,
  selectReceipt,
  notify,
}: {
  title: string
  compact?: boolean
  selectReceipt: (receipt: typeof receipts[0]) => void
  notify: (message: string) => void
}) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(
    () =>
      receipts.filter((receipt) =>
        `${receipt.id} ${receipt.customer} ${receipt.merchant}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  )

  const { data, isLoading, error } = useUserReceipts(2) 
  console.log({ data, isLoading, error })
  const rows: Receipt[] = Array.isArray(data) ? data : [];
  return (
    <div
      className={
        compact ? "rounded-2xl border border-slate-200 bg-white shadow-sm" : ""
      }
    >
      {!compact && (
        <PageHeader
          title={title}
          description="Search, view and export transaction records."
        >
          <button
            type="button"
            onClick={() => notify("Receipt report downloaded as Excel")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            <Icon name="download" className="size-4" />
            Export
          </button>
        </PageHeader>
      )}
      <div
        className={
          compact
            ? ""
            : "rounded-2xl border border-slate-200 bg-white shadow-sm"
        }
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              {compact ? title : "Receipt records"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {data?.length} records shown
            </p>
          </div>
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search receipts"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-teal-600 sm:w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Receipt</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date & time</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
           <tbody>
           {isLoading ? (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-400">
                Loading receipts...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-xs text-rose-600">
                Failed to load receipts. Check backend connection.
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-xs text-slate-400">
                No receipts found.
              </td>
            </tr>
          ) : (
            rows.slice(0, compact ? 4 : rows.length).map((d) => (
              <tr
                key={d.receipt_id}
                className="border-b border-slate-100 text-sm last:border-0 hover:bg-slate-50/70"
              >
                <td className="px-5 py-4 font-semibold text-teal-700">
                  {d.receipt_id}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-800">customer name</p>
                  <p className="text-xs text-slate-400">merchant name</p>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {d.issued_at}
                  <br />
                  <span className="text-slate-400">{d.issued_at}</span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-600">
                  {d.payment_type}
                </td>
                <td className="px-5 py-4 font-semibold">
                  ${d.total_amount}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={d.receipt_status} />
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => selectReceipt(d as unknown as typeof receipts[0])}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-700"
                  >
                    <Icon name="chevron" className="size-4" />
                  </button>
                </td>
              </tr>
            ))
          )}

          </tbody>
          </table>
        </div>
        {compact && (
          <button
            type="button"
            className="w-full border-t border-slate-100 py-3 text-xs font-semibold text-teal-700"
          >
            View all receipts
          </button>
        )}
      </div>
    </div>
  )
}

function NewReceipt({ notify }: { notify: (message: string) => void }) {
  const [items, setItems] = useState([
    { name: "Iced oat latte", quantity: 2, price: 7.5 },
    { name: "Almond croissant", quantity: 1, price: 5.8 },
  ])
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  return (
    <>
      <PageHeader
        eyebrow="Cashier workspace"
        title="Create a new receipt"
        description="Enter transaction details, then generate a PayNow QR or issue the receipt."
      />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Customer details</h2>
            <p className="mt-1 text-xs text-slate-400">
              Use email or mobile to link the receipt.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Customer name" placeholder="Full name" />
              <Field label="Email address" placeholder="customer@example.com" />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Receipt items</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Add products and quantities.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setItems([
                    ...items,
                    { name: "New item", quantity: 1, price: 0 },
                  ])
                }
                className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
              >
                <Icon name="plus" className="size-4" />
                Add item
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_72px_90px_36px] items-center gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <input
                    defaultValue={item.name}
                    className="min-w-0 text-sm font-medium outline-none"
                  />
                  <input
                    defaultValue={item.quantity}
                    type="number"
                    className="rounded-lg bg-slate-50 px-2 py-2 text-center text-sm outline-none"
                  />
                  <input
                    defaultValue={item.price.toFixed(2)}
                    className="rounded-lg bg-slate-50 px-2 py-2 text-right text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setItems(
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-2xl bg-[#103f3b] p-6 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
            Receipt summary
          </p>
          <div className="mt-6 space-y-3 text-sm text-teal-50/70">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span>${(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-end justify-between">
              <span className="text-sm text-teal-100/70">Total</span>
              <span className="text-3xl font-semibold">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => notify("PayNow QR generated")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-teal-800"
          >
            <Icon name="grid" className="size-4" />
            Generate PayNow QR
          </button>
          <button
            type="button"
            onClick={() => notify("Receipt RCP-2025-0848 issued")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white"
          >
            <Icon name="receipt" className="size-4" />
            Issue receipt
          </button>
          <p className="mt-4 text-center text-[10px] leading-4 text-teal-100/50">
            Payment settles directly to the merchant. Cashiers cannot view
            settlement account details.
          </p>
        </aside>
      </div>
    </>
  )
}

function ImportReceipts({ notify }: { notify: (message: string) => void }) {
  const [uploaded, setUploaded] = useState(false)
  return (
    <>
      <PageHeader
        eyebrow="Bulk operations"
        title="Import receipts"
        description="Upload completed transactions using our CSV or Excel template."
      >
        <button
          type="button"
          onClick={() => notify("CSV template downloaded")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          <Icon name="download" className="size-4" />
          Download template
        </button>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Upload completed template</h2>
          <p className="mt-1 text-xs text-slate-400">
            Accepted formats: .csv, .xlsx up to 10 MB
          </p>
          <button
            type="button"
            onClick={() => setUploaded(true)}
            className="mt-6 grid min-h-72 w-full place-items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40"
          >
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-700">
                <Icon name="import" className="size-6" />
              </div>
              <p className="mt-4 font-semibold text-slate-800">
                {uploaded
                  ? "may-receipts.xlsx ready"
                  : "Drop a file here or browse"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {uploaded
                  ? "42 rows detected · 0 validation errors"
                  : "We validate every row before import"}
              </p>
            </div>
          </button>
          {uploaded && (
            <button
              type="button"
              onClick={() => notify("42 receipts imported successfully")}
              className="mt-4 w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white"
            >
              Import 42 receipts
            </button>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">How it works</h2>
          <div className="mt-6 space-y-6">
            {[
              [
                "1",
                "Download the template",
                "Use the provided headers without renaming columns.",
              ],
              [
                "2",
                "Add receipt data",
                "One transaction per row. Items can use the JSON format shown.",
              ],
              [
                "3",
                "Upload and validate",
                "Review errors before anything is stored.",
              ],
              [
                "4",
                "Confirm import",
                "Valid records are saved and appear in receipt history.",
              ],
            ].map(([step, title, text]) => (
              <div key={step} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            <strong>Security reminder:</strong> Never include full card numbers,
            CVV, or online banking credentials in import files.
          </div>
        </section>
      </div>
    </>
  )
}

function Approvals({
  role,
  notify,
}: {
  role: Role
  notify: (message: string) => void
}) {
  const isAdmin = role === "admin"

  const {
    data: pendingCashiersData,
    isLoading: isLoadingCashiers,
    error: cashiersError,
  } = useCashiersByStatus("pending")

  const { mutate: updateCashierStatus, isPending: isUpdatingCashier } =
    useUpdateCashierStatus()

  const pendingCashiers: CashierUser[] = Array.isArray(pendingCashiersData)
    ? pendingCashiersData
    : []

  const handleCashierDecision = (cashier: CashierUser, approved: boolean) => {
    updateCashierStatus(
      { userId: cashier.user_id, approved },
      {
        onSuccess: (res) => {
          notify(
            res?.message ??
              `${cashier.name} ${approved ? "approved" : "rejected"}`,
          )
        },
        onError: () => {
          notify(
            `Failed to ${approved ? "approve" : "reject"} ${cashier.name}`,
          )
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Action required"
        title={isAdmin ? "Merchant approvals" : "Cashier approvals"}
        description={
          isAdmin
            ? "Review business information before activating merchant access."
            : "Review people requesting to work under your merchant account."
        }
      />

      {isAdmin ? (
        <div className="grid gap-4">
          {merchantRequests.map((request) => (
            <div
              key={request.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid size-12 place-items-center rounded-xl bg-teal-50 font-bold text-teal-700">
                  {request.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{request.name}</h2>
                    <StatusBadge status={request.risk} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.owner} · {request.uen}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Submitted {request.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => notify(`${request.name} rejected`)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => notify(`${request.name} approved`)}
                    className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    <Icon name="check" className="size-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isLoadingCashiers ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Loading pending cashier requests...
        </div>
      ) : cashiersError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center text-sm text-rose-600 shadow-sm">
          Failed to load pending cashiers. Check backend connection.
        </div>
      ) : pendingCashiers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          No pending cashier approvals.
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingCashiers.map((cashier) => {
            const initials = (cashier.name || "C")
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()

            const createdDate = new Date(cashier.created_at)
            const formattedDate = Number.isNaN(createdDate.getTime())
              ? cashier.created_at
              : createdDate.toLocaleDateString("en-SG", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })

            return (
              <div
                key={cashier.user_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="grid size-12 place-items-center rounded-xl bg-teal-50 font-bold text-teal-700">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{cashier.name}</h2>
                      <StatusBadge status={String(cashier.account_status)} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {cashier.email}
                      {cashier.phone_number ? ` · ${cashier.phone_number}` : ""}
                      {cashier.merchant_to_work_under
                        ? ` · Merchant #${cashier.merchant_to_work_under}`
                        : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Submitted {formattedDate}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingCashier}
                      onClick={() => handleCashierDecision(cashier, false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingCashier}
                      onClick={() => handleCashierDecision(cashier, true)}
                      className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                    >
                      <Icon name="check" className="size-4" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
function Cashiers({
  openApprovalCodes,
  openCreateCashier,
}: {
  openApprovalCodes: () => void
  openCreateCashier: () => void
}) {
  const {
    data: cashierList,
    isLoading,
    error,
  } = useCashiersByStatus("active")

  const cashiers: CashierUser[] = Array.isArray(cashierList) ? cashierList : []

  const activeCount = cashiers.filter(
    (cashier) => String(cashier.account_status).toLowerCase() === "active",
  ).length

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Cashiers"
        description="View the cashiers registered to your merchant account."
      >
        <button
          type="button"
          onClick={openCreateCashier}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
        >
          <Icon name="plus" className="size-4" />
          Create cashier
        </button>
        <button
          type="button"
          onClick={openApprovalCodes}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Icon name="cashier" className="size-4" />
          Approval codes
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Registered cashiers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {isLoading ? "—" : cashiers.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active cashiers</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {isLoading ? "—" : activeCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Cashier</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">IC number</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-xs text-slate-400"
                  >
                    Loading cashiers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-xs text-rose-600"
                  >
                    Failed to load cashiers. Check backend connection.
                  </td>
                </tr>
              ) : cashiers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-xs text-slate-400"
                  >
                    No active cashiers found.
                  </td>
                </tr>
              ) : (
                cashiers.map((cashier) => {
                  const createdDate = new Date(cashier.created_at)
                  const formattedJoined = Number.isNaN(createdDate.getTime())
                    ? "—"
                    : createdDate.toLocaleDateString("en-SG", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })

                  return (
                    <tr
                      key={cashier.user_id}
                      className="border-t border-slate-100 text-sm"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {cashier.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {cashier.email || `User #${cashier.user_id}`}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {cashier.phone_number || "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">—</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={String(cashier.account_status)} />
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formattedJoined}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function CreateCashierDrawer({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (
    name: string,
    email: string,
  ) => {
    password?: string
    error?: string
  }
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close create cashier"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-slate-950/40"
      />
      <aside
        aria-labelledby="create-cashier-title"
        aria-modal="true"
        role="dialog"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              Cashier registration
            </p>
            <h2
              id="create-cashier-title"
              className="mt-1 text-lg font-semibold text-slate-900"
            >
              Create cashier
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close create cashier"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="rounded-xl bg-teal-50 p-4 text-sm leading-6 text-teal-900">
            Enter a name to create a cashier account. A random password will be
            generated for you to share with the cashier.
          </div>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              const cashierName = name.trim()
              const cashierEmail = email.trim()
              if (!cashierName || !cashierEmail) return
              const result = onCreate(cashierName, cashierEmail)
              if (result.error) {
                setError(result.error)
                setPassword("")
                return
              }
              if (!result.password) {
                setError("The cashier account could not be created.")
                setPassword("")
                return
              }
              setError("")
              setPassword(result.password)
              setName("")
              setEmail("")
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Cashier name
              </span>
              <input
                autoFocus
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setPassword("")
                  setError("")
                }}
                placeholder="e.g. Jamie Tan"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setPassword("")
                  setError("")
                }}
                placeholder="cashier@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!name.trim() || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="plus" className="size-4" />
              Generate account
            </button>
          </form>

          {password && (
            <section
              aria-live="polite"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <p className="text-sm font-semibold text-emerald-900">
                Cashier account created
              </p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Share this password with the cashier. It will only be shown
                here.
              </p>
              <div className="mt-4">
                <label
                  htmlFor="generated-cashier-password"
                  className="mb-2 block text-xs font-medium text-emerald-900"
                >
                  Generated password
                </label>
                <input
                  id="generated-cashier-password"
                  readOnly
                  value={password}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2.5 font-mono text-sm tracking-wide text-slate-900"
                />
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  )
}
function ApprovalCodesDrawer({
  onClose,
  notify,
}: {
  onClose: () => void
  notify?: (message: string) => void
}) {
  const {
    data: codesData,
    isLoading,
    error,
  } = useActiveApprovalCodes()

  const { mutate: createApprovalCode, isPending: isGenerating } =
    useCreateApprovalCode()

  const codes: ApprovalCode[] = Array.isArray(codesData) ? codesData : []

  const handleGenerate = () => {
    createApprovalCode(undefined, {
      onSuccess: (res) => {
        const createdCode = res?.data?.approval_code
        notify?.(
          res?.message ??
            (createdCode
              ? `Generated approval code ${createdCode}`
              : "Approval code generated"),
        )
      },
      onError: () => {
        notify?.("Failed to generate approval code. Check backend connection.")
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close approval codes"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default bg-slate-950/40"
      />
      <aside
        aria-labelledby="approval-codes-title"
        aria-modal="true"
        role="dialog"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              Cashier registration
            </p>
            <h2
              id="approval-codes-title"
              className="mt-1 text-lg font-semibold text-slate-900"
            >
              Approval codes
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close approval codes"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            <Icon name="close" className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="rounded-xl bg-teal-50 p-4 text-sm leading-6 text-teal-900">
            Share a new code with a cashier so they can enter it when
            registering under your merchant account.
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
          >
            <Icon name="plus" className="size-4" />
            {isGenerating ? "Generating..." : "Generate new code"}
          </button>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Active approval codes
              </h3>
              <span className="text-xs text-slate-400">
                {isLoading ? "—" : `${codes.length} total`}
              </span>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400">
                Loading approval codes...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center text-xs text-rose-600">
                Failed to load approval codes. Check backend connection.
              </div>
            ) : codes.length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400">
                No active approval codes yet. Generate one above.
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((item) => (
                  <article
                    key={item.id ?? item.approval_code}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-sm font-semibold tracking-wide text-slate-900">
                        {item.approval_code}
                      </p>
                      <StatusBadge status={String(item.status)} />
                    </div>
                    {item.used_at && (
                      <p className="mt-2 text-xs text-slate-400">
                        Used at: {item.used_at}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
function Refunds({
  role,
  notify,
  selectReceipt,
}: {
  role: Role
  notify: (message: string) => void
  selectReceipt: (receipt: Receipt) => void
}) {
  const merchantId = 2
  const {
    data: refundList,
    isLoading,
    error,
  } = useMerchantRefunds(role === "merchant" ? merchantId : undefined)
  const { mutate: updateRefundStatus, isPending: isUpdating } =
    useUpdateRefundStatus()

  const refunds = Array.isArray(refundList) ? refundList : []

  const handleDecision = (refund: Refund, approved: boolean) => {
    updateRefundStatus(
      { receiptId: refund.receipt_id, approved },
      {
        onSuccess: (res) => {
          notify(
            res?.message ??
              `Refund for RCP-${refund.receipt_id} ${
                approved ? "approved" : "rejected"
              }`,
          )
        },
        onError: () => {
          notify(
            `Failed to ${approved ? "approve" : "reject"} refund for RCP-${refund.receipt_id}`,
          )
        },
      },
    )
  }

  const handleViewReceipt = (refund: Refund) => {
    const requestedDate = new Date(refund.requested_at)
    const fallbackIssuedAt = Number.isNaN(requestedDate.getTime())
      ? new Date().toISOString()
      : refund.requested_at

    selectReceipt({
      receipt_id: refund.receipt_id,
      merchant_id: refund.merchant_id,
      customer_id: refund.customer_id,
      cashier_id: null,
      payment_type: "PayNow",
      issued_at: fallbackIssuedAt,
      items: [],
      total_amount: refund.refund_amount,
      receipt_status:
        refund.refund_status === "approved"
          ? "refunded"
          : refund.refund_status === "rejected"
            ? "refund_rejected"
            : "issued",
    } as Receipt)
  }

  return (
    <>
      <PageHeader
        eyebrow="Refund workflow"
        title={
          role === "customer" ? "My refund requests" : "Pending refund requests"
        }
        description={
          role === "customer"
            ? "Track the status of submitted refund requests."
            : "Review supporting receipt and customer details before deciding."
        }
      />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Loading refund requests...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center text-sm text-rose-600 shadow-sm">
          Failed to load refund requests. Check backend connection.
        </div>
      ) : refunds.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          No refund requests found.
        </div>
      ) : (
        <div className="grid gap-5">
          {refunds.map((refund) => {
            const amountNum = Number(refund.refund_amount ?? 0)
            const formattedAmount = Number.isNaN(amountNum)
              ? "0.00"
              : amountNum.toFixed(2)

            const requestedDate = new Date(refund.requested_at)
            const formattedDate = Number.isNaN(requestedDate.getTime())
              ? refund.requested_at
              : requestedDate.toLocaleDateString("en-SG", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })

            const isActionable =
              role !== "customer" &&
              String(refund.refund_status).toLowerCase() === "pending"

            return (
              <article
                key={refund.refund_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700">
                    <Icon name="refund" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">
                        RCP-{refund.receipt_id}
                      </h2>
                      <StatusBadge status={String(refund.refund_status)} />
                      <span className="text-xs text-slate-400">
                        Refund #{refund.refund_id}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Customer #{refund.customer_id} · Merchant #
                      {refund.merchant_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {refund.refund_reason || "No reason provided"} ·{" "}
                      {formattedDate}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xl font-semibold">${formattedAmount}</p>
                    <p className="text-xs text-slate-400">Requested amount</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewReceipt(refund)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      View receipt
                    </button>
                    {isActionable && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleDecision(refund, false)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleDecision(refund, true)}
                          className="rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
function Reports({ notify }: { notify: (message: string) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="Business intelligence"
        title="Reports & summaries"
        description="Review performance by date, cashier, and payment method."
      >
        <button
          type="button"
          onClick={() => notify("Report downloaded as PDF")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          <Icon name="download" className="size-4" />
          PDF
        </button>
        <button
          type="button"
          onClick={() => notify("Report downloaded as Excel")}
          className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Icon name="file" className="size-4" />
          Excel
        </button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Gross receipts"
          value="$82,460"
          change="+12.5%"
          icon="wallet"
        />
        <MetricCard
          label="Refund rate"
          value="1.8%"
          change="-0.3%"
          icon="refund"
        />
        <MetricCard
          label="Avg. receipt"
          value="$43.95"
          change="+3.2%"
          icon="receipt"
        />
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Cashier performance</h2>
            <p className="mt-1 text-xs text-slate-400">1–14 May 2025</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
          >
            <Icon name="calendar" className="size-4" />
            May 1 – May 14
          </button>
        </div>
        <div className="mt-6 space-y-5">
          {[
            ["Daniel Lim", "142 receipts", "$6,840.20", 84],
            ["Alicia Wong", "118 receipts", "$4,932.40", 66],
            ["Marcus Ng", "84 receipts", "$3,216.80", 43],
          ].map(([name, count, amount, width]) => (
            <div key={name}>
              <div className="mb-2 flex items-center text-sm">
                <span className="font-semibold">{name}</span>
                <span className="ml-3 text-xs text-slate-400">{count}</span>
                <span className="ml-auto font-semibold">{amount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function UserManagement({ notify }: { notify: (message: string) => void }) {
  const users = [
    {
      name: "Sophia Tan",
      email: "sophia@example.com",
      role: "Customer",
      status: "Active",
    },
    {
      name: "Daniel Lim",
      email: "daniel@commonground.sg",
      role: "Cashier",
      status: "Active",
    },
    {
      name: "Common Ground Café",
      email: "ops@commonground.sg",
      role: "Merchant",
      status: "Active",
    },
    {
      name: "Northstar Supplies",
      email: "admin@northstar.sg",
      role: "Merchant",
      status: "Pending",
    },
  ]
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="Review accounts, access status, and recent activity."
      />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.email}
                className="border-t border-slate-100 text-sm"
              >
                <td className="px-5 py-4">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{user.role}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-5 py-4 text-xs text-slate-400">
                  Today, 10:42 AM
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => notify(`${user.name} account suspended`)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function AuditLog() {
  const logs = [
    ["Merchant approved", "Admin approved Juniper Bakehouse", "2 min ago"],
    [
      "Refund reviewed",
      "Common Ground Café approved RCP-2025-0846",
      "18 min ago",
    ],
    ["Receipt imported", "Daniel Lim imported 42 receipts", "1 hr ago"],
    ["Account suspended", "Admin suspended account usr_28ab", "Yesterday"],
  ]
  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Audit log"
        description="Immutable record of sensitive actions across the platform."
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-0">
          {logs.map(([title, text, time], index) => (
            <div key={title} className="relative flex gap-4 pb-7 last:pb-0">
              {index < logs.length - 1 && (
                <span className="absolute left-5 top-10 h-full w-px bg-slate-200" />
              )}
              <div className="z-10 grid size-10 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700">
                <Icon name="shield" className="size-4" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-slate-500">{text}</p>
              </div>
              <time className="pt-1 text-xs text-slate-400">{time}</time>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
function ReceiptDrawer({
  receipt,
  onClose,
  notify,
}: {
  receipt: Receipt
  onClose: () => void
  notify: (message: string) => void
}) {
  const { data: detailedReceipt } = useReceipt(receipt.receipt_id)
  const activeReceipt = detailedReceipt ?? receipt

  const totalAmount = Number(activeReceipt.total_amount ?? 0)
  const formattedTotal = Number.isNaN(totalAmount) ? "0.00" : totalAmount.toFixed(2)
  const issuedDate = new Date(activeReceipt.issued_at)
  const hasValidDate = !Number.isNaN(issuedDate.getTime())

  const dateLabel = hasValidDate
    ? issuedDate.toLocaleDateString("en-SG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "14 May 2025"

  const timeLabel = hasValidDate
    ? issuedDate.toLocaleTimeString("en-SG", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "10:42 AM"

  const itemsList =
    Array.isArray(activeReceipt.items) && activeReceipt.items.length > 0
      ? activeReceipt.items.map((item, idx) => ({
          key: `${idx}`,
          name:
            typeof (item as { name?: unknown }).name === "string"
              ? (item as { name: string }).name
              : `Item #${idx + 1}`,
          quantity:
            typeof (item as { quantity?: unknown }).quantity === "number" ||
            typeof (item as { quantity?: unknown }).quantity === "string"
              ? String((item as { quantity: number | string }).quantity)
              : "1",
          price:
            typeof (item as { price?: unknown }).price === "number" ||
            typeof (item as { price?: unknown }).price === "string"
              ? `$${Number((item as { price: number | string }).price).toFixed(2)}`
              : `$${formattedTotal}`,
        }))
      : [
          {
            key: "fallback-1",
            name: "Iced oat latte",
            quantity: "2",
            price: "$15.00",
          },
          {
            key: "fallback-2",
            name: "Almond croissant",
            quantity: "1",
            price: "$5.80",
          },
          {
            key: "fallback-3",
            name: "Service & tax",
            quantity: "—",
            price: `$${Math.max(0, totalAmount - 20.8).toFixed(2)}`,
          },
        ]

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Digital receipt
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              RCP-{activeReceipt.receipt_id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="mt-8 rounded-2xl bg-[#103f3b] p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold">
                Common Ground Café #{activeReceipt.merchant_id}
              </p>
              <p className="mt-1 text-xs text-teal-100/60">
                21 Market Street, Singapore
              </p>
            </div>
            <StatusBadge status={String(activeReceipt.receipt_status)} />
          </div>
          <p className="mt-8 text-sm text-teal-100/70">Total paid</p>
          <p className="mt-1 text-4xl font-semibold">${formattedTotal}</p>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4">
          {[
            ["Customer", `Customer #${activeReceipt.customer_id}`],
            [
              "Cashier",
              activeReceipt.cashier_id
                ? `Cashier #${activeReceipt.cashier_id}`
                : "Daniel Lim",
            ],
            ["Date", dateLabel],
            ["Time", timeLabel],
            ["Payment", activeReceipt.payment_type || "PayNow"],
            ["Status", String(activeReceipt.receipt_status)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-100 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-slate-700">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-7">
          <h3 className="font-semibold">Items</h3>
          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {itemsList.map(({ key, name, quantity, price }) => (
              <div key={key} className="flex items-center px-4 py-3 text-sm">
                <span className="flex-1">{name}</span>
                <span className="w-12 text-slate-400">× {quantity}</span>
                <span className="font-semibold">{price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={() => notify("Receipt PDF downloaded")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <Icon name="download" className="size-4" />
            PDF
          </button>
          <button
            type="button"
            onClick={() => notify("Refund request started")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white"
          >
            <Icon name="refund" className="size-4" />
            Request refund
          </button>
        </div>
        <p className="mt-5 text-center text-[10px] leading-4 text-slate-400">
          Public verification URL: receiptiq.app/receipt/
          {activeReceipt.receipt_id}
        </p>
      </aside>
    </div>
  )
}

function ProfileModal({
  role,
  name,
  onClose,
  notify,
}: {
  role: Role
  name: string
  onClose: () => void
  notify: (message: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Account settings
            </p>
            <h2 className="mt-1 text-xl font-semibold">Your profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-teal-100 text-lg font-bold text-teal-800">
            {name
              .split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="mt-1 text-xs capitalize text-slate-400">
              {role} account
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-teal-700"
            >
              Change profile picture
            </button>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          <Field label="Display name" placeholder={name} />
          <Field
            label="Email address"
            placeholder="account@example.com"
            type="email"
          />
          <Field
            label="New password"
            placeholder="Leave blank to keep current password"
            type="password"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            notify("Profile changes saved")
            onClose()
          }}
          className="mt-6 w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white"
        >
          Save changes
        </button>
      </div>
    </div>
  )
}

export default function ReceiptApp() {
  return <AuthScreen />
}
