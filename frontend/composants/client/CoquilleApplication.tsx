"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";

export function CoquilleApplication({ children }: { children: ReactNode }) {
  const chemin = usePathname();
  if (
    chemin.startsWith("/connexion") ||
    chemin.startsWith("/inscription") ||
    chemin.startsWith("/admin")
  ) {
    return children;
  }

  return <MiseEnPageClient>{children}</MiseEnPageClient>;
}
