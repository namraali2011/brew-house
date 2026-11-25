export type Category = { id: number; name: string };
export type MenuItem = {
  id: number;
  name: string;
  price: string;
  description: string;
  category: string;
  category_id: number;
  available: boolean;
  image_url: string | null;
};
export type BookingSettings = { enabled: boolean; slot_minutes: number };

export function validId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 2147483647;
}

export function parseImageUrl(value: unknown): string | null | undefined {
  if (value === null || (typeof value === "string" && !value.trim())) return null;
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href.length <= 2048 ? url.href : undefined;
  } catch {
    return undefined;
  }
}
