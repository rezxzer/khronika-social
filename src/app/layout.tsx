import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/page-transition";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-serif",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ქრონიკა — წრეებზე დაფუძნებული სოციალური ქსელი",
    template: "%s | ქრონიკა",
  },
  description:
    "ქრონიკა არის წრეებზე (თემებზე) დაფუძნებული სოციალური ქსელი, სადაც კონტენტი არის ამბავი, სწავლება და მოწვევა.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://khronika.ge"),
  openGraph: {
    type: "website",
    locale: "ka_GE",
    siteName: "ქრონიკა",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans flex min-h-svh flex-col antialiased`}>
        <Providers>
          <NextTopLoader
            color="#3B82F6"
            height={2}
            showSpinner={false}
            shadow={false}
          />
          <Navbar />
          <main className="mx-auto w-full max-w-[1100px] flex-1 px-3 py-4 pb-20 sm:px-6 sm:py-6 sm:pb-6">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <BottomNav />
          <Toaster position="top-center" />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
