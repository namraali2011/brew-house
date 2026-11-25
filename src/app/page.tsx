
import Link from "next/link";
import Home from "@/components/home";
import { LogoutButton } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";
import { CalendarDays, ShoppingBag } from "lucide-react";

export default async function Page() {
  const account = await currentAccount();

  return (
    <Home
      accountControls={
        <div className="border-t border-[#e9dece] bg-[#fffdf8]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-12">

            {/* BOOKING AND ORDERING BUTTONS */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dine#booking"
                className="inline-flex items-center gap-2 rounded-full bg-[#38271e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#65452f]"
              >
                <CalendarDays size={17} />
                Book a Table
              </Link>

              <Link
                href="/dine#order-form"
                className="inline-flex items-center gap-2 rounded-full border border-[#38271e] px-5 py-3 text-sm font-semibold text-[#38271e] transition hover:bg-[#f1e8db]"
              >
                <ShoppingBag size={17} />
                Order Now
              </Link>
            </div>

            {/* ACCOUNT NAVIGATION */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-[#5c4a3d]">

              <Link
                href="/admin/login"
                className="transition hover:text-[#a77b50]"
              >
                Admin Login
              </Link>

              {account?.role === "admin" && (
                <Link
                  href="/admin"
                  className="font-semibold text-[#8d6546] underline"
                >
                  Manage Menu
                </Link>
              )}

              {account ? (
                <>
                  <Link
                    href="/account"
                    className="transition hover:text-[#a77b50]"
                  >
                    My Account ({account.username})
                  </Link>

                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="transition hover:text-[#a77b50]"
                  >
                    Log In
                  </Link>

                  <Link
                    href="/register"
                    className="transition hover:text-[#a77b50]"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      }
    />
  );
}
