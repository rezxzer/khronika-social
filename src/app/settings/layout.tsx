import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "პარამეტრები",
  description: "პროფილის და ანგარიშის პარამეტრები.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
