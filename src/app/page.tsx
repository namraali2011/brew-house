
"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Coffee,
  Menu,
  Plus,
  X,
  Leaf,
  CupSoda,
  Heart,
  Trash2,
  CakeSlice,
  Sandwich,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type MenuItem = {
  id: number;
  name: string;
  price: string;
  description: string;
  category: string;
  created_at: string;
};

type MenuForm = {
  name: string;
  price: string;
  description: string;
  category: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const emptyForm: MenuForm = {
  name: "",
  price: "",
  description: "",
  category: "Coffee",
};

const categories = ["All", "Coffee", "Dessert", "Snacks"];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [notification, setNotification] = useState("");

  // Load all records from NeonDB when the page opens
  useEffect(() => {
    let active = true;

    async function fetchMenu() {
      try {
        const response = await fetch("/api/menu", {
          cache: "no-store",
        });

        const result: ApiResponse<MenuItem[]> =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load the menu."
          );
        }

        if (active) {
          setMenuItems(result.data || []);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the database."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchMenu();

    return () => {
      active = false;
    };
  }, []);

  // Refresh menu manually if loading fails
  async function refreshMenu() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/menu", {
        cache: "no-store",
      });

      const result: ApiResponse<MenuItem[]> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load menu.");
      }

      setMenuItems(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not refresh menu."
      );
    } finally {
      setLoading(false);
    }
  }

  // Update form fields
  function updateForm(field: keyof MenuForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError("");
  }

  // Add a new menu item through the API
  async function handleAddItem(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setNotification("");

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.price.trim()
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const price = Number(form.price);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99 ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
    ) {
      setFormError("Please enter a valid price.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          price,
          description: form.description.trim(),
          category: form.category,
        }),
      });

      const result: ApiResponse<MenuItem> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Failed to add menu item."
        );
      }

      // Update the page without a full reload
      setMenuItems((previous) => [
        result.data!,
        ...previous,
      ]);

      setForm(emptyForm);
      setShowAddForm(false);
      setActiveCategory("All");
      setNotification("Menu item added successfully!");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to save the menu item."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete a menu item through the API
  async function handleDeleteItem(item: MenuItem) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setNotification("");
    setError("");

    try {
      const response = await fetch("/api/menu", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
        }),
      });

      const result: ApiResponse<never> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to delete menu item."
        );
      }

      // Remove the deleted card immediately
      setMenuItems((previous) =>
        previous.filter((menuItem) => menuItem.id !== item.id)
      );

      setNotification("Menu item deleted successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete menu item."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Filter by selected category
  const filteredItems =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter(
          (item) => item.category === activeCategory
        );

  // Format prices in Pakistani Rupees
  function formatPrice(price: string) {
    const value = Number(price);

    return `Rs. ${value.toLocaleString("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  // Icon and color for each category
  function getCategoryStyle(category: string) {
    switch (category) {
      case "Coffee":
        return {
          icon: <Coffee size={30} />,
          background: "bg-[#eee1ce]",
          color: "text-[#8f6544]",
        };

      case "Dessert":
        return {
          icon: <CakeSlice size={30} />,
          background: "bg-[#f1ddda]",
          color: "text-[#a76d70]",
        };

      case "Snacks":
        return {
          icon: <Sandwich size={30} />,
          background: "bg-[#e4ead9]",
          color: "text-[#71805b]",
        };

      default:
        return {
          icon: <CupSoda size={30} />,
          background: "bg-[#eee1ce]",
          color: "text-[#8f6544]",
        };
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8]">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-[#e9dece] bg-[#fffdf8]/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#38271e] text-[#fff8ec]">
              <Coffee size={22} />
            </span>

            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#38271e]">
                BrewHouse
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#9a785c]">
                Coffee & Comfort
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-9 text-sm font-medium text-[#5c4a3d] md:flex">
            <a href="#" className="hover:text-[#ac7b4f]">
              Home
            </a>
            <a href="#menu" className="hover:text-[#ac7b4f]">
              Our Menu
            </a>
            <a href="#about" className="hover:text-[#ac7b4f]">
              Our Story
            </a>
          </div>

          <a
            href="#menu"
            className="hidden rounded-full bg-[#38271e] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#65452f] md:inline-flex"
          >
            Explore Menu
          </a>

          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#38271e] md:hidden"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="flex flex-col gap-4 border-t border-[#e9dece] px-6 py-5 text-sm md:hidden">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </a>
            <a
              href="#menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              Our Menu
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
            >
              Our Story
            </a>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#f7f0e5]">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-12 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e2d4bf] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#94704f]">
              <span className="h-2 w-2 rounded-full bg-[#8a9576]" />
              Freshly brewed happiness
            </div>

            <h2 className="max-w-xl font-serif text-6xl leading-[1.08] font-semibold tracking-tight text-[#38271e] sm:text-7xl">
              Life begins
              <br />
              after{" "}
              <span className="italic text-[#a77b50]">
                coffee.
              </span>
            </h2>

            <p className="mt-8 max-w-md text-base leading-8 text-[#766556]">
              Your little corner of comfort. Discover thoughtfully
              crafted coffee, sweet moments, and everything that
              makes your day a little warmer.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#menu"
                className="inline-flex items-center gap-3 rounded-full bg-[#38271e] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#65452f]"
              >
                Discover Our Menu
                <ArrowRight size={17} />
              </a>

              <a
                href="#about"
                className="inline-flex items-center rounded-full border border-[#bba58e] px-7 py-4 text-sm font-semibold text-[#38271e] transition hover:bg-[#ece1d0]"
              >
                Our Story
              </a>
            </div>

            <div className="mt-14 flex flex-wrap gap-8 border-t border-[#e1d5c5] pt-7">
              <div className="flex items-center gap-3">
                <Coffee
                  className="text-[#a77b50]"
                  size={22}
                />
                <span className="text-xs font-medium text-[#655344]">
                  Crafted with care
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Heart
                  className="text-[#a77b50]"
                  size={22}
                />
                <span className="text-xs font-medium text-[#655344]">
                  Made with love
                </span>
              </div>
            </div>
          </div>

          {/* COFFEE ILLUSTRATION */}
          <div className="relative flex min-h-[380px] items-center justify-center rounded-[2rem] bg-[#e7d8c4] p-8 sm:min-h-[480px]">
            <div className="absolute left-6 top-7 rounded-full bg-[#fff9ed] px-5 py-3 text-xs font-semibold tracking-wider text-[#806245]">
              YOUR DAILY RITUAL
            </div>

            <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-[#d2b99a] shadow-[0_25px_60px_rgba(67,42,27,0.17)] sm:h-80 sm:w-80">
              <div className="flex h-52 w-52 items-center justify-center rounded-full border-[15px] border-[#fff9ef] bg-[#694432] shadow-lg sm:h-64 sm:w-64">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#a47754] sm:h-40 sm:w-40">
                  <Heart
                    size={65}
                    strokeWidth={1.7}
                    className="fill-[#f1dfc5] text-[#f1dfc5]"
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-7 right-6 rounded-2xl bg-[#fff9ef] px-6 py-4 shadow-lg">
              <p className="font-serif text-xl font-semibold text-[#38271e]">
                Brewed with love
              </p>
              <p className="mt-1 text-xs text-[#927965]">
                One cup at a time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="about" className="scroll-mt-24 bg-[#fffdf8] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 text-center md:grid-cols-3 lg:px-12">
          <div className="flex flex-col items-center gap-4">
            <Coffee
              size={32}
              className="text-[#a77b50]"
            />
            <h3 className="font-serif text-2xl text-[#38271e]">
              Quality Coffee
            </h3>
            <p className="max-w-xs text-sm leading-7 text-[#847367]">
              A comforting cup prepared with attention to every detail.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Leaf
              size={32}
              className="text-[#a77b50]"
            />
            <h3 className="font-serif text-2xl text-[#38271e]">
              Fresh Ingredients
            </h3>
            <p className="max-w-xs text-sm leading-7 text-[#847367]">
              Simple ingredients and delicious flavors in every serving.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <CupSoda
              size={32}
              className="text-[#a77b50]"
            />
            <h3 className="font-serif text-2xl text-[#38271e]">
              Cozy Moments
            </h3>
            <p className="max-w-xs text-sm leading-7 text-[#847367]">
              A warm and welcoming atmosphere for your daily break.
            </p>
          </div>
        </div>
      </section>

      {/* DYNAMIC MENU SECTION */}
      <section
        id="menu"
        className="scroll-mt-24 bg-[#f7f0e5] py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#a77b50]">
                Crafted for you
              </p>

              <h2 className="font-serif text-4xl font-semibold text-[#38271e] sm:text-5xl">
                Explore Our Menu
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#806d5d]">
                From rich espresso to delightful treats,
                discover something delicious in every category.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setFormError("");
                setShowAddForm(true);
              }}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#38271e] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#65452f]"
            >
              <Plus size={18} />
              Add Menu Item
            </button>
          </div>

          {/* SUCCESS NOTIFICATION */}
          {notification && (
            <div
              role="status"
              className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-[#b9cfaf] bg-[#e9f3e4] px-5 py-4 text-sm text-[#41643d]"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span>{notification}</span>
              </div>

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setNotification("")}
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* CATEGORY FILTERS */}
          <div className="mb-9 flex flex-wrap items-center justify-between gap-5">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    activeCategory === category
                      ? "bg-[#38271e] text-white"
                      : "border border-[#e1d4c3] bg-[#fffdf8] text-[#6e5949] hover:bg-[#eee2d2]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <span className="text-sm text-[#816d5b]">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div
              role="alert"
              className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e9b4aa] bg-[#fff0eb] p-5 text-[#9a453b]"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm">{error}</p>
              </div>

              <button
                type="button"
                onClick={refreshMenu}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div
              role="status"
              className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl bg-[#fffdf8]"
            >
              <Loader2
                size={36}
                className="animate-spin text-[#a77b50]"
              />
              <p className="text-sm text-[#806d5d]">
                Preparing your menu...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            /* EMPTY MENU */
            <div className="rounded-3xl border border-dashed border-[#cdbca7] bg-[#fffdf8] px-6 py-20 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f3e9db]">
                <Coffee
                  size={37}
                  className="text-[#a77b50]"
                />
              </div>

              <h3 className="font-serif text-3xl text-[#38271e]">
                No menu items found
              </h3>

              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#847367]">
                {activeCategory === "All"
                  ? "Your menu is empty. Add your first item to get started."
                  : `There are no items in the ${activeCategory} category yet.`}
              </p>

              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormError("");
                  setShowAddForm(true);
                }}
                className="mt-7 rounded-full bg-[#38271e] px-6 py-3 text-sm font-medium text-white"
              >
                Add Your First Item
              </button>
            </div>
          ) : (
            /* DATABASE MENU CARDS */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => {
                const style = getCategoryStyle(item.category);

                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[1.5rem] border border-[#eee3d6] bg-[#fffdf8] shadow-[0_6px_24px_rgba(56,39,30,0.035)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(56,39,30,0.09)]"
                  >
                    {/* CATEGORY VISUAL */}
                    <div
                      className={`relative flex h-44 items-center justify-center ${style.background}`}
                    >
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-white/60 bg-white/40 shadow-sm ${style.color}`}
                      >
                        {style.icon}
                      </div>

                      <span className="absolute left-5 top-5 rounded-full bg-[#fffdf8]/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#775b45]">
                        {item.category}
                      </span>
                    </div>

                    {/* ITEM DETAILS */}
                    <div className="p-6">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-serif text-2xl font-semibold leading-snug text-[#38271e]">
                          {item.name}
                        </h3>
                      </div>

                      <p className="min-h-[70px] text-sm leading-7 text-[#827165]">
                        {item.description}
                      </p>

                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#eee3d6] pt-5">
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-widest text-[#a48c77]">
                            Price
                          </span>

                          <p className="mt-1 text-xl font-bold text-[#8d6546]">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={deletingId !== null}
                          onClick={() => handleDeleteItem(item)}
                          aria-label={`Delete ${item.name}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#e8c9c4] bg-[#fff7f5] px-4 py-3 text-xs font-semibold text-[#aa5a51] transition hover:bg-[#fbe6e1] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* BOTTOM NOTE */}
          <div className="mt-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d8c8] bg-[#fffdf8] px-5 py-3 text-xs font-medium text-[#876f59]">
              <Leaf size={15} />
              Fresh choices, warm moments, better days
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#38271e] px-6 py-12 text-[#f8eee0]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Coffee size={26} />
            <span className="font-serif text-2xl font-semibold">
              BrewHouse
            </span>
          </div>

          <p className="text-center text-sm text-[#d2bda8]">
            Made for good coffee and great moments.
          </p>

          <p className="text-xs text-[#c0a994]">
            © BrewHouse Café
          </p>
        </div>
      </footer>

      {/* ADD ITEM MODAL */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#241811]/70 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-menu-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-[1.5rem] bg-[#fffdf8] shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-[#eee2d4] px-6 py-5 sm:px-8">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77b50]">
                  BrewHouse Menu
                </p>
                <h3
                  id="add-menu-title"
                  className="font-serif text-3xl font-semibold text-[#38271e]"
                >
                  Add Menu Item
                </h3>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowAddForm(false)}
                aria-label="Close form"
                className="rounded-full bg-[#f1e8db] p-3 text-[#38271e] hover:bg-[#e8dbc9] disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleAddItem}
              className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-7 sm:px-8"
            >
              <div>
                <label
                  htmlFor="item-name"
                  className="mb-2 block text-sm font-semibold text-[#4d382b]"
                >
                  Item Name
                </label>

                <input
                  id="item-name"
                  type="text"
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  placeholder="e.g. Vanilla Latte"
                  className="w-full rounded-xl border border-[#dfd1bf] bg-white px-4 py-3.5 text-sm text-[#38271e] outline-none placeholder:text-[#b2a495] focus:border-[#a77b50] focus:ring-2 focus:ring-[#a77b50]/15"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="item-price"
                    className="mb-2 block text-sm font-semibold text-[#4d382b]"
                  >
                    Price (PKR)
                  </label>

                  <input
                    id="item-price"
                    type="number"
                    required
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateForm("price", event.target.value)
                    }
                    placeholder="e.g. 650"
                    className="w-full rounded-xl border border-[#dfd1bf] bg-white px-4 py-3.5 text-sm text-[#38271e] outline-none placeholder:text-[#b2a495] focus:border-[#a77b50] focus:ring-2 focus:ring-[#a77b50]/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="item-category"
                    className="mb-2 block text-sm font-semibold text-[#4d382b]"
                  >
                    Category
                  </label>

                  <select
                    id="item-category"
                    value={form.category}
                    onChange={(event) =>
                      updateForm(
                        "category",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#dfd1bf] bg-white px-4 py-3.5 text-sm text-[#38271e] outline-none focus:border-[#a77b50] focus:ring-2 focus:ring-[#a77b50]/15"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="item-description"
                  className="mb-2 block text-sm font-semibold text-[#4d382b]"
                >
                  Description
                </label>

                <textarea
                  id="item-description"
                  required
                  rows={4}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe your delicious menu item..."
                  className="w-full resize-none rounded-xl border border-[#dfd1bf] bg-white px-4 py-3.5 text-sm leading-6 text-[#38271e] outline-none placeholder:text-[#b2a495] focus:border-[#a77b50] focus:ring-2 focus:ring-[#a77b50]/15"
                />
              </div>

              {/* FORM ERROR */}
              {formError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#a34d43]"
                >
                  <AlertCircle size={17} />
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#eee2d4] pt-5 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-full border border-[#dfd1bf] px-6 py-3.5 text-sm font-semibold text-[#655243] transition hover:bg-[#f3ebdf] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#38271e] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#65452f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Add to Menu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
