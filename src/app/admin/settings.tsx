"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { BookingSettings, Category } from "@/lib/menu";

type CategoryChange = { action: "save"; category: Category } | { action: "delete"; id: number };
const input = "rounded-lg border border-[#cdbca7] bg-white p-2.5";
const button = "rounded-full border border-[#cdbca7] px-4 py-2 text-sm disabled:opacity-60";

export function AdminSettings({ categories, onCategoryChange }: {
  categories: Category[];
  onCategoryChange: (change: CategoryChange) => void;
}) {
  const [booking, setBooking] = useState<BookingSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/admin/settings", { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        setBooking(result.data);
      } catch {
        if (!controller.signal.aborted) setError("Could not load booking settings.");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function save(action: "add" | "rename" | "delete" | "booking", fields: object) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...fields }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      if (action === "booking") setBooking(result.data);
      else if (action === "delete" && "id" in fields && typeof fields.id === "number") {
        onCategoryChange({ action, id: fields.id });
      } else {
        onCategoryChange({ action: "save", category: result.data });
      }
      setNotice(result.message);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the settings.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function categoryForm(event: FormEvent<HTMLFormElement>, id?: number) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = new FormData(form).get("name");
    void save(id === undefined ? "add" : "rename", { id, name }).then((saved) => {
      if (saved && id === undefined) form.reset();
    });
  }

  function saveBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void save("booking", { enabled: form.has("enabled"), slot_minutes: Number(form.get("slot")) });
  }

  return (
    <section className="space-y-5 rounded-2xl border border-[#e9dece] bg-[#f7f0e5] p-6" aria-labelledby="admin-settings">
      <h2 id="admin-settings" className="font-serif text-2xl">Settings</h2>
      <div className="space-y-3">
        <h3 className="font-semibold">Menu Categories</h3>
        <form onSubmit={categoryForm} className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm">
            New category
            <input required name="name" maxLength={50} className={input} />
          </label>
          <button disabled={busy} className={button}>Add Category</button>
        </form>
        {categories.map(({ id, name }) => (
          <form key={id} onSubmit={(event) => categoryForm(event, id)} className="flex flex-wrap items-center gap-2">
            <input key={name} name="name" aria-label={"Category name for " + name} defaultValue={name}
              required maxLength={50} className={input} />
            <button disabled={busy} className={button}>Rename</button>
            <button type="button" disabled={busy} className={button}
              onClick={() => { if (window.confirm("Delete category " + name + "?")) void save("delete", { id }); }}>
              Delete
            </button>
          </form>
        ))}
      </div>
      <div className="space-y-3 border-t border-[#e9dece] pt-4">
        <h3 className="font-semibold">Booking Settings</h3>
        {booking && (
          <form key={String(booking.enabled) + ":" + booking.slot_minutes} onSubmit={saveBooking} className="space-y-3">
            <label className="flex items-center gap-2">
              <input name="enabled" type="checkbox" defaultChecked={booking.enabled} />
              Enable bookings
            </label>
            <label className="flex flex-wrap items-center gap-2">
              Slot duration (minutes)
              <input name="slot" type="number" required min={5} max={240} defaultValue={booking.slot_minutes} className={input} />
            </label>
            <button disabled={busy} className={button}>Save Booking Settings</button>
          </form>
        )}
      </div>
      {notice && <p role="status" className="text-green-800">{notice}</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </section>
  );
}
