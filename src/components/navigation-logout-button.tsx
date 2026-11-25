
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  LogOut,
  Loader2,
} from "lucide-react";

const logoutStyle =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ebd4cf] bg-[#fbf0ed] px-5 py-3 text-sm font-semibold text-[#a15243] transition-all duration-200 hover:bg-[#f3e0dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a15243]";

export function NavigationLogoutButton() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not log out.");
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Logout failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={logout}
        className={`${logoutStyle} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {busy ? (
          <Loader2
            size={17}
            className="animate-spin"
          />
        ) : (
          <LogOut size={17} />
        )}

        {busy ? "Signing Out..." : "Log Out"}
      </button>

      {error && (
        <p
          role="alert"
          className="text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
