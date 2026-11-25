
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentAccount } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
    passwordChanged?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const account = await currentAccount();
  const params = await searchParams;

  // Only customers are redirected from customer login.
  // Administrators must never be redirected to
  // the admin panel from this page.
  if (account?.role === "customer") {
    redirect("/");
  }

  return (
    <AuthForm
      mode="login"
      registered={params.registered === "1"}
      passwordChanged={params.passwordChanged === "1"}
    />
  );
}
