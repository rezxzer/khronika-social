import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "წრეები",
  description: "აღმოაჩინე და შეუერთდი წრეებს ქრონიკაში.",
};

export default function CirclesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
