import { NextRequest, NextResponse } from "next/server";
import { currentAccount, hasValidOrigin } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function reply(message: string, status: number, data?: unknown) {
  return NextResponse.json(
    { success: status < 400, message, data },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  try {
    const sql = getDatabase();
    const items = await sql`
      SELECT id, name, price, description, category, created_at
      FROM menu_items ORDER BY id DESC
    `;
    return reply("Menu items fetched successfully.", 200, items);
  } catch (error) {
    console.error("Menu read failed:", error);
    return reply("Failed to fetch menu items.", 500, []);
  }
}

function validId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 2147483647;
}

async function writeMenu(request: NextRequest, method: "POST" | "PATCH" | "DELETE") {
  try {
    const account = await currentAccount();
    if (!account) return reply("Sign in to manage the menu.", 401);
    if (account.role !== "admin") return reply("An admin account is required.", 403);

    if (!hasValidOrigin(request)) {
      return reply("Request origin is invalid.", 403);
    }
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
      return reply("Send a JSON request.", 415);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return reply("Send a valid JSON object.", 400);
    }
    const { id } = body;
    if (method !== "POST" && !validId(id)) {
      return reply("A valid menu item ID is required.", 400);
    }

    const sql = getDatabase();
    if (method === "DELETE") {
      const [deleted] = await sql`DELETE FROM menu_items WHERE id = ${id} RETURNING id`;
      if (!deleted) return reply("Menu item not found.", 404);
      return reply("Menu item deleted successfully.", 200);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const price = typeof body.price === "string" || typeof body.price === "number"
      ? String(body.price).trim() : "";

    if (!name || name.length > 150) return reply("Enter a name of up to 150 characters.", 400);
    if (!description || description.length > 500) return reply("Enter a description of up to 500 characters.", 400);
    if (!["Coffee", "Dessert", "Snacks"].includes(category)) {
      return reply("Please select a valid category.", 400);
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) > 99999999.99) {
      return reply("Enter a price from 0 to 99999999.99 with up to two decimal places.", 400);
    }

    if (method === "POST") {
      const [item] = await sql`
        INSERT INTO menu_items (name, price, description, category)
        VALUES (${name}, ${price}, ${description}, ${category})
        RETURNING id, name, price, description, category, created_at
      `;
      return reply("Menu item added successfully.", 201, item);
    }

    const [item] = await sql`
      UPDATE menu_items SET name = ${name}, price = ${price}, description = ${description}, category = ${category}
      WHERE id = ${id}
      RETURNING id, name, price, description, category, created_at
    `;
    if (!item) return reply("Menu item not found.", 404);
    return reply("Menu item updated successfully.", 200, item);
  } catch (error) {
    console.error("Menu write failed:", error);
    return reply("Failed to save the menu change.", 500);
  }
}

export const POST = (request: NextRequest) => writeMenu(request, "POST");
export const PATCH = (request: NextRequest) => writeMenu(request, "PATCH");
export const DELETE = (request: NextRequest) => writeMenu(request, "DELETE");
