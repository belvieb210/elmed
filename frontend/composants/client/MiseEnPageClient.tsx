"use client";

import { BarreLaterale } from "@/composants/client/BarreLaterale";
import { EnTete } from "@/composants/client/EnTete";
import { useClient } from "@/store/contexteClient";

export function MiseEnPageClient({ children }: { children: React.ReactNode }) {
  const { chargement } = useClient();

  return (
    <div className="flex min-h-screen bg-fond-page">
      <BarreLaterale />
      <div className="flex min-w-0 flex-1 flex-col">
        <EnTete />
        <main className="flex-1 px-4 py-5 lg:px-6">
          {chargement ? (
            <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">
              Chargement de votre espace client...
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
