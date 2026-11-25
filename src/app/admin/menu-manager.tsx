"use client";

import { useEffect, useState, type FormEvent } from "react";

import { MenuImage } from "@/components/menu-image";
import { parseImageUrl, type Category, type MenuItem } from "@/lib/menu";
import { AdminSettings } from "./settings";

type MenuFields = { name: string; description: string; price: string; category_id: string; available: boolean; image_url: string };

const emptyForm: MenuFields = { name: "", description: "", price: "", category_id: "", available: true, image_url: "" };
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
  return result as { data: T; message: string; categories?: Category[] };
}

export function MenuManager() {
  const [categories, setCategories] = useState<Category[]>([]);
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
      .then(({ data, categories }) => {
        setItems(data);
        setCategories(categories ?? []);
      })
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
        editingId === null ? "POST" : "PATCH", undefined, { ...form, id: editingId, category_id: Number(form.category_id) },
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
    const { id, name, description, price, category_id, available, image_url } = item;
    setEditingId(id);
    setForm({ name, description, price: String(price), category_id: String(category_id), available, image_url: image_url ?? "" });
    setError("");
    setNotice("");
    document.getElementById("menu-item-name")?.focus();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="rounded-2xl border border-[#e9dece] bg-[#f7f0e5] p-6">
        <h2 className="mb-4 font-serif text-2xl">{editingId === null ? "Add Menu Item" : "Edit Menu Item"}</h2>
        <fieldset disabled={loading || busy || categories.length === 0} className="grid gap-4 sm:grid-cols-2">
          <label>Name
            <input id="menu-item-name" required maxLength={150} value={form.name} className={inputClass}
              onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>Price (PKR)
            <input type="number" required min="0" max="99999999.99" step="0.01" value={form.price} className={inputClass}
              onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>
          <label>Category
            <select required value={form.category_id} className={inputClass}
              onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
              <option value="">Select a category</option>
              {categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2">Description
            <textarea required maxLength={500} value={form.description} className={inputClass}
              onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} />
            Available on the menu
          </label>
          <div className="space-y-2 sm:col-span-2">
            <label className="block">Image URL (optional)
              <input type="url" maxLength={2048} value={form.image_url} className={inputClass}
                placeholder="https://example.com/menu-photo.jpg"
                onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
            </label>
            {form.image_url && (
              <>
                <button type="button" className={actionClass} onClick={() => setForm({ ...form, image_url: "" })}>Clear Image</button>
                <div className="relative flex aspect-video w-full max-w-xs items-center justify-center overflow-hidden rounded-lg bg-[#eee1ce]">
                  <MenuImage key={form.image_url} url={parseImageUrl(form.image_url) ?? null}
                    fallback={<span className="px-3 text-sm">Image preview unavailable</span>} />
                </div>
              </>
            )}
          </div>
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
                <p className="text-sm">{categories.find(({ id }) => id === item.category_id)?.name ?? item.category} · Rs. {item.price}{!item.available && " · Unavailable"}</p>
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
      {!loading && (
        <AdminSettings categories={categories} onCategoryChange={(change) => {
          if (change.action === "delete") {
            setCategories((previous) => previous.filter(({ id }) => id !== change.id));
            setForm((previous) => previous.category_id === String(change.id) ? { ...previous, category_id: "" } : previous);
          } else {
            setCategories((previous) => [
              ...previous.filter(({ id }) => id !== change.category.id), change.category,
            ].sort((a, b) => a.name.localeCompare(b.name)));
          }
        }} />
      )}
    </div>
  );
}
