
import { NextRequest, NextResponse } from "next/server";

import {
  endSession,
  hasValidOrigin,
  hashPassword,
  normalizeUsername,
  startSession,
  usernamePattern,
  validPassword,
  verifyPassword,
} from "@/lib/auth";

import { getDatabase } from "@/lib/db";

import {
  isRecoveryQuestion,
  validRecoveryAnswer,
} from "@/lib/recovery-questions";

function reply(
  message: string,
  status: number,
  destination?: string
) {
  return NextResponse.json(
    { message, destination },
    { status }
  );
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ action: string }>;
  }
) {
  const { action } = await context.params;

  if (!hasValidOrigin(request)) {
    return reply("Invalid request origin.", 403);
  }

  try {
    // LOGOUT
    if (action === "logout") {
      await endSession();

      return reply(
        "Successfully logged out.",
        200,
        "/"
      );
    }

    if (action !== "login" && action !== "register") {
      return reply("Unknown authentication action.", 404);
    }

    if (
      request.headers.get("content-type")?.split(";")[0] !==
      "application/json"
    ) {
      return reply("JSON request required.", 415);
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return reply("Invalid request.", 400);
    }

    const username = normalizeUsername(body.username);
    const password = body.password;

    // Only explicit admin login requests use admin mode.
    const adminLogin = body.admin === true;

    if (
      !usernamePattern.test(username) ||
      typeof password !== "string" ||
      password.length > 256
    ) {
      return reply(
        "Invalid username or password.",
        401
      );
    }

    const sql = getDatabase();

    // CUSTOMER REGISTRATION
    if (action === "register") {
      if (!validPassword(password)) {
        return reply(
          "Password does not meet security requirements.",
          400
        );
      }

      const { question, answer } = body;

      if (
        !isRecoveryQuestion(question) ||
        !validRecoveryAnswer(question, answer)
      ) {
        return reply(
          "Choose a valid security question and answer.",
          400
        );
      }

      const [passwordHash, answerHash] =
        await Promise.all([
          hashPassword(password),
          hashPassword(answer),
        ]);

      const [account] = await sql`
        INSERT INTO accounts (
          username,
          password_hash,
          role,
          recovery_question,
          recovery_answer_hash
        )
        VALUES (
          ${username},
          ${passwordHash},
          'customer',
          ${question},
          ${answerHash}
        )
        ON CONFLICT (username) DO NOTHING
        RETURNING id
      `;

      if (!account) {
        return reply(
          "This username is already registered.",
          409
        );
      }

      return reply(
        "Customer account created successfully.",
        201,
        "/login?registered=1"
      );
    }

    // LOGIN
    const [account] = await sql`
      SELECT
        id,
        username,
        role,
        password_hash,
        auth_version
      FROM accounts
      WHERE username = ${username}
    `;

    const passwordValid = await verifyPassword(
      password,
      account?.password_hash,
      account?.role === "admin"
    );

    if (!account || !passwordValid) {
      return reply(
        "Invalid username or password.",
        401
      );
    }

    // STRICT ROLE VALIDATION
    // Customer credentials cannot use admin login.
    // Admin credentials cannot use customer login.

    if (adminLogin) {
      if (account.role !== "admin") {
        return reply(
          "This account is not authorized for administrator login.",
          403
        );
      }
    } else {
      if (account.role !== "customer") {
        return reply(
          "Invalid Credentials.",
          403
        );
      }
    }

    // Session is created only AFTER successful role validation.
    await startSession(
      account.id,
      account.auth_version
    );

    return reply(
      "Login successful.",
      200,
      adminLogin ? "/admin" : "/"
    );
  } catch (error) {
    console.error(
      "Authentication failed:",
      error
    );

    return reply(
      "Authentication is temporarily unavailable.",
      500
    );
  }
}
