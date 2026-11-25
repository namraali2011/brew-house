import { NextResponse } from "next/server";
import { currentAccount, hasValidOrigin } from "./auth";

export function reply(message: string, status: number, data?: unknown) {
  return NextResponse.json(
    { success: status < 400, message, data },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function adminWriteGuard(request: Request) {
  const account = await currentAccount();
  if (!account) return reply("Sign in to manage the menu.", 401);
  if (account.role !== "admin") return reply("An admin account is required.", 403);
  if (!hasValidOrigin(request)) return reply("Request origin is invalid.", 403);
  if (!isJson(request)) return reply("Send a JSON request.", 415);
}

export function isJson(request: Request) {
  return request.headers.get("content-type")?.split(";")[0] === "application/json";
}

export async function jsonObject(request: Request) {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

export function databaseErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? error.code : undefined;
}
