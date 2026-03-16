"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isMiniSitePage = pathname.startsWith("/s/") && pathname.length > 3;

  if (isMiniSitePage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <GlobalHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <GlobalFooter />
    </div>
  );
}
