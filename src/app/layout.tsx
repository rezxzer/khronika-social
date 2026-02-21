import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "ქრონიკა — წრეებზე დაფუძნებული სოციალური ქსელი",
  description:
    "ქრონიკა არის წრეებზე (თემებზე) დაფუძნებული სოციალური ქსელი, სადაც კონტენტი არის ამბავი, სწავლება და მოწვევა.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body className={`${inter.className} antialiased`}>
        <Navbar />
        <main className="mx-auto max-w-[1100px] px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
