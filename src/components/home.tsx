
"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Coffee,
  Menu,
  X,
  Leaf,
  CupSoda,
  Heart,
  CakeSlice,
  Sandwich,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import type { Category, MenuItem } from "@/lib/menu";
import { MenuImage } from "./menu-image";

type ApiResponse = {
  success: boolean;
  message: string;
  data?: MenuItem[];
  categories?: Category[];
};

export default function Home({ accountControls }: { accountControls: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load all records from NeonDB when the page opens
  useEffect(() => {
    let active = true;

    async function fetchMenu() {
      try {
        const response = await fetch("/api/menu", {
          cache: "no-store",
        });

        const result: ApiResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load the menu."
          );
        }

        if (active) {
          setMenuItems(result.data || []);
          setCategories(result.categories || []);
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

      const result: ApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load menu.");
      }

      setMenuItems(result.data || []);
      setCategories(result.categories || []);
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

  // Filter by selected category
  const selectedCategory = categories.find(({ id }) => id === activeCategory);
  const filteredItems =
    !selectedCategory
      ? menuItems
      : menuItems.filter(
          (item) => item.category_id === selectedCategory.id
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
        {accountControls}

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

          </div>

          {/* CATEGORY FILTERS */}
          <div className="mb-9 flex flex-wrap items-center justify-between gap-5">
            <div className="flex flex-wrap gap-3">
              {[{ id: null, name: "All" }, ...categories].map((category) => (
                <button
                  key={category.id ?? "all"}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    (selectedCategory?.id ?? null) === category.id
                      ? "bg-[#38271e] text-white"
                      : "border border-[#e1d4c3] bg-[#fffdf8] text-[#6e5949] hover:bg-[#eee2d2]"
                  }`}
                >
                  {category.name}
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
                {!selectedCategory
                  ? "The menu is currently empty."
                  : `There are no items in the ${selectedCategory.name} category yet.`}
              </p>


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
                      className={`relative flex aspect-[16/9] items-center justify-center ${style.background}`}
                    >
                      <MenuImage key={item.image_url ?? ""} url={item.image_url} fallback={
                        <div className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-white/60 bg-white/40 shadow-sm ${style.color}`}>
                          {style.icon}
                        </div>
                      } />

                      {!item.available && (
                        <span className="absolute bottom-4 right-4 rounded-full bg-[#38271e] px-3 py-1.5 text-xs font-semibold text-white">
                          Unavailable
                        </span>
                      )}

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

    </main>
  );
}

