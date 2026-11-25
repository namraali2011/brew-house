import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";

export default async function RegisterPage() {
  const account = await currentAccount();
  if (account) redirect("/");
  return <AuthForm mode="register" />;
}
