"use client";

import { createContext, useContext, type ReactNode } from "react";
import { BarreLaterale } from "@/composants/client/BarreLaterale";
import { EnTete } from "@/composants/client/EnTete";
import { useClient } from "@/store/contexteClient";

const CoquilleOuverte = createContext(false);

export function MiseEnPageClient({ children }: { children: ReactNode }) {
  const dejaEnCoquille = useContext(CoquilleOuverte);
  const { chargement } = useClient();

  if (dejaEnCoquille) return children;

  return (
    <CoquilleOuverte.Provider value={true}>
      <div className="min-h-dvh bg-fond-page">
        <BarreLaterale />
        <div className="flex min-h-dvh min-w-0 flex-col lg:pl-[270px]">
          <EnTete />
          <main className="flex-1 px-3 py-4 pb-[max(6.5rem,env(safe-area-inset-bottom))] sm:px-4 lg:px-6">
            {chargement ? (
              <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">
                Chargement...
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </CoquilleOuverte.Provider>
  );
}
