import { currentAccount } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { adminWriteGuard, databaseErrorCode, jsonObject, reply } from "@/lib/http";
import { validId } from "@/lib/menu";

export async function GET() {
  try {
    const account = await currentAccount();
    if (!account) return reply("Sign in to view settings.", 401);
    if (account.role !== "admin") return reply("An admin account is required.", 403);
    const sql = getDatabase();
    const [settings] = await sql`SELECT enabled, slot_minutes FROM booking_settings WHERE singleton`;
    return reply("Settings loaded.", 200, settings);
  } catch {
    return reply("Could not load settings.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await adminWriteGuard(request);
    if (denied) return denied;
    const body = await jsonObject(request);
    if (!body) return reply("Send a valid JSON object.", 400);

    const sql = getDatabase();
    if (body.action === "booking") {
      const { enabled, slot_minutes } = body;
      if (typeof enabled !== "boolean" || !Number.isInteger(slot_minutes) || slot_minutes < 5 || slot_minutes > 240) {
        return reply("Enter a slot duration from 5 to 240 minutes and select a booking status.", 400);
      }
      const [settings] = await sql`
        UPDATE booking_settings SET enabled = ${enabled}, slot_minutes = ${slot_minutes}
        WHERE singleton RETURNING enabled, slot_minutes
      `;
      return reply("Booking settings saved.", 200, settings);
    }

    if ((body.action === "rename" || body.action === "delete") && !validId(body.id)) {
      return reply("Select a valid category.", 400);
    }
    if (body.action === "delete") {
      const [category] = await sql`DELETE FROM menu_categories WHERE id = ${body.id} RETURNING id`;
      if (!category) return reply("Category not found.", 404);
      return reply("Category deleted.", 200);
    }

    if (body.action !== "add" && body.action !== "rename") return reply("Unknown settings action.", 400);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 50 || /[\u0000-\u001f\u007f]/.test(name)) {
      return reply("Enter a category name of up to 50 characters.", 400);
    }
    const [category] = body.action === "add"
      ? await sql`INSERT INTO menu_categories (name) VALUES (${name}) RETURNING id, name`
      : await sql`UPDATE menu_categories SET name = ${name} WHERE id = ${body.id} RETURNING id, name`;
    if (!category) return reply("Category not found.", 404);
    return reply("Category saved.", 200, category);
  } catch (error) {
    if (databaseErrorCode(error) === "23505") return reply("A category with that name already exists.", 409);
    if (databaseErrorCode(error) === "23503") return reply("Move its menu items to another category before deleting it.", 409);
    return reply("Could not save settings.", 500);
  }
}
