import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";

export default async function AdminLoginPage() {
  const account = await currentAccount();
  if (account?.role === "admin") redirect("/admin");
  return <AuthForm mode="admin" />;
}
