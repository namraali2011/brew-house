
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock3,
  Loader2,
} from "lucide-react";

type OrderLine = {
  name: string;
  price: string;
  quantity: number;
};

type Order = {
  id: number;
  username: string;
  table_label: string | null;
  items: OrderLine[];
  total: string;
  status: "placed" | "completed";
  created_at: string;
  completed_at: string | null;
};

type Reservation = {
  id: number;
  username: string;
  table_label: string;
  party_size: number;
  starts_at: string;
  ends_at: string;
  display_status: "active" | "expired" | "cancelled";
};

const actionButton =
  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function price(value: string) {
  return `Rs. ${Number(value).toLocaleString("en-PK")}`;
}

export function AdminOperations() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] =
    useState<Reservation[]>([]);
  const [tab, setTab] = useState<
    "orders" | "reservations"
  >("orders");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/operations", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Could not load records.");
    }

    setOrders(result.data.orders);
    setReservations(result.data.reservations);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const response = await fetch("/api/admin/operations", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not load records.");
        }

        if (active) {
          setOrders(result.data.orders);
          setReservations(result.data.reservations);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Loading failed."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialLoad();
    return () => { active = false; };
  }, []);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Refresh failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function update(
    action: "complete_order" | "cancel_reservation",
    id: number
  ) {
    const message = action === "complete_order"
      ? `Mark order #${id} as completed?`
      : `Cancel reservation #${id}?`;

    if (!window.confirm(message)) return;

    setBusyId(`${action}-${id}`);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Update failed.");
      }

      setNotice(result.message);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Update failed."
      );
    } finally {
      setBusyId(null);
    }
  }

  const pendingOrders = orders.filter(
    (o) => o.status === "placed"
  ).length;
  const activeReservations = reservations.filter(
    (r) =>
      r.display_status === "active" &&
      new Date(r.ends_at).getTime() > Date.now()
  ).length;

  return (
    <section className="mt-12 space-y-6" id="operations">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9d7858]">
            Café Operations
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[#352820]">
            Orders & Reservations
          </h2>
          <p className="mt-2 text-sm text-[#817267]">
            Complete customer orders and manage reserved tables.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className={`${actionButton} border border-[#d8c7b6]`}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#eee4d8] bg-[#f7f0e5] p-5">
          <ClipboardCheck className="text-[#9d7858]" />
          <p className="mt-3 text-3xl font-bold">{pendingOrders}</p>
          <p className="text-sm text-[#75665a]">Orders awaiting completion</p>
        </div>
        <div className="rounded-2xl border border-[#eee4d8] bg-[#f7f0e5] p-5">
          <CalendarDays className="text-[#9d7858]" />
          <p className="mt-3 text-3xl font-bold">{activeReservations}</p>
          <p className="text-sm text-[#75665a]">Current and upcoming bookings</p>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={17} className="mr-2 inline" />
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="flex gap-2 border-b border-[#e9dece] pb-4">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
            tab === "orders"
              ? "bg-[#352820] text-white"
              : "bg-[#f3ece3] text-[#6e5745]"
          }`}
        >
          Orders ({pendingOrders} pending)
        </button>
        <button
          type="button"
          onClick={() => setTab("reservations")}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
            tab === "reservations"
              ? "bg-[#352820] text-white"
              : "bg-[#f3ece3] text-[#6e5745]"
          }`}
        >
          Reservations
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 p-10">
          <Loader2 className="animate-spin" />
          Loading records...
        </div>
      ) : tab === "orders" ? (
        <div className="space-y-4">
          {orders.length === 0 && (
            <p className="rounded-2xl bg-[#f7f0e5] p-8 text-center">
              No customer orders yet.
            </p>
          )}
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-[#e9dece] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl font-semibold">
                    Order #{order.id}
                  </h3>
                  <p className="mt-1 text-sm text-[#75665a]">
                    Customer: {order.username}
                    {order.table_label && ` · ${order.table_label}`}
                  </p>
                  <p className="mt-1 text-xs text-[#918175]">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  order.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {order.status === "completed" ? "Completed" : "Pending"}
                </span>
              </div>

              <div className="my-4 space-y-2 border-y border-[#eee5da] py-4">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span>{item.name} × {item.quantity}</span>
                    <span>{price(String(Number(item.price) * item.quantity))}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong className="text-lg">{price(order.total)}</strong>
                {order.status === "placed" ? (
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => update("complete_order", order.id)}
                    className={`${actionButton} bg-[#352820] text-white hover:bg-[#65452f]`}
                  >
                    {busyId === `complete_order-${order.id}` ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Mark Completed
                  </button>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 size={16} />
                    Completed
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.length === 0 && (
            <p className="rounded-2xl bg-[#f7f0e5] p-8 text-center">
              No reservations yet.
            </p>
          )}
          {reservations.map((reservation) => {
            const status = reservation.display_status === "active" &&
              new Date(reservation.ends_at).getTime() <= Date.now()
                ? "expired"
                : reservation.display_status;
            return (
              <article
                key={reservation.id}
                className="rounded-2xl border border-[#e9dece] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl font-semibold">
                      {reservation.table_label}
                    </h3>
                    <p className="mt-1 text-sm text-[#75665a]">
                      {reservation.username} · {reservation.party_size} guests
                    </p>
                    <p className="mt-2 text-sm">
                      {formatDate(reservation.starts_at)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#918175]">
                      <Clock3 size={14} />
                      Ends {formatDate(reservation.ends_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    status === "active"
                      ? "bg-green-100 text-green-800"
                      : status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-stone-100 text-stone-700"
                  }`}>
                    {status === "active" ? "Reserved" :
                      status === "cancelled" ? "Cancelled" : "Expired"}
                  </span>
                </div>

                {status === "active" && (
                  <div className="mt-5 border-t border-[#eee5da] pt-4">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => update("cancel_reservation", reservation.id)}
                      className={`${actionButton} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
                    >
                      {busyId === `cancel_reservation-${reservation.id}` ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Cancel Reservation
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
