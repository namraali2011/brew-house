
import { redirect } from "next/navigation";

import { currentAccount } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

import { AccountForm } from "@/components/account-form";

import {
  NavButton,
  NavigationLogoutButton,
} from "@/components/navigation-actions";

import {
  isRecoveryQuestion,
  recoveryQuestions,
} from "@/lib/recovery-questions";

import {
  Settings,
  UserRound,
  LockKeyhole,
  ShieldQuestion,
  ArrowLeft,
  Coffee,
} from "lucide-react";

export default async function AccountPage() {
  const account = await currentAccount();

  if (!account) {
    redirect("/login");
  }

  const sql = getDatabase();

  const [profile] = await sql`
    SELECT recovery_question
    FROM accounts
    WHERE id = ${account.id}
  `;

  const isAdmin = account.role === "admin";

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#352820]">
      {/* HEADER */}
      <header className="border-b border-[#e9e0d6] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#352820] text-white">
              <Coffee size={22} />
            </div>

            <div>
              <p className="font-serif text-2xl font-bold">
                BrewHouse
              </p>

              <p className="text-[10px] uppercase tracking-[0.2em] text-[#a77b50]">
                {isAdmin
                  ? "Administrator Settings"
                  : "Customer Account"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <NavButton
              href={isAdmin ? "/admin" : "/"}
              label={isAdmin ? "Dashboard" : "Home"}
              icon={ArrowLeft}
            />

            <NavigationLogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12">
        {/* PAGE INTRO */}
        <div className="mb-9">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#a77b50]">
            {isAdmin ? (
              <Settings size={16} />
            ) : (
              <UserRound size={16} />
            )}
            {isAdmin ? "Admin Preferences" : "Your Profile"}
          </div>

          <h1 className="mt-3 font-serif text-4xl font-bold">
            {isAdmin ? "Admin Settings" : "My Account"}
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#817267]">
            Signed in as{" "}
            <strong className="text-[#352820]">
              {account.username}
            </strong>
            . Manage your username, password and account
            recovery preferences below.
          </p>
        </div>

        <div className="space-y-6">
          {/* USERNAME SETTINGS */}
          <section className="rounded-3xl border border-[#eee4d8] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-xl bg-[#f4eae0] p-3 text-[#a77b50]">
                <UserRound size={22} />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Change Username
                </h2>

                <p className="mt-1 text-sm text-[#817267]">
                  Update your account username.
                </p>
              </div>
            </div>

            <AccountForm
              action="username"
              username={account.username}
            />
          </section>

          {/* PASSWORD SETTINGS */}
          <section className="rounded-3xl border border-[#eee4d8] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-xl bg-[#f4eae0] p-3 text-[#a77b50]">
                <LockKeyhole size={22} />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Change Password
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#817267]">
                  Changing your password will sign you out
                  of all existing sessions.
                </p>
              </div>
            </div>

            <AccountForm action="password" />
          </section>

          {/* RECOVERY SETTINGS */}
          <section className="rounded-3xl border border-[#eee4d8] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-xl bg-[#f4eae0] p-3 text-[#a77b50]">
                <ShieldQuestion size={22} />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Security Question
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#817267]">
                  {isRecoveryQuestion(profile?.recovery_question)
                    ? recoveryQuestions[
                        profile.recovery_question
                      ].label
                    : "Set up a security question to recover your password."}
                </p>

                <p className="mt-2 text-xs leading-6 text-[#9b8878]">
                  A private recovery PIN is harder to guess
                  than personal information.
                </p>
              </div>
            </div>

            <AccountForm action="recovery" />
          </section>
        </div>

        <div className="mt-9 text-center text-xs text-[#a18b79]">
          BrewHouse · Account Security & Preferences
        </div>
      </div>
    </main>
  );
}
