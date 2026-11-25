import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getDatabase } from "./db";

const deriveKey = promisify(scrypt);
const sessionCookie = "brewhouse_session";
const sessionSeconds = 60 * 60 * 24 * 7;

export function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export const usernamePattern = /^[a-z0-9_]{3,32}$/;

export function validPassword(value: string) {
  return /^[\s\S]{12,128}(?![\s\S])/u.test(value) &&
    /[A-Z]/.test(value) && /[a-z]/.test(value) &&
    /[0-9]/.test(value) && /[^A-Za-z0-9\s]/u.test(value);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt, 64) as Buffer;
  return salt + ":" + key.toString("hex");
}

export async function verifyPassword(password: string, stored?: string, allowPlaintext = false) {
  const hash = typeof stored === "string"
    ? /^([0-9a-f]{32}):([0-9a-f]{128})(?![\s\S])/.exec(stored)
    : null;

  // Keep the password derivation cost for unknown users and plaintext admin accounts.
  const key = await deriveKey(password, hash?.[1] ?? "0".repeat(32), 64) as Buffer;
  if (hash) return timingSafeEqual(key, Buffer.from(hash[2], "hex"));
  if (!allowPlaintext || typeof stored !== "string" || stored.length === 0) return false;

  return timingSafeEqual(
    createHash("sha256").update(password).digest(),
    createHash("sha256").update(stored).digest(),
  );
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type Account = { id: number; username: string; role: "customer" | "admin" };

export async function currentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;

  const sql = getDatabase();
  const [account] = await sql`
    SELECT accounts.id, accounts.username, accounts.role
    FROM sessions JOIN accounts ON accounts.id = sessions.account_id
    WHERE sessions.token_hash = ${tokenHash(token)} AND sessions.expires_at > NOW()
  `;
  return (account as Account | undefined) ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) {
    const sql = getDatabase();
    await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash(token)}`;
  }
  jar.delete(sessionCookie);
}

export async function startSession(accountId: number) {
  await endSession();
  const token = randomBytes(32).toString("hex");
  const sql = getDatabase();
  await sql`
    INSERT INTO sessions (token_hash, account_id, expires_at)
    VALUES (${tokenHash(token)}, ${accountId}, NOW() + ${sessionSeconds} * INTERVAL '1 second')
  `;
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionSeconds,
  });
}



export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const url = new URL(request.url);
  // Next.js can use its listening hostname in request.url.
  const host = request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? url.protocol.slice(0, -1);
  return origin === protocol + "://" + host;
}
