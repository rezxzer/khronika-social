import { Metadata } from "next";

export const metadata: Metadata = {
  title: "შეტყობინებები",
  description: "პირადი მესიჯები",
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
