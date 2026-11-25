import Link from "next/link";
import Home from "@/components/home";
import { LogoutButton } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";

export default async function Page() {
  const account = await currentAccount();

  return (
    <Home accountControls={
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-x-5 gap-y-2 px-6 pb-3 text-sm font-medium lg:px-12">
        <Link href="/admin/login" target="_blank" rel="noopener noreferrer">Admin Login</Link>
        {account?.role === "admin" && <Link href="/admin">Manage Menu</Link>}
        {account ? (
          <>
            <span>{account.username}</span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login">Log In</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    } />
  );
}
