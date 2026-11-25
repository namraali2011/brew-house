
"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

type MenuItem = {
  id: number;
  name: string;
  price: string;
  available: boolean;
  category: string;
};

type CafeTable = {
  id: number;
  label: string;
  seats: number;
};

type Reservation = {
  id: number;
  table_label: string;
  party_size: number;
  starts_at: string;
  ends_at: string;
};

type OrderLine = {
  menu_item_id: number;
  name: string;
  price: string;
  quantity: number;
};

type Order = {
  id: number;
  items: OrderLine[];
  total: string;
  created_at: string;
  editable: boolean;
};

const field =
  "w-full rounded-lg border border-[#cdbca7] bg-white px-3 py-2 text-[#38271e]";

const btn =
  "rounded-full bg-[#38271e] px-5 py-3 font-semibold text-white disabled:opacity-50";

// Reusable API request function
async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Request failed"
    );
  }

  return result.data as T;
}

export default function DinePage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);

  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);

  const [quantities, setQuantities] = useState<
    Record<number, number>
  >({});

  const [editing, setEditing] = useState<number | null>(null);

  const [tableId, setTableId] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [when, setWhen] = useState("");

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Refresh all information from NeonDB
  async function refresh() {
    const [m, r, o] = await Promise.all([
      api<MenuItem[]>("/api/menu"),
      api<{
        tables: CafeTable[];
        reservations: Reservation[];
      }>("/api/reservations"),
      api<Order[]>("/api/orders"),
    ]);

    setMenu(m);
    setTables(r.tables);
    setReservations(r.reservations);
    setOrders(o);
  }

  // Load customer data on page visit
  useEffect(() => {
    let active = true;

    Promise.all([
      api<MenuItem[]>("/api/menu"),
      api<{
        tables: CafeTable[];
        reservations: Reservation[];
      }>("/api/reservations"),
      api<Order[]>("/api/orders"),
    ])
      .then(([m, r, o]) => {
        if (!active) return;

        setMenu(m);
        setTables(r.tables);
        setReservations(r.reservations);
        setOrders(o);
      })
      .catch((e: Error) => {
        if (active) {
          setError(e.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Create reservation
  async function book(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (!when || !tableId) {
        throw new Error(
          "Select a table and booking time."
        );
      }

      const time = new Date(when);

      if (!Number.isFinite(time.getTime())) {
        throw new Error("Invalid booking date.");
      }

      const created = await api<{ id: number }>(
        "/api/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table_id: Number(tableId),
            party_size: Number(partySize),
            starts_at: time.toISOString(),
          }),
        }
      );

      await refresh();

      setNotice(
        `Table booking #${created.id} confirmed!`
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Booking failed."
      );
    } finally {
      setBusy(false);
    }
  }

  // Place a new order or edit an existing one
  async function placeOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const items = Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => ({
          menu_item_id: Number(id),
          quantity,
        }));

      if (items.length === 0) {
        throw new Error(
          "Choose at least one menu item."
        );
      }

      const isEditing = editing !== null;

      const created = await api<{
        id: number;
        total: string;
      }>("/api/orders", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing
            ? { id: editing, items }
            : { items }
        ),
      });

      await refresh();

      setEditing(null);
      setQuantities({});

      setNotice(
        `Order #${created.id} ${
          isEditing ? "updated" : "placed"
        }! Total: Rs. ${created.total}`
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Order failed."
      );
    } finally {
      setBusy(false);
    }
  }

  // Load an existing order into the form
  function editOrder(order: Order) {
    setEditing(order.id);

    setQuantities(
      Object.fromEntries(
        order.items.map((item) => [
          item.menu_item_id,
          item.quantity,
        ])
      )
    );

    document
      .getElementById("order-form")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <main className="min-h-screen bg-[#f7f0e5] px-5 py-10 text-[#38271e]">
      <div className="mx-auto max-w-5xl space-y-9">
        {/* PAGE HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/"
              className="text-sm underline"
            >
              ← Back to BrewHouse
            </Link>

            <h1 className="mt-3 font-serif text-4xl font-bold">
              Reservations & Orders
            </h1>

            <p className="mt-2 text-sm text-[#806d5d]">
              Sign in as a customer to book a table
              and order from the live menu.
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-full border border-[#38271e] px-5 py-2"
          >
            Customer Login
          </Link>
        </div>

        {/* STATUS MESSAGES */}
        {loading && (
          <p>Loading your café experience…</p>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-xl bg-green-100 p-4 text-green-900"
          >
            {notice}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-100 p-4 text-red-900"
          >
            {error}{" "}
            <Link
              href="/login"
              className="underline"
            >
              Log in
            </Link>
          </div>
        )}

        {/* TABLE RESERVATIONS */}
        <section className="rounded-2xl bg-[#fffdf8] p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold">
            Book a Table
          </h2>

          <p className="mt-1 text-sm text-[#806d5d]">
            Booking availability and slot lengths
            are controlled from Admin Settings.
          </p>

          <form
            onSubmit={book}
            className="mt-5 grid gap-4 md:grid-cols-4"
          >
            <label className="text-sm">
              Table

              <select
                required
                className={field}
                value={tableId}
                onChange={(e) =>
                  setTableId(e.target.value)
                }
              >
                <option value="">
                  Choose table
                </option>

                {tables.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                  >
                    {t.label} ({t.seats} seats)
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              Guests

              <input
                required
                type="number"
                min="1"
                max="20"
                className={field}
                value={partySize}
                onChange={(e) =>
                  setPartySize(e.target.value)
                }
              />
            </label>

            <label className="text-sm">
              Date & Time

              <input
                required
                type="datetime-local"
                className={field}
                value={when}
                onChange={(e) =>
                  setWhen(e.target.value)
                }
              />
            </label>

            <div className="flex items-end">
              <button
                disabled={busy || loading}
                className={btn}
              >
                Confirm Booking
              </button>
            </div>
          </form>

          {/* CUSTOMER RESERVATION HISTORY */}
          {reservations.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold">
                My Table Bookings
              </h3>

              <ul className="mt-2 space-y-2 text-sm">
                {reservations.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg bg-[#f7f0e5] p-3"
                  >
                    #{r.id} · {r.table_label} ·{" "}
                    {r.party_size} guest(s) ·{" "}
                    {new Date(
                      r.starts_at
                    ).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* MENU ORDERING FORM */}
        <section
          id="order-form"
          className="scroll-mt-8 rounded-2xl bg-[#fffdf8] p-6 shadow-sm"
        >
          <h2 className="font-serif text-2xl font-semibold">
            {editing
              ? `Edit Order #${editing}`
              : "Place an Order"}
          </h2>

          <p className="mt-1 text-sm text-[#806d5d]">
            Select quantities. Prices and totals are
            calculated by NeonDB, not your browser.
          </p>

          <form
            onSubmit={placeOrder}
            className="mt-5 space-y-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {menu
                .filter((m) => m.available)
                .map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#e9dece] p-3"
                  >
                    <span className="text-sm">
                      <strong>
                        {m.name}
                      </strong>
                      <br />

                      <span className="text-[#806d5d]">
                        {m.category} · Rs.{" "}
                        {m.price}
                      </span>
                    </span>

                    <input
                      aria-label={`Quantity for ${m.name}`}
                      type="number"
                      min="0"
                      max="20"
                      className="w-20 rounded-lg border px-2 py-2"
                      value={
                        quantities[m.id] ?? 0
                      }
                      onChange={(e) =>
                        setQuantities(
                          (q) => ({
                            ...q,
                            [m.id]: Math.max(
                              0,
                              Math.min(
                                20,
                                Number(
                                  e.target.value
                                ) || 0
                              )
                            ),
                          })
                        )
                      }
                    />
                  </label>
                ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                disabled={busy || loading}
                className={btn}
              >
                {busy
                  ? "Saving…"
                  : editing
                  ? "Save Order Changes"
                  : "Place Order"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setQuantities({});
                  }}
                  className="rounded-full border px-5 py-3"
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ORDER HISTORY */}
        <section className="rounded-2xl bg-[#fffdf8] p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold">
            My Orders
          </h2>

          <p className="mt-1 text-sm text-[#806d5d]">
            You can edit an order for five minutes
            after placement. The server enforces
            the deadline.
          </p>

          {orders.length === 0 && (
            <p className="mt-4 text-sm">
              No orders yet.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-[#e9dece] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>
                    Order #{order.id}
                  </strong>

                  <span className="text-sm">
                    {new Date(
                      order.created_at
                    ).toLocaleString()}
                  </span>
                </div>

                <ul className="mt-3 space-y-1 text-sm">
                  {order.items.map(
                    (line, index) => (
                      <li
                        key={`${line.menu_item_id}-${index}`}
                      >
                        {line.name} ×{" "}
                        {line.quantity} — Rs.{" "}
                        {line.price} each
                      </li>
                    )
                  )}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <strong>
                    Total: Rs.{" "}
                    {order.total}
                  </strong>

                  {order.editable ? (
                    <button
                      type="button"
                      onClick={() =>
                        editOrder(order)
                      }
                      className="rounded-full border border-[#38271e] px-4 py-2 text-sm"
                    >
                      Edit (within 5 min)
                    </button>
                  ) : (
                    <span className="text-sm text-[#806d5d]">
                      Editing window closed
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
