"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { RecoveryFields } from "./recovery-fields";

type Action = "username" | "password" | "recovery" | "reset";
const input = "mt-1 block w-full rounded-lg border border-[#cdbca7] bg-white p-3";
const button = "rounded-full bg-[#38271e] px-5 py-2.5 text-white disabled:opacity-60";

const labels: Record<Action, string> = {
  username: "Save Username",
  password: "Change Password",
  recovery: "Save Recovery Question",
  reset: "Reset Password",
};

export function AccountForm({ action, username }: { action: Action; username?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const currentPassword = action === "username" || action === "password" || action === "recovery";
  const newPassword = action === "password" || action === "reset";
  const usesRecovery = action === "recovery" || action === "reset";
  const [recoveryFormVersion, setRecoveryFormVersion] = useState(0);
  const rulesId = action + "-password-rules";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "The request failed. Please try again.");
        return;
      }
      if (action === "password") {
        router.replace("/login?passwordChanged=1");
        router.refresh();
        return;
      }
      setMessage(result.message);
      if (action === "username") {
        const current = form.elements.namedItem("currentPassword") as HTMLInputElement;
        current.value = "";
        router.refresh();
      } else {
        form.reset();
      }
      if (action === "recovery") {
        setRecoveryFormVersion((version) => version + 1);
        router.refresh();
      } else if (action === "reset") {
        setComplete(true);
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!complete && (
        <form onSubmit={submit} className="space-y-4">
          {(action === "username" || action === "reset") && (
            <label className="block">
              Username
              <input name="username" defaultValue={username} required autoComplete="username" className={input} />
            </label>
          )}
          {usesRecovery && <RecoveryFields key={recoveryFormVersion} inputClass={input} resetting={action === "reset"} />}
          {currentPassword && (
            <label className="block">
              Current password
              <input name="currentPassword" type="password" required autoComplete="current-password" className={input} />
            </label>
          )}
          {newPassword && (
            <>
              <label className="block">
                New password
                <input name="password" type="password" required autoComplete="new-password"
                  aria-describedby={rulesId} className={input} />
              </label>
              <p id={rulesId} className="text-sm">
                Use 5–32 characters with an uppercase letter, a lowercase letter, a number, and a special character.
              </p>
            </>
          )}
          <button disabled={busy} className={button}>{busy ? "Please wait…" : labels[action]}</button>
        </form>
      )}
      {message && <p className="mt-4 text-green-800" role="status">{message}</p>}
      {error && <p className="mt-4 text-red-700" role="alert">{error}</p>}
      {complete && (
        <Link href="/login" className="mt-4 inline-block underline">
          Sign In
        </Link>
      )}
    </div>
  );
}
