import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { LogoutButton } from "@/components/auth-form";
import { MenuManager } from "./menu-manager";

export default async function AdminPage() {
  const account = await currentAccount();
  if (!account) redirect("/admin/login");
  if (account.role !== "admin") {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-6 py-12">
        <h1 className="font-serif text-4xl">Admin Access Required</h1>
        <Link href="/admin/login" className="block underline">Admin Login</Link>
        <Link href="/" className="block underline">Back to the public menu</Link>
        <LogoutButton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/#menu" className="text-sm underline">View Public Menu</Link>
          <h1 className="mt-3 font-serif text-4xl font-semibold">Manage Menu</h1>
        </div>
        <div className="flex items-center gap-4">
          <span>{account.username}</span>
          <LogoutButton />
        </div>
      </header>
      <MenuManager />
    </main>
  );
}
