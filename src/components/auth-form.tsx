"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please try again.");
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={logout} disabled={busy} className="underline">
        {busy ? "Signing out…" : "Log Out"}
      </button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>
  );
}

const inputClass = "mt-1 block w-full rounded-lg border border-[#cdbca7] bg-white p-3";

export function AuthForm({ mode, registered = false }: {
  mode: "login" | "register" | "admin";
  registered?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const register = mode === "register";
  const title = register ? "Create an Account" : mode === "admin" ? "Admin Login" : "Log In";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    try {
      const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          admin: mode === "admin",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "The request failed. Please try again.");
        return;
      }
      router.replace(result.destination);
      router.refresh();
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-14">
      <Link href="/" className="text-sm underline">Back to BrewHouse</Link>
      <h1 className="mt-5 font-serif text-4xl font-semibold">{title}</h1>
      {registered && <p role="status" className="mt-4 text-green-800">Account created. Sign in to continue.</p>}
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block font-medium">
          Username
          <input name="username" required autoComplete="username" className={inputClass}
            aria-describedby={register ? "username-rules" : undefined} />
        </label>
        {register && <p id="username-rules" className="text-sm">Use 3–32 letters, numbers, or underscores. Usernames are stored in lowercase.</p>}
        <label className="block font-medium">
          Password
          <input name="password" required type="password" autoComplete={register ? "new-password" : "current-password"}
            aria-describedby={register ? "password-rules" : undefined} className={inputClass} />
        </label>
        {register && (
          <ul id="password-rules" className="list-disc pl-5 text-sm">
            <li>12–128 characters</li>
            <li>At least one uppercase letter and one lowercase letter (A–Z and a–z)</li>
            <li>At least one number (0–9)</li>
            <li>At least one special character, such as ! or #</li>
          </ul>
        )}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button disabled={busy} className="rounded-full bg-[#38271e] px-6 py-3 font-semibold text-white disabled:opacity-60">
          {busy ? "Please wait…" : register ? "Register" : "Log In"}
        </button>
      </form>
      {mode !== "admin" && (
        <Link href={register ? "/login" : "/register"} className="mt-6 inline-block text-sm underline">
          {register ? "Already have an account? Log in" : "Create a customer account"}
        </Link>
      )}
    </main>
  );
}
