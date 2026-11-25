
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";

import { MenuManager } from "./menu-manager";
import { AdminOperations } from "./operations";

import {
  NavButton,
  NavigationLogoutButton,
} from "@/components/navigation-actions";

import {
  Coffee,
  Settings,
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default async function AdminPage() {
  const account = await currentAccount();

  if (!account) {
    redirect("/admin/login");
  }

  if (account.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] px-5">
        <div className="w-full max-w-md rounded-3xl border border-[#eadfd2] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5ebe0] text-[#a77b50]">
            <ShieldCheck size={30} />
          </div>

          <h1 className="mt-5 font-serif text-3xl font-bold text-[#352820]">
            Admin Access Required
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#817267]">
            You are currently signed in with a customer
            account. Please log out and use your administrator
            credentials to access this dashboard.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <NavigationLogoutButton />

            <NavButton
              href="/"
              label="Back to Home"
              icon={ArrowLeft}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#352820]">
      {/* ADMIN HEADER */}
      <header className="border-b border-[#e9e0d6] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#352820] text-white">
              <Coffee size={24} />
            </div>

            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                BrewHouse
              </h1>

              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9d7858]">
                Administration
              </p>
            </div>
          </div>

          {/* ADMIN ACCOUNT BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <NavButton
              href="/"
              label="View Website"
              icon={ArrowLeft}
            />

            <NavButton
              href="/account"
              label="Settings"
              icon={Settings}
              title={`Account settings for ${account.username}`}
            />

            <NavigationLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 lg:px-10">
        {/* DASHBOARD HEADING */}
        <section className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a77b50]">
            <LayoutDashboard size={16} />
            Admin Dashboard
          </div>

          <h2 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Café Management
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#817267]">
            Welcome back, {account.username}. Manage your
            BrewHouse menu, customer orders, reservations
            and account preferences in one place.
          </p>
        </section>

        {/* DASHBOARD NAVIGATION */}
        <nav
          aria-label="Admin dashboard sections"
          className="mb-9 flex flex-wrap gap-3 rounded-2xl border border-[#eee4d8] bg-white p-3"
        >
          <a
            href="#operations"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#352820] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#65452f]"
          >
            <ClipboardList size={17} />
            Orders & Reservations
          </a>

          <a
            href="#menu-management"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e5d9cc] px-5 py-3 text-sm font-semibold text-[#352820] transition hover:bg-[#f7f0e5]"
          >
            <UtensilsCrossed size={17} />
            Menu Management
          </a>

          <NavButton
            href="/account"
            label="Account Settings"
            icon={Settings}
          />
        </nav>

        {/* EXISTING MENU MANAGER */}
        <section
          id="menu-management"
          className="scroll-mt-8 rounded-3xl border border-[#eee4d8] bg-white p-5 shadow-sm sm:p-7"
        >
          <MenuManager />
        </section>

        {/* EXISTING ORDER AND RESERVATION MANAGEMENT */}
        <section className="mt-10">
          <AdminOperations />
        </section>
      </div>

      <footer className="mt-10 border-t border-[#e9e0d6] bg-white px-5 py-7 text-center text-xs text-[#978579]">
        BrewHouse Administration · Secure account access
      </footer>
    </main>
  );
}
