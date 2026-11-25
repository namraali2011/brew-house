import { NextRequest, NextResponse } from "next/server";
import { endSession, hasValidOrigin, hashPassword, normalizeUsername, startSession, usernamePattern, validPassword, verifyPassword } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { isRecoveryQuestion, validRecoveryAnswer } from "@/lib/recovery-questions";

function reply(message: string, status: number, destination?: string) {
  return NextResponse.json({ message, destination }, { status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;

  // Browser writes must come from this site. JSON callers can omit Origin.
  if (!hasValidOrigin(request)) {
    return reply("Request origin is invalid.", 403);
  }

  try {
    if (action === "logout") {
      await endSession();
      return reply("Signed out.", 200, "/");
    }

    if (action !== "login" && action !== "register") {
      return reply("Unknown action.", 404);
    }

    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
      return reply("Send a JSON request.", 415);
    }
    const body = await request.json().catch(() => null);
    const username = normalizeUsername(body?.username);
    const password = body?.password;
    const adminLogin = body?.admin === true;

    if (action === "register" && !usernamePattern.test(username)) {
      return reply("Use 3–32 letters, numbers, or underscores for the username.", 400);
    }
    if (action === "register" && (typeof password !== "string" || !validPassword(password))) {
      return reply("Password must meet all the listed rules.", 400);
    }
    if (!usernamePattern.test(username) || typeof password !== "string" || password.length > 256) {
      return reply("Invalid username or password.", 401);
    }

    const sql = getDatabase();
    if (action === "register") {
      const { question, answer } = body;
      if (!isRecoveryQuestion(question) || !validRecoveryAnswer(question, answer)) {
        return reply("Choose a security question and enter a digits-only answer in the format shown.", 400);
      }

      const [passwordHash, answerHash] = await Promise.all([hashPassword(password), hashPassword(answer)]);
      const [account] = await sql`
        INSERT INTO accounts (username, password_hash, role, recovery_question, recovery_answer_hash)
        VALUES (${username}, ${passwordHash}, 'customer', ${question}, ${answerHash})
        ON CONFLICT (username) DO NOTHING
        RETURNING id
      `;
      if (!account) return reply("That username is already registered.", 409);
      return reply("Account created. Sign in to continue.", 201, "/login?registered=1");
    }

    const [account] = await sql`
      SELECT id, role, password_hash, auth_version FROM accounts WHERE username = ${username}
    `;
    if (!(await verifyPassword(password, account?.password_hash, account?.role === "admin"))) {
      return reply("Invalid username or password.", 401);
    }
    if (adminLogin && account.role !== "admin") {
      return reply("An admin account is required.", 403);
    }

    await startSession(account.id, account.auth_version);
    return reply("Signed in.", 200, account.role === "admin" ? "/admin" : "/");
  } catch (error) {
    console.error("Authentication request failed:", error);
    return reply("Authentication is temporarily unavailable.", 500);
  }
}
