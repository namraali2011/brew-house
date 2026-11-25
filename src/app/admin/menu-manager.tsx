"use client";

import { useEffect, useState, type FormEvent } from "react";

type MenuFields = { name: string; description: string; price: string; category: string };
type MenuItem = MenuFields & { id: number };

const emptyForm: MenuFields = { name: "", description: "", price: "", category: "Coffee" };
const inputClass = "mt-1 block w-full rounded-lg border border-[#cdbca7] bg-white p-2.5";
const actionClass = "rounded-full border border-[#cdbca7] px-4 py-2 text-sm disabled:opacity-60";

async function menuRequest<T>(method: string, signal?: AbortSignal, body?: object) {
  const response = await fetch("/api/menu", {
    method,
    cache: "no-store",
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "The menu request failed.");
  }
  return result as { data: T; message: string };
}

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    menuRequest<MenuItem[]>("GET", controller.signal)
      .then(({ data }) => setItems(data))
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function resetEditor() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data, message } = await menuRequest<MenuItem>(
        editingId === null ? "POST" : "PATCH", undefined, { ...form, id: editingId },
      );
      setItems((previous) => editingId === null
        ? [data, ...previous]
        : previous.map((item) => item.id === data.id ? data : item));
      resetEditor();
      setNotice(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the item.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { message } = await menuRequest("DELETE", undefined, { id: item.id });
      setItems((previous) => previous.filter(({ id }) => id !== item.id));
      if (editingId === item.id) resetEditor();
      setNotice(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the item.");
    } finally {
      setBusy(false);
    }
  }

  function edit(item: MenuItem) {
    const { id, name, description, price, category } = item;
    setEditingId(id);
    setForm({ name, description, price: String(price), category });
    setError("");
    setNotice("");
    document.getElementById("menu-item-name")?.focus();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="rounded-2xl border border-[#e9dece] bg-[#f7f0e5] p-6">
        <h2 className="mb-4 font-serif text-2xl">{editingId === null ? "Add Menu Item" : "Edit Menu Item"}</h2>
        <fieldset disabled={loading || busy} className="grid gap-4 sm:grid-cols-2">
          <label>Name
            <input id="menu-item-name" required maxLength={150} value={form.name} className={inputClass}
              onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>Price (PKR)
            <input type="number" required min="0" max="99999999.99" step="0.01" value={form.price} className={inputClass}
              onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>
          <label>Category
            <select value={form.category} className={inputClass}
              onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>Coffee</option><option>Dessert</option><option>Snacks</option>
            </select>
          </label>
          <label className="sm:col-span-2">Description
            <textarea required maxLength={500} value={form.description} className={inputClass}
              onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button className="rounded-full bg-[#38271e] px-5 py-2.5 text-white disabled:opacity-60">
              {editingId === null ? "Add Item" : "Save Changes"}
            </button>
            {editingId !== null && <button type="button" onClick={resetEditor} className={actionClass}>Cancel Edit</button>}
          </div>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-4 text-green-800">{notice}</p>}
      </form>
      <section aria-labelledby="current-menu">
        <h2 id="current-menu" className="mb-4 font-serif text-2xl">Current Menu</h2>
        {loading && <p role="status">Loading menu…</p>}
        {!loading && items.length === 0 && !error && <p>The menu is currently empty.</p>}
        <ul className="divide-y divide-[#e9dece]">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm">{item.category} · Rs. {item.price}</p>
                <p className="text-sm">{item.description}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busy} className={actionClass} onClick={() => edit(item)}
                  aria-label={`Edit ${item.name}`}>Edit</button>
                <button type="button" disabled={busy} className={actionClass} onClick={() => remove(item)}
                  aria-label={`Delete ${item.name}`}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
