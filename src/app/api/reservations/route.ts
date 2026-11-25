
import {
  currentAccount,
  hasValidOrigin,
} from "@/lib/auth";
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

// Customer sees tables and only active,
// non-expired reservations belonging to them.
export async function GET() {
  try {
    const account = await currentAccount();

    if (!account) {
      return reply("Please sign in.", 401);
    }

    if (account.role !== "customer") {
      return reply("Customer access required.", 403);
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
        AND r.status = 'active'
        AND r.ends_at > NOW()
      ORDER BY r.starts_at DESC
      LIMIT 30
    `;

    return reply(
      "Active reservations loaded.",
      200,
      { tables, reservations }
    );
  } catch (error) {
    console.error("Reservation GET failed:", error);
    return reply("Could not load reservations.", 500);
  }
}

// Create a reservation using the configured slot length.
export async function POST(request: Request) {
  if (!hasValidOrigin(request)) {
    return reply("Invalid request origin.", 403);
  }

  if (!isJson(request)) {
    return reply("JSON required.", 415);
  }

  try {
    const account = await currentAccount();

    if (!account) {
      return reply("Please sign in.", 401);
    }

    if (account.role !== "customer") {
      return reply("Customer access required.", 403);
    }

    const body = await jsonObject(request);

    if (!body) {
      return reply("Invalid request.", 400);
    }

    const { table_id, party_size, starts_at } = body;

    if (
      !validId(table_id) ||
      !Number.isInteger(party_size) ||
      party_size < 1 ||
      party_size > 20 ||
      typeof starts_at !== "string" ||
      !/Z$/.test(starts_at) ||
      !Number.isFinite(Date.parse(starts_at))
    ) {
      return reply(
        "Enter a valid table, guest count and booking date.",
        400
      );
    }

    const sql = getDatabase();

    const [created] = await sql`
      INSERT INTO reservations (
        account_id,
        table_id,
        party_size,
        starts_at,
        ends_at,
        status
      )
      SELECT
        ${account.id},
        t.id,
        ${party_size},
        ${starts_at}::timestamptz,
        ${starts_at}::timestamptz
          + s.slot_minutes * INTERVAL '1 minute',
        'active'
      FROM cafe_tables t
      CROSS JOIN booking_settings s
      WHERE s.singleton = TRUE
        AND s.enabled = TRUE
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
        "Booking unavailable. Check the table, capacity, date and booking settings.",
        400
      );
    }

    return reply(
      "Your table reservation is confirmed.",
      201,
      created
    );
  } catch (error) {
    if (databaseErrorCode(error) === "23P01") {
      return reply(
        "This table is already reserved during the selected time.",
        409
      );
    }

    if (databaseErrorCode(error) === "23503") {
      return reply("The selected table is unavailable.", 409);
    }

    console.error(
      "Reservation POST failed:",
      databaseErrorCode(error) ?? "unknown"
    );

    return reply("Could not reserve the table.", 500);
  }
}
