
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — Fetch all menu items
export async function GET() {
  try {
    const sql = getDatabase();

    const menuItems = await sql`
      SELECT
        id,
        name,
        price,
        description,
        category,
        created_at
      FROM menu_items
      ORDER BY id DESC
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Menu items fetched successfully.",
        data: menuItems,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/menu failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch menu items.",
        data: [],
      },
      { status: 500 }
    );
  }
}

// POST — Add a new menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    const priceValue = body.price;

    if (
      !name ||
      !description ||
      !category ||
      priceValue === "" ||
      priceValue === null ||
      priceValue === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

    const price = Number(priceValue);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99 ||
      !Number.isInteger(Math.round(price * 100)) ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid price with up to 2 decimal places.",
        },
        { status: 400 }
      );
    }

    if (name.length > 150 || category.length > 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Name or category is too long.",
        },
        { status: 400 }
      );
    }

    if (!["Coffee", "Dessert", "Snacks"].includes(category)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid category.",
        },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const result = await sql`
      INSERT INTO menu_items (
        name,
        price,
        description,
        category
      )
      VALUES (
        ${name},
        ${price},
        ${description},
        ${category}
      )
      RETURNING
        id,
        name,
        price,
        description,
        category,
        created_at
    `;

    return NextResponse.json(
      {
        success: true,
        message: "Menu item added successfully.",
        data: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/menu failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add menu item.",
      },
      { status: 500 }
    );
  }
}

// DELETE — Remove an existing menu item
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const id = body.id;

    if (
      typeof id !== "number" ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid menu item ID is required.",
        },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const result = await sql`
      DELETE FROM menu_items
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Menu item not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Menu item deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/menu failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete menu item.",
      },
      { status: 500 }
    );
  }
}
