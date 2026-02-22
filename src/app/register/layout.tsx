import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "რეგისტრაცია",
  description: "შექმენი ანგარიში ქრონიკაში — წრეებზე დაფუძნებული სოციალური ქსელი.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
