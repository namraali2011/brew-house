
"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coffee,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";

type MenuItem = {
  id: number;
  name: string;
  price: string;
  category: string;
  available: boolean;
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
  reservation_id: number | null;
  table_label: string | null;
  items: OrderLine[];
  total: string;
  created_at: string;
  editable: boolean;
};

type ReservationResponse = {
  tables: CafeTable[];
  reservations: Reservation[];
};

const field =
  "mt-2 w-full rounded-xl border border-[#dfd1c1] bg-white px-4 py-3 text-sm text-[#38271e] outline-none focus:border-[#a77b50]";

const button =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#38271e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#684832] disabled:cursor-not-allowed disabled:opacity-50";

function money(value: number | string) {
  return `Rs. ${Number(value).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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
    throw new Error(result.message || "Request failed.");
  }

  return result.data as T;
}

export default function DinePage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [reservations, setReservations] =
    useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [tableId, setTableId] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [when, setWhen] = useState("");

  // The missing state: selected table reservation.
  const [reservationId, setReservationId] = useState("");

  const [quantities, setQuantities] = useState<
    Record<number, number>
  >({});

  const [editing, setEditing] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    const [m, r, o] = await Promise.all([
      api<MenuItem[]>("/api/menu"),
      api<ReservationResponse>("/api/reservations"),
      api<Order[]>("/api/orders"),
    ]);

    setMenu(m);
    setTables(r.tables);
    setReservations(r.reservations);
    setOrders(o);

    return r.reservations;
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [m, r, o] = await Promise.all([
          api<MenuItem[]>("/api/menu"),
          api<ReservationResponse>("/api/reservations"),
          api<Order[]>("/api/orders"),
        ]);

        if (!active) return;

        setMenu(m);
        setTables(r.tables);
        setReservations(r.reservations);
        setOrders(o);

        // Automatically select the next usable reservation.
        const first = r.reservations.find(
          (booking) =>
            new Date(booking.ends_at).getTime() >
            Date.now()
        );

        if (first) {
          setReservationId(String(first.id));
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load customer data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialLoad();

    return () => {
      active = false;
    };
  }, []);

  // Bookings are already filtered by the server.
  // This extra check updates the client UI.
  const validReservations = reservations.filter(
    (r) => new Date(r.ends_at).getTime() > Date.now()
  );

  const selectedBooking = validReservations.find(
    (r) => String(r.id) === reservationId
  );

  const availableMenu = menu.filter((item) => item.available);

  const selectedItems = availableMenu
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      ...item,
      quantity: quantities[item.id],
    }));

  const total = selectedItems.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  function changeQuantity(id: number, difference: number) {
    setQuantities((previous) => ({
      ...previous,
      [id]: Math.max(
        0,
        Math.min(
          20,
          (previous[id] ?? 0) + difference
        )
      ),
    }));
  }

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (!tableId || !when) {
        throw new Error("Select a table and booking time.");
      }

      const time = new Date(when);

      if (!Number.isFinite(time.getTime())) {
        throw new Error("Invalid booking date.");
      }

      const created = await api<{
        id: number;
        starts_at: string;
        ends_at: string;
      }>("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_id: Number(tableId),
          party_size: Number(partySize),
          starts_at: time.toISOString(),
        }),
      });

      await refresh();

      // Automatically link the newly created booking
      // to the customer's next order.
      setReservationId(String(created.id));

      const selectedTable = tables.find(
        (table) => table.id === Number(tableId)
      );

      setNotice(
        `Reservation #${created.id} confirmed! ` +
        `${selectedTable?.label ?? "Your table"} · ` +
        `${partySize} guests · ` +
        `${dateLabel(created.starts_at)}. ` +
        "This reservation is selected for your order."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reserve the table."
      );
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const items = selectedItems.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
      }));

      if (items.length === 0) {
        throw new Error("Choose at least one menu item.");
      }

      const isEditing = editing !== null;

      if (!isEditing && !selectedBooking) {
        throw new Error(
          "Please select an active table reservation before placing your order."
        );
      }

      // NEW ORDERS INCLUDE reservation_id.
      // Existing order edits retain their original booking.
      const payload = isEditing
        ? {
            id: editing,
            items,
          }
        : {
            reservation_id: Number(reservationId),
            items,
          };

      const saved = await api<{
        id: number;
        total: string;
      }>("/api/orders", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await refresh();

      setEditing(null);
      setQuantities({});

      setNotice(
        isEditing
          ? `Order #${saved.id} updated successfully! Total: ${money(saved.total)}.`
          : `Order #${saved.id} confirmed for ${selectedBooking?.table_label}. Total: ${money(saved.total)}.`
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not place the order."
      );
    } finally {
      setBusy(false);
    }
  }

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

    if (order.reservation_id) {
      setReservationId(String(order.reservation_id));
    }

    setNotice("");
    setError("");

    document.getElementById("order-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function reload() {
    setLoading(true);
    setError("");

    try {
      const updated = await refresh();

      const existing = updated.find(
        (r) => String(r.id) === reservationId
      );

      if (!existing) {
        setReservationId(
          updated.length > 0 ? String(updated[0].id) : ""
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not refresh the page."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#38271e]">
      {/* HEADER */}
      <header className="border-b border-[#e9dfd3] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <span className="rounded-xl bg-[#38271e] p-3 text-white">
              <Coffee size={22} />
            </span>

            <div>
              <p className="font-serif text-2xl font-bold">
                BrewHouse
              </p>
              <p className="text-[10px] uppercase tracking-widest text-[#a77b50]">
                Coffee & Comfort
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#dfd1c1] px-4 py-2.5 text-sm font-semibold hover:bg-[#f7f0e5]"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* INTRO */}
      <section className="bg-[#38271e] px-5 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4b291]">
            Your BrewHouse Experience
          </p>

          <h1 className="mt-4 max-w-2xl font-serif text-4xl font-bold sm:text-5xl">
            Reserve your table.
            <br />
            Order your favourites.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#e5d5c6]">
            Book a table, choose your menu items and place
            your order in one convenient experience.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-10">
        {/* NOTIFICATIONS */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800"
          >
            <CheckCircle2 className="shrink-0" />
            <p className="text-sm leading-7">{notice}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            {error}
            <Link
              href="/login"
              className="ml-2 font-semibold underline"
            >
              Customer Login
            </Link>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 rounded-xl bg-white p-5">
            <Loader2 className="animate-spin" />
            Loading...
          </div>
        )}

        {/* RESERVATION SECTION */}
        <section
          id="booking"
          className="scroll-mt-10 rounded-3xl border border-[#e9dfd3] bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-7 flex items-center gap-3">
            <span className="rounded-xl bg-[#f2e7da] p-3 text-[#a77b50]">
              <CalendarDays size={24} />
            </span>

            <div>
              <h2 className="font-serif text-3xl font-bold">
                Book a Table
              </h2>
              <p className="mt-1 text-sm text-[#806d5d]">
                Make a reservation for your visit.
              </p>
            </div>
          </div>

          <form
            onSubmit={book}
            className="grid gap-4 md:grid-cols-2"
          >
            <label className="text-sm font-semibold">
              Select Table
              <select
                required
                value={tableId}
                onChange={(e) =>
                  setTableId(e.target.value)
                }
                className={field}
              >
                <option value="">Choose a table</option>

                {tables.map((table) => (
                  <option
                    key={table.id}
                    value={table.id}
                  >
                    {table.label} — {table.seats} seats
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              Number of Guests
              <input
                required
                type="number"
                min="1"
                max="20"
                value={partySize}
                onChange={(e) =>
                  setPartySize(e.target.value)
                }
                className={field}
              />
            </label>

            <label className="text-sm font-semibold">
              Date & Time
              <input
                required
                type="datetime-local"
                value={when}
                onChange={(e) =>
                  setWhen(e.target.value)
                }
                className={field}
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={busy || loading}
                className={`${button} w-full`}
              >
                <CalendarDays size={17} />
                Confirm Reservation
              </button>
            </div>
          </form>

          {/* RESERVATION HISTORY */}
          {validReservations.length > 0 && (
            <div className="mt-8 border-t border-[#eee4d8] pt-6">
              <h3 className="font-serif text-xl font-bold">
                My Active Reservations
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {validReservations.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-2xl border p-4 ${
                      reservationId === String(r.id)
                        ? "border-[#a77b50] bg-[#f7f0e5]"
                        : "border-[#e9dfd3] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong>{r.table_label}</strong>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Confirmed
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[#806d5d]">
                      {dateLabel(r.starts_at)}
                    </p>

                    <p className="mt-1 text-xs text-[#948274]">
                      {r.party_size} guests · Booking #{r.id}
                    </p>

                    <p className="mt-2 flex items-center gap-1 text-xs text-[#948274]">
                      <Clock3 size={13} />
                      Ends {dateLabel(r.ends_at)}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setReservationId(String(r.id));

                        document
                          .getElementById("order-form")
                          ?.scrollIntoView({
                            behavior: "smooth",
                          });
                      }}
                      className="mt-4 text-sm font-semibold text-[#946b4b] underline"
                    >
                      {reservationId === String(r.id)
                        ? "Selected for Order ✓"
                        : "Select for Order"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ORDER SECTION */}
        <section
          id="order-form"
          className="scroll-mt-10"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl font-bold">
                {editing !== null
                  ? `Edit Order #${editing}`
                  : "Place Your Order"}
              </h2>

              <p className="mt-2 text-sm text-[#806d5d]">
                Select menu items and link them to your
                reservation.
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={busy || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#dfd1c1] bg-white px-4 py-3 text-sm font-semibold"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <form
            onSubmit={placeOrder}
            className="grid items-start gap-6 lg:grid-cols-[1fr_320px]"
          >
            {/* MENU */}
            <div className="grid gap-4 sm:grid-cols-2">
              {availableMenu.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#e9dfd3] bg-white p-5 shadow-sm"
                >
                  <span className="inline-flex rounded-xl bg-[#f2e7da] p-3 text-[#a77b50]">
                    <Coffee size={23} />
                  </span>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#a77b50]">
                    {item.category}
                  </p>

                  <h3 className="mt-2 font-serif text-xl font-bold">
                    {item.name}
                  </h3>

                  <p className="mt-2 font-bold text-[#946b4b]">
                    {money(item.price)}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-[#eee4d8] pt-4">
                    <span className="text-xs text-[#806d5d]">
                      Quantity
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() =>
                          changeQuantity(item.id, -1)
                        }
                        className="rounded-full border p-2"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="min-w-4 text-center font-semibold">
                        {quantities[item.id] ?? 0}
                      </span>

                      <button
                        type="button"
                        aria-label={`Add ${item.name}`}
                        onClick={() =>
                          changeQuantity(item.id, 1)
                        }
                        className="rounded-full bg-[#38271e] p-2 text-white"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* ORDER SUMMARY */}
            <aside className="rounded-2xl border border-[#e9dfd3] bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <div className="flex items-center gap-2">
                <ShoppingBag size={22} />
                <h3 className="font-serif text-2xl font-bold">
                  Your Order
                </h3>
              </div>

              {/* RESERVATION SELECTOR */}
              <div className="mt-6">
                <label
                  htmlFor="reservation-selector"
                  className="text-sm font-semibold"
                >
                  Table Reservation
                </label>

                {editing !== null ? (
                  <p className="mt-2 rounded-xl bg-[#f7f0e5] p-3 text-sm">
                    Editing order #{editing}. Its existing
                    reservation will be retained.
                  </p>
                ) : (
                  <select
                    id="reservation-selector"
                    required
                    className={field}
                    value={reservationId}
                    onChange={(e) =>
                      setReservationId(e.target.value)
                    }
                  >
                    <option value="">
                      Select your reservation
                    </option>

                    {validReservations.map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                      >
                        {r.table_label} — {dateLabel(r.starts_at)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {editing === null &&
                validReservations.length === 0 && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    No active reservation found. Please
                    reserve a table above before ordering.
                    <a
                      href="#booking"
                      className="mt-2 block font-semibold underline"
                    >
                      Reserve a Table
                    </a>
                  </div>
                )}

              {selectedBooking && editing === null && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <CheckCircle2
                    size={16}
                    className="mr-2 inline"
                  />
                  Selected: {selectedBooking.table_label}
                </div>
              )}

              <div className="my-6 border-t border-[#eee4d8]" />

              {selectedItems.length === 0 ? (
                <p className="text-sm text-[#806d5d]">
                  No items selected yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <span className="font-semibold">
                        {money(
                          Number(item.price) *
                            item.quantity
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="my-6 border-t border-[#eee4d8]" />

              <div className="flex items-center justify-between">
                <strong>Total</strong>

                <strong className="text-xl text-[#946b4b]">
                  {money(total)}
                </strong>
              </div>

              <button
                type="submit"
                disabled={
                  busy ||
                  loading ||
                  selectedItems.length === 0 ||
                  (editing === null && !selectedBooking)
                }
                className={`${button} mt-6 w-full`}
              >
                {busy ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <UtensilsCrossed size={17} />
                )}

                {editing !== null
                  ? "Save Order Changes"
                  : "Confirm Order"}
              </button>

              {editing !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setQuantities({});
                  }}
                  className="mt-3 w-full rounded-xl border border-[#dfd1c1] px-4 py-3 text-sm font-semibold"
                >
                  Cancel Editing
                </button>
              )}
            </aside>
          </form>
        </section>

        {/* ACTIVE ORDERS */}
        <section className="rounded-3xl border border-[#e9dfd3] bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-serif text-3xl font-bold">
            My Active Orders
          </h2>

          <p className="mt-2 text-sm text-[#806d5d]">
            Completed orders disappear from this list.
            Changes are allowed within five minutes
            of placing an order.
          </p>

          {orders.length === 0 && (
            <p className="mt-5 text-sm text-[#806d5d]">
              You have no active orders.
            </p>
          )}

          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-[#e9dfd3] bg-[#fcfaf7] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <strong className="text-lg">
                      Order #{order.id}
                    </strong>

                    <p className="mt-1 text-xs text-[#806d5d]">
                      {dateLabel(order.created_at)}
                    </p>

                    {order.table_label && (
                      <p className="mt-2 text-sm font-semibold text-[#946b4b]">
                        {order.table_label}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">
                    Confirmed
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-[#eee4d8] pt-4">
                  {order.items.map((line, index) => (
                    <div
                      key={`${line.menu_item_id}-${index}`}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span>
                        {line.name} × {line.quantity}
                      </span>

                      <span>
                        {money(
                          Number(line.price) *
                            line.quantity
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee4d8] pt-4">
                  <strong>{money(order.total)}</strong>

                  {order.editable ? (
                    <button
                      type="button"
                      onClick={() => editOrder(order)}
                      className="rounded-xl bg-[#38271e] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Edit Order
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-[#806d5d]">
                      <Clock3 size={14} />
                      Editing window closed
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="pb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#946b4b]"
          >
            <ArrowLeft size={16} />
            Back to BrewHouse
          </Link>
        </div>
      </div>
    </main>
  );
}
