
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

type OrderInput = {
  menu_item_id: number;
  quantity: number;
};

// Validate selected menu items and quantities
function parseItems(value: unknown): OrderInput[] | null {
  if (
    !Array.isArray(value) ||
    value.length < 1 ||
    value.length > 30
  ) {
    return null;
  }

  const seen = new Set<number>();
  const items: OrderInput[] = [];

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

// GET: Retrieve orders belonging to signed-in user
export async function GET() {
  try {
    const account = await currentAccount();

    if (!account) {
      return reply("Please sign in.", 401);
    }

    const sql = getDatabase();

    const orders = await sql`
      SELECT
        id,
        items,
        total::text AS total,
        created_at,
        updated_at,
        (
          NOW() < created_at + INTERVAL '5 minutes'
        ) AS editable
      FROM cafe_orders
      WHERE account_id = ${account.id}
      ORDER BY created_at DESC
      LIMIT 30
    `;

    return reply(
      "Orders loaded.",
      200,
      orders
    );
  } catch (error) {
    console.error(
      "Order read failed:",
      databaseErrorCode(error) ?? "unknown"
    );

    return reply("Could not load orders.", 500);
  }
}

// POST and PATCH share validation logic
async function saveOrder(
  request: Request,
  updating: boolean
) {
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
        "Use a customer account to order.",
        403
      );
    }

    const body = await jsonObject(request);

    if (!body) {
      return reply("Invalid request.", 400);
    }

    const items = parseItems(body.items);

    if (
      !items ||
      (updating && !validId(body.id))
    ) {
      return reply(
        "Choose valid menu items and quantities.",
        400
      );
    }

    const sql = getDatabase();

    const requested = JSON.stringify(items);

    // Resolve actual prices and names from NeonDB.
    // Never trust prices sent by the browser.
    const [summary] = await sql`
      WITH requested AS (
        SELECT *
        FROM jsonb_to_recordset(
          ${requested}::jsonb
        ) AS x(
          menu_item_id integer,
          quantity integer
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
        count(*)::integer AS matched,
        COALESCE(
          sum(price * quantity),
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

    if (summary.matched !== items.length) {
      return reply(
        "One or more menu items are unavailable.",
        409
      );
    }

    // Create new order
    if (!updating) {
      const [created] = await sql`
        INSERT INTO cafe_orders (
          account_id,
          items,
          total
        )
        VALUES (
          ${account.id},
          ${JSON.stringify(summary.items)}::jsonb,
          ${summary.total}::numeric
        )
        RETURNING
          id,
          items,
          total::text AS total,
          created_at,
          updated_at
      `;

      return reply(
        "Order placed successfully.",
        201,
        created
      );
    }

    // Allow editing only within 5 minutes,
    // enforced by the PostgreSQL server clock.
    const [updated] = await sql`
      UPDATE cafe_orders
      SET
        items = ${JSON.stringify(summary.items)}::jsonb,
        total = ${summary.total}::numeric,
        updated_at = NOW()
      WHERE
        id = ${body.id}
        AND account_id = ${account.id}
        AND NOW() <
          created_at + INTERVAL '5 minutes'
      RETURNING
        id,
        items,
        total::text AS total,
        created_at,
        updated_at
    `;

    if (!updated) {
      return reply(
        "Order not found or the 5-minute editing window has expired.",
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

    return reply(
      "Could not save your order.",
      500
    );
  }
}

export const POST = (request: Request) =>
  saveOrder(request, false);

export const PATCH = (request: Request) =>
  saveOrder(request, true);
