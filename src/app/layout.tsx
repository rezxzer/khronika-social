import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

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
      <body className={`${inter.className} flex min-h-svh flex-col antialiased`}>
        <Navbar />
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
