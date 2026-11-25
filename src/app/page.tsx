
import Home from "@/components/home";
import { currentAccount } from "@/lib/auth";

import {
  NavButton,
  NavigationLogoutButton,
} from "@/components/navigation-actions";

import {
  CalendarDays,
  ShoppingBag,
  UserRound,
  UserPlus,
  LogIn,
  ShieldCheck,
  LayoutDashboard,
  Settings,
} from "lucide-react";

export default async function Page() {
  const account = await currentAccount();

  return (
    <Home
      accountControls={
        <div className="border-t border-[#ece3d7] bg-[#faf7f2]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-12">

            {/* PRIMARY CUSTOMER ACTIONS */}
            <div className="flex flex-wrap items-center gap-2.5">
              <NavButton
                href="/dine#booking"
                label="Book a Table"
                icon={CalendarDays}
                variant="primary"
              />

              <NavButton
                href="/dine#order-form"
                label="Order Now"
                icon={ShoppingBag}
              />
            </div>

            {/* AUTHENTICATION AND ACCOUNT CONTROLS */}
            <div className="flex flex-wrap items-center gap-2.5">

              {account?.role === "admin" ? (
                <>
                  <NavButton
                    href="/admin"
                    label="Dashboard"
                    icon={LayoutDashboard}
                    variant="primary"
                  />

                  <NavButton
                    href="/account"
                    label="Settings"
                    icon={Settings}
                    title={`Admin account settings — ${account.username}`}
                  />

                  <NavigationLogoutButton />
                </>
              ) : account?.role === "customer" ? (
                <>
                  <NavButton
                    href="/account"
                    label="My Account"
                    icon={UserRound}
                    title={`Signed in as ${account.username}`}
                  />

                  <NavigationLogoutButton />
                </>
              ) : (
                <>
                  <NavButton
                    href="/login"
                    label="Log In"
                    icon={LogIn}
                  />

                  <NavButton
                    href="/register"
                    label="Sign Up"
                    icon={UserPlus}
                    variant="primary"
                  />

                  <NavButton
                    href="/admin/login"
                    label="Admin"
                    icon={ShieldCheck}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
