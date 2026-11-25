import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/account-form";
import { LogoutButton } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";
import { isRecoveryQuestion, recoveryQuestions } from "@/lib/recovery-questions";
import { getDatabase } from "@/lib/db";

export default async function AccountPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");

  const sql = getDatabase();
  const [profile] = await sql`SELECT recovery_question FROM accounts WHERE id = ${account.id}`;

  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href={account.role === "admin" ? "/admin" : "/"} className="underline">Back to {account.role === "admin" ? "Admin" : "BrewHouse"}</Link>
        <LogoutButton />
      </header>
      <h1 className="font-serif text-4xl font-semibold">Account</h1>
      <section className="space-y-4 rounded-2xl bg-[#f7f0e5] p-5">
        <h2 className="font-serif text-2xl">Change Username</h2>
        <AccountForm action="username" username={account.username} />
      </section>
      <section className="space-y-4 rounded-2xl bg-[#f7f0e5] p-5">
        <h2 className="font-serif text-2xl">Change Password</h2>
        <p className="text-sm">Changing your password signs you out on all devices.</p>
        <AccountForm action="password" />
      </section>
      <section className="space-y-4 rounded-2xl bg-[#f7f0e5] p-5">
        <h2 className="font-serif text-2xl">Security Question</h2>
        <p className="text-sm">{isRecoveryQuestion(profile?.recovery_question) ? recoveryQuestions[profile.recovery_question].label : "Set a security question to enable password recovery."}</p>
        <p className="text-sm">A private PIN is harder to guess than a date of birth, phone number, or house number.</p>
        <AccountForm action="recovery" />
      </section>
    </main>
  );
}
