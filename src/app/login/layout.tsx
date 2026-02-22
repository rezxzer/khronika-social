import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "შესვლა",
  description: "შედი ქრონიკაში და შეუერთდი წრეებს.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
