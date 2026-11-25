import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminWriteGuard, databaseErrorCode, jsonObject, reply } from "@/lib/http";
import { parseImageUrl, validId } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDatabase();
    const [menu] = await sql`
      SELECT
        COALESCE((SELECT jsonb_agg(item ORDER BY item.id DESC) FROM (
          SELECT m.id, m.name, m.price::text AS price, m.description, m.created_at,
            m.available, m.image_url, m.category_id, c.name AS category
          FROM menu_items m JOIN menu_categories c ON c.id = m.category_id
        ) item), '[]'::jsonb) AS items,
        COALESCE((SELECT jsonb_agg(c ORDER BY lower(c.name), c.id)
          FROM menu_categories c), '[]'::jsonb) AS categories
    `;
    return NextResponse.json(
      { success: true, message: "Menu items fetched successfully.", data: menu.items, categories: menu.categories },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Menu read failed:", error);
    return reply("Failed to fetch menu items.", 500, []);
  }
}

async function writeMenu(request: Request, method: "POST" | "PATCH" | "DELETE") {
  try {
    const denied = await adminWriteGuard(request);
    if (denied) return denied;
    const body = await jsonObject(request);
    if (!body) return reply("Send a valid JSON object.", 400);
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
    const categoryId = body.category_id;
    const price = typeof body.price === "string" || typeof body.price === "number"
      ? String(body.price).trim() : "";
    const hasImage = Object.hasOwn(body, "image_url");
    const imageUrl = hasImage ? parseImageUrl(body.image_url) : null;
    const available = body.available;

    if (!name || name.length > 150) return reply("Enter a name of up to 150 characters.", 400);
    if (!description || description.length > 500) return reply("Enter a description of up to 500 characters.", 400);
    if (categoryId === undefined ? !category || category.length > 50 : !validId(categoryId)) {
      return reply("Please select a valid category.", 400);
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) > 99999999.99) {
      return reply("Enter a price from 0 to 99999999.99 with up to two decimal places.", 400);
    }
    if (imageUrl === undefined) return reply("Enter a valid HTTP or HTTPS image URL without credentials.", 400);
    if (available !== undefined && typeof available !== "boolean") {
      return reply("Availability must be true or false.", 400);
    }

    const [selected] = validId(categoryId)
      ? await sql`SELECT id, name FROM menu_categories WHERE id = ${categoryId}`
      : await sql`SELECT id, name FROM menu_categories WHERE lower(name) = lower(${category})`;
    if (!selected) return reply("That category no longer exists.", 400);

    const [item] = method === "POST"
      ? await sql`
          INSERT INTO menu_items (name, price, description, category_id, available, image_url)
          VALUES (${name}, ${price}, ${description}, ${selected.id}, ${available ?? true}, ${imageUrl})
          RETURNING *
        `
      : await sql`
          UPDATE menu_items SET name = ${name}, price = ${price}, description = ${description},
            category_id = ${selected.id}, available = COALESCE(${available ?? null}, available),
            image_url = CASE WHEN ${hasImage} THEN ${imageUrl} ELSE image_url END
          WHERE id = ${id} RETURNING *
        `;
    if (!item) return reply("Menu item not found.", 404);
    return reply(method === "POST" ? "Menu item added successfully." : "Menu item updated successfully.",
      method === "POST" ? 201 : 200, { ...item, category: selected.name });
  } catch (error) {
    if (databaseErrorCode(error) === "23503") return reply("That category no longer exists.", 409);
    console.error("Menu write failed:", error);
    return reply("Failed to save the menu change.", 500);
  }
}

export const POST = (request: Request) => writeMenu(request, "POST");
export const PATCH = (request: Request) => writeMenu(request, "PATCH");
export const DELETE = (request: Request) => writeMenu(request, "DELETE");
