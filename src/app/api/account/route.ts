import { clearSessionCookie, currentAccount, hashPassword, hasValidOrigin, normalizeUsername, tokenHash, usernamePattern, validPassword, verifyPassword } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { databaseErrorCode, isJson, jsonObject, reply } from "@/lib/http";
import { isRecoveryQuestion, validRecoveryAnswer } from "@/lib/recovery-questions";

async function allowRecoveryAttempt(scope: string, limit: number) {
  const sql = getDatabase();
  const [row] = await sql`
    WITH cleaned AS (
      DELETE FROM recovery_request_limits WHERE window_start < NOW() - INTERVAL '1 day'
    )
    INSERT INTO recovery_request_limits (scope, window_start, attempts)
    VALUES (${scope}, date_bin(INTERVAL '15 minutes', NOW(), TIMESTAMPTZ '2000-01-01 00:00:00+00'), 1)
    ON CONFLICT (scope, window_start) DO UPDATE
      SET attempts = recovery_request_limits.attempts + 1
      WHERE recovery_request_limits.attempts < ${limit}
    RETURNING attempts
  `;
  return Boolean(row);
}

async function changePassword(id: number, authVersion: number, password: string) {
  const passwordHash = await hashPassword(password);
  const sql = getDatabase();
  const [updated] = await sql`
    WITH updated AS (
      UPDATE accounts SET password_hash = ${passwordHash}, auth_version = auth_version + 1
      WHERE id = ${id} AND auth_version = ${authVersion} RETURNING id
    ), revoked AS (
      DELETE FROM sessions WHERE account_id IN (SELECT id FROM updated)
    )
    SELECT id FROM updated
  `;
  return Boolean(updated);
}

async function recoverPassword(body: Record<string, unknown>) {
  const username = normalizeUsername(body.username);
  const { question, answer, password } = body;
  if (!usernamePattern.test(username) || !isRecoveryQuestion(question) || !validRecoveryAnswer(question, answer, true)) {
    return reply("Enter a valid username and a digits-only answer for the selected question.", 400);
  }
  if (typeof password !== "string" || !validPassword(password)) {
    return reply("New password must meet all the listed rules.", 400);
  }
  if (!await allowRecoveryAttempt("question:all", 60) ||
      !await allowRecoveryAttempt("question:" + tokenHash(username), 5)) {
    return reply("Too many recovery attempts. Try again in 15 minutes.", 429);
  }

  const sql = getDatabase();
  const [account] = await sql`
    SELECT id, role, auth_version, recovery_question, recovery_answer_hash
    FROM accounts WHERE username = ${username}
  `;
  const allowedPinLength = question !== "pin" || answer.length >= 8 || account?.role === "admin";
  const matches = await verifyPassword(answer,
    allowedPinLength && account?.recovery_question === question ? account.recovery_answer_hash : undefined);
  if (!matches || !account) return reply("The recovery details could not be verified.", 403);

  const passwordHash = await hashPassword(password);
  const [updated] = await sql`
    WITH updated AS (
      UPDATE accounts SET password_hash = ${passwordHash}, auth_version = auth_version + 1
      WHERE id = ${account.id} AND auth_version = ${account.auth_version}
        AND username = ${username} AND recovery_answer_hash = ${account.recovery_answer_hash}
      RETURNING id
    ), revoked AS (
      DELETE FROM sessions WHERE account_id IN (SELECT id FROM updated)
    )
    SELECT id FROM updated
  `;
  if (!updated) return reply("The recovery details could not be verified.", 403);
  return reply("Password reset. Sign in with your new password.", 200);
}

export async function POST(request: Request) {
  if (!hasValidOrigin(request)) return reply("Request origin is invalid.", 403);
  if (!isJson(request)) return reply("Send a JSON request.", 415);

  try {
    const body = await jsonObject(request);
    if (!body) return reply("Send a valid JSON object.", 400);
    if (body.action === "reset") return await recoverPassword(body);

    const session = await currentAccount();
    if (!session) return reply("Sign in to update your account.", 401);
    if (!["username", "password", "recovery"].includes(body.action)) return reply("Unknown account action.", 400);
    if (typeof body.currentPassword !== "string" || body.currentPassword.length > 256) {
      return reply("Enter your current password.", 400);
    }

    const sql = getDatabase();
    const [account] = await sql`
      SELECT id, role, password_hash, auth_version
      FROM accounts WHERE id = ${session.id} AND auth_version = ${session.auth_version}
    `;
    if (!account || !await verifyPassword(body.currentPassword, account.password_hash, account.role === "admin")) {
      return reply("The current password is incorrect or your session has ended.", 403);
    }

    if (body.action === "recovery") {
      const { question, answer } = body;
      if (!isRecoveryQuestion(question) || !validRecoveryAnswer(question, answer)) {
        return reply("Enter a digits-only answer in the format shown for the selected question.", 400);
      }
      const answerHash = await hashPassword(answer);
      const [updated] = await sql`
        UPDATE accounts SET recovery_question = ${question}, recovery_answer_hash = ${answerHash}
        WHERE id = ${account.id} AND auth_version = ${account.auth_version} RETURNING id
      `;
      if (!updated) return reply("Your session has ended. Sign in again.", 401);
      return reply("Recovery question saved.", 200);
    }

    if (body.action === "username") {
      const username = normalizeUsername(body.username);
      if (!usernamePattern.test(username)) return reply("Use 3 to 32 letters, digits, or underscores.", 400);
      const [updated] = await sql`
        UPDATE accounts SET username = ${username}
        WHERE id = ${account.id} AND auth_version = ${account.auth_version} RETURNING id
      `;
      if (!updated) return reply("Your session has ended. Sign in again.", 401);
      return reply("Username updated.", 200, { username });
    }

    if (typeof body.password !== "string" || !validPassword(body.password)) {
      return reply("New password must meet all the listed rules.", 400);
    }
    if (!await changePassword(account.id, account.auth_version, body.password)) {
      return reply("Your session has ended. Sign in again.", 401);
    }
    await clearSessionCookie();
    return reply("Password changed. Sign in again with your new password.", 200);
  } catch (error) {
    if (databaseErrorCode(error) === "23505") return reply("That username is already in use.", 409);
    console.error("A BrewHouse account request failed.", databaseErrorCode(error) ?? "internal");
    return reply("Could not complete the account request. Please try again.", 500);
  }
}
