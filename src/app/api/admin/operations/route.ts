
import { currentAccount, hasValidOrigin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { isJson, jsonObject, reply } from "@/lib/http";
import { validId } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const account = await currentAccount();
  return account?.role === "admin";
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return reply("Administrator access required.", 403);
    }

    const sql = getDatabase();

    const orders = await sql`
      SELECT
        o.id,
        o.account_id,
        a.username,
        o.reservation_id,
        t.label AS table_label,
        o.items,
        o.total::text AS total,
        o.status,
        o.created_at,
        o.completed_at
      FROM cafe_orders o
      JOIN accounts a ON a.id = o.account_id
      LEFT JOIN reservations r
        ON r.id = o.reservation_id
      LEFT JOIN cafe_tables t ON t.id = r.table_id
      ORDER BY o.created_at DESC
      LIMIT 200
    `;

    const reservations = await sql`
      SELECT
        r.id,
        r.account_id,
        a.username,
        t.label AS table_label,
        r.party_size,
        r.starts_at,
        r.ends_at,
        r.status,
        r.cancelled_at,
        CASE
          WHEN r.status = 'cancelled' THEN 'cancelled'
          WHEN r.ends_at <= NOW() THEN 'expired'
          ELSE 'active'
        END AS display_status
      FROM reservations r
      JOIN accounts a ON a.id = r.account_id
      JOIN cafe_tables t ON t.id = r.table_id
      ORDER BY r.starts_at DESC
      LIMIT 200
    `;

    return reply("Admin records loaded.", 200, {
      orders,
      reservations,
    });
  } catch (error) {
    console.error("Admin operations GET:", error);
    return reply("Could not load admin records.", 500);
  }
}

export async function PATCH(request: Request) {
  if (!hasValidOrigin(request)) {
    return reply("Invalid request origin.", 403);
  }

  if (!isJson(request)) {
    return reply("JSON required.", 415);
  }

  try {
    if (!(await requireAdmin())) {
      return reply("Administrator access required.", 403);
    }

    const body = await jsonObject(request);

    if (!body || !validId(body.id)) {
      return reply("A valid record ID is required.", 400);
    }

    const sql = getDatabase();

    if (body.action === "complete_order") {
      const [order] = await sql`
        UPDATE cafe_orders
        SET
          status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${body.id}
          AND status = 'placed'
        RETURNING id, status, completed_at
      `;

      if (!order) {
        return reply(
          "Order not found or already completed.",
          409
        );
      }

      return reply(
        "Order marked as completed.",
        200,
        order
      );
    }

    if (body.action === "cancel_reservation") {
      const [reservation] = await sql`
        UPDATE reservations
        SET
          status = 'cancelled',
          cancelled_at = NOW()
        WHERE id = ${body.id}
          AND status = 'active'
          AND ends_at > NOW()
        RETURNING id, status, cancelled_at
      `;

      if (!reservation) {
        return reply(
          "Reservation not found, expired or already cancelled.",
          409
        );
      }

      return reply(
        "Reservation cancelled successfully.",
        200,
        reservation
      );
    }

    return reply("Unknown action.", 400);
  } catch (error) {
    console.error("Admin operations PATCH:", error);
    return reply("Could not update record.", 500);
  }
}
