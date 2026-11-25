
import { currentAccount, hasValidOrigin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import {
  databaseErrorCode,
  isJson,
  jsonObject,
  reply,
} from "@/lib/http";
import { validId } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: Show available tables and customer reservations
export async function GET() {
  try {
    const account = await currentAccount();

    if (!account) {
      return reply("Please sign in.", 401);
    }

    const sql = getDatabase();

    const tables = await sql`
      SELECT id, label, seats
      FROM cafe_tables
      ORDER BY id
    `;

    const reservations = await sql`
      SELECT
        r.id,
        t.label AS table_label,
        r.party_size,
        r.starts_at,
        r.ends_at,
        r.created_at
      FROM reservations r
      JOIN cafe_tables t ON t.id = r.table_id
      WHERE r.account_id = ${account.id}
      ORDER BY r.starts_at DESC
      LIMIT 30
    `;

    return reply(
      "Reservations loaded.",
      200,
      { tables, reservations }
    );
  } catch (error) {
    console.error(
      "Reservation read failed:",
      databaseErrorCode(error) ?? "unknown"
    );

    return reply("Could not load reservations.", 500);
  }
}

// POST: Create a table reservation
export async function POST(request: Request) {
  if (!hasValidOrigin(request)) {
    return reply("Request origin is invalid.", 403);
  }

  if (!isJson(request)) {
    return reply("Send JSON.", 415);
  }

  try {
    const account = await currentAccount();

    if (!account) {
      return reply("Please sign in.", 401);
    }

    if (account.role !== "customer") {
      return reply(
        "Use a customer account for reservations.",
        403
      );
    }

    const body = await jsonObject(request);

    if (!body) {
      return reply("Invalid request.", 400);
    }

    const { table_id, party_size, starts_at } = body;

    if (
      !validId(table_id) ||
      !Number.isInteger(party_size) ||
      (party_size as number) < 1 ||
      (party_size as number) > 20 ||
      typeof starts_at !== "string" ||
      !/Z$/.test(starts_at) ||
      !Number.isFinite(Date.parse(starts_at))
    ) {
      return reply(
        "Choose a table, party size and valid date/time.",
        400
      );
    }

    const sql = getDatabase();

    // Database time is authoritative.
    // Customer device time cannot bypass these checks.
    const [created] = await sql`
      INSERT INTO reservations (
        account_id,
        table_id,
        party_size,
        starts_at,
        ends_at
      )
      SELECT
        ${account.id},
        t.id,
        ${party_size},
        ${starts_at}::timestamptz,
        ${starts_at}::timestamptz
          + s.slot_minutes * INTERVAL '1 minute'
      FROM cafe_tables t
      CROSS JOIN booking_settings s
      WHERE
        s.singleton
        AND s.enabled
        AND t.id = ${table_id}
        AND t.seats >= ${party_size}
        AND ${starts_at}::timestamptz > NOW()
        AND ${starts_at}::timestamptz
          <= NOW() + INTERVAL '30 days'
      RETURNING
        id,
        table_id,
        party_size,
        starts_at,
        ends_at,
        created_at
    `;

    if (!created) {
      return reply(
        "Booking unavailable. Check settings, table capacity and date (within 30 days).",
        400
      );
    }

    return reply(
      "Table reserved successfully.",
      201,
      created
    );
  } catch (error) {
    if (databaseErrorCode(error) === "23P01") {
      return reply(
        "That table is already reserved during this time.",
        409
      );
    }

    if (databaseErrorCode(error) === "23503") {
      return reply(
        "That table is no longer available.",
        409
      );
    }

    console.error(
      "Reservation write failed:",
      databaseErrorCode(error) ?? "unknown"
    );

    return reply(
      "Could not create the reservation.",
      500
    );
  }
}
