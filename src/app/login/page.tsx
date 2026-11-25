import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const account = await currentAccount();
  if (account) redirect(account.role === "admin" ? "/admin" : "/");
  return <AuthForm mode="login" registered={(await searchParams).registered === "1"} />;
}
