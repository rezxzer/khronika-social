import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ძებნა",
  description: "მოძებნე წრეები და პოსტები Khronika-ში",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
