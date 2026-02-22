"use client";

import { LeftSidebar } from "./left-sidebar";
import { RightSidebar } from "./right-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <LeftSidebar />
      <div className="min-w-0 flex-1">{children}</div>
      <RightSidebar />
    </div>
  );
}
