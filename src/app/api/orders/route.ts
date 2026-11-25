
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

type SelectedItem = {
  menu_item_id: number;
  quantity: number;
};

function parseItems(value: unknown): SelectedItem[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > 30
  ) {
    return null;
  }

  const seen = new Set<number>();
  const items: SelectedItem[] = [];

  for (const row of value) {
    if (
      !row ||
      typeof row !== "object" ||
      !validId(row.menu_item_id) ||
      !Number.isInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity > 20 ||
      seen.has(row.menu_item_id)
    ) {
      return null;
    }

    seen.add(row.menu_item_id);
    items.push({
      menu_item_id: row.menu_item_id,
      quantity: row.quantity,
    });
  }

  return items;
}

// Customers see only their uncompleted orders.
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

    const orders = await sql`
      SELECT
        o.id,
        o.reservation_id,
        t.label AS table_label,
        r.starts_at AS reservation_time,
        o.items,
        o.total::text AS total,
        o.created_at,
        o.updated_at,
        (
          NOW() < o.created_at + INTERVAL '5 minutes'
          AND o.status = 'placed'
        ) AS editable
      FROM cafe_orders o
      LEFT JOIN reservations r ON r.id = o.reservation_id
      LEFT JOIN cafe_tables t ON t.id = r.table_id
      WHERE o.account_id = ${account.id}
        AND o.status = 'placed'
      ORDER BY o.created_at DESC
      LIMIT 30
    `;

    return reply("Active orders loaded.", 200, orders);
  } catch (error) {
    console.error("Order read failed:", error);
    return reply("Could not retrieve orders.", 500);
  }
}

async function saveOrder(
  request: Request,
  editing: boolean
) {
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

    const items = parseItems(body.items);

    if (!items) {
      return reply(
        "Select valid menu items and quantities.",
        400
      );
    }

    if (editing && !validId(body.id)) {
      return reply("Invalid order ID.", 400);
    }

    if (!editing && !validId(body.reservation_id)) {
      return reply(
        "Select a table reservation before ordering.",
        400
      );
    }

    const sql = getDatabase();
    const requested = JSON.stringify(items);

    // Prices are taken from the database.
    const [summary] = await sql`
      WITH requested AS (
        SELECT *
        FROM jsonb_to_recordset(
          ${requested}::jsonb
        ) AS x(
          menu_item_id INTEGER,
          quantity INTEGER
        )
      ),
      priced AS (
        SELECT
          m.id AS menu_item_id,
          m.name,
          m.price,
          r.quantity
        FROM requested r
        JOIN menu_items m
          ON m.id = r.menu_item_id
        WHERE m.available = TRUE
      )
      SELECT
        COUNT(*)::integer AS matched,
        COALESCE(
          SUM(price * quantity),
          0
        )::text AS total,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'menu_item_id', menu_item_id,
              'name', name,
              'price', price::text,
              'quantity', quantity
            )
          ),
          '[]'::jsonb
        ) AS items
      FROM priced
    `;

    if (Number(summary.matched) !== items.length) {
      return reply(
        "One or more menu items are unavailable.",
        409
      );
    }

    if (!editing) {
      // Only the signed-in customer's active booking
      // can be used for a new order.
      const [created] = await sql`
        INSERT INTO cafe_orders (
          account_id,
          reservation_id,
          items,
          total,
          status
        )
        SELECT
          ${account.id},
          r.id,
          ${JSON.stringify(summary.items)}::jsonb,
          ${summary.total}::numeric,
          'placed'
        FROM reservations r
        WHERE r.id = ${body.reservation_id}
          AND r.account_id = ${account.id}
          AND r.status = 'active'
          AND r.ends_at > NOW()
        RETURNING
          id,
          reservation_id,
          items,
          total::text AS total,
          created_at,
          updated_at
      `;

      if (!created) {
        return reply(
          "Your reservation is cancelled, expired, or unavailable. Please reserve a table.",
          409
        );
      }

      return reply(
        "Order placed successfully.",
        201,
        created
      );
    }

    // Completed orders cannot be edited.
    // PostgreSQL enforces the 5-minute deadline.
    const [updated] = await sql`
      UPDATE cafe_orders
      SET
        items = ${JSON.stringify(summary.items)}::jsonb,
        total = ${summary.total}::numeric,
        updated_at = NOW()
      WHERE id = ${body.id}
        AND account_id = ${account.id}
        AND status = 'placed'
        AND NOW() <
          created_at + INTERVAL '5 minutes'
      RETURNING
        id,
        reservation_id,
        items,
        total::text AS total,
        created_at,
        updated_at
    `;

    if (!updated) {
      return reply(
        "Order completed, not found, or its editing window has expired.",
        409
      );
    }

    return reply(
      "Order updated successfully.",
      200,
      updated
    );
  } catch (error) {
    console.error(
      "Order write failed:",
      databaseErrorCode(error) ?? "unknown"
    );
    return reply("Could not save the order.", 500);
  }
}

export const POST = (request: Request) =>
  saveOrder(request, false);

export const PATCH = (request: Request) =>
  saveOrder(request, true);
