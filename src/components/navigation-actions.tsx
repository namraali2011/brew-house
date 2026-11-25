
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export const navStyles = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#352820] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#65452f] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77b50]",

  outline:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ded3c6] bg-white px-5 py-3 text-sm font-semibold text-[#352820] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#a77b50] hover:bg-[#f7f0e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a77b50]",

  danger:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ebd4cf] bg-[#fbf0ed] px-5 py-3 text-sm font-semibold text-[#a15243] transition-all duration-200 hover:bg-[#f3e0dc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a15243]",
};

export function NavButton({
  href,
  label,
  icon: Icon,
  variant = "outline",
  title,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "outline" | "danger";
  title?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={navStyles[variant]}
    >
      <Icon size={17} strokeWidth={2} />
      <span>{label}</span>
    </Link>
  );
}

// Export the interactive logout button
// from its own Client Component file.
export {
  NavigationLogoutButton,
} from "./navigation-logout-button";
