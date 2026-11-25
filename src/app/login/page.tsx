import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string; passwordChanged?: string }> }) {
  const account = await currentAccount();
  if (account) redirect(account.role === "admin" ? "/admin" : "/");
  const params = await searchParams;
  return <AuthForm mode="login" registered={params.registered === "1"} passwordChanged={params.passwordChanged === "1"} />;
}
