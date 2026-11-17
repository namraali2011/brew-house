
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewHouse | Coffee & Comfort",
  description:
    "Explore BrewHouse Café's delicious coffees, desserts, and freshly prepared treats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
