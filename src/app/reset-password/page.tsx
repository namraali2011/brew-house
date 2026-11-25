import Link from "next/link";
import { AccountForm } from "@/components/account-form";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-14">
      <Link href="/login" className="text-sm underline">Back to Sign In</Link>
      <h1 className="font-serif text-4xl font-semibold">Reset Password</h1>
      <p>Enter your username and answer the security question you set in your account.</p>
      <AccountForm action="reset" />
    </main>
  );
}
