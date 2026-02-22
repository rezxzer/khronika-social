import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "შეტყობინებები",
  description: "შენი შეტყობინებები ქრონიკაში.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
