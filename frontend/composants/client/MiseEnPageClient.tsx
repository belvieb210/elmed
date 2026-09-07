"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { BarreLaterale } from "@/composants/client/BarreLaterale";
import { EnTete } from "@/composants/client/EnTete";
import { useClient } from "@/store/contexteClient";

const CoquilleOuverte = createContext(false);

export function MiseEnPageClient({ children }: { children: ReactNode }) {
  const dejaEnCoquille = useContext(CoquilleOuverte);
  const { chargement } = useClient();
  const chemin = usePathname();
  const pageMessagerie = chemin === "/messagerie";

  if (dejaEnCoquille) return children;

  return (
    <CoquilleOuverte.Provider value={true}>
      <div className="min-h-dvh overflow-x-clip bg-fond-page">
        <BarreLaterale />
        <div className="min-w-0 lg:pl-[270px]">
          <EnTete />
          <div className="h-[var(--hauteur-en-tete)]" aria-hidden />
          <main
            className={`safe-pad-x px-3 py-4 sm:px-4 lg:px-6 ${
              pageMessagerie
                ? "pb-[max(1rem,env(safe-area-inset-bottom))]"
                : "pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"
            }`}
          >
            {chargement ? (
              <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">
                Chargement...
              </div>
            ) : (
              children
            )}
          </main>
          <BandeauMessagerie />
        </div>
      </div>
    </CoquilleOuverte.Provider>
  );
}
