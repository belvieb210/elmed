"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { BarreLateraleAdmin } from "@/composants/admin/BarreLateraleAdmin";
import { appelerApi } from "@/lib/api";
import { formaterDateCourte } from "@/lib/formatage";
import { useClient } from "@/store/contexteClient";

export function MiseEnPageAdmin({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre?: string;
  children: ReactNode;
}) {
  const { chargement, definirMenuMobileOuvert } = useClient();
  const [badges, setBadges] = useState({ commandesAujourdhui: 0, messagesNonLus: 0 });

  useEffect(() => {
    appelerApi<{ badges: { commandesAujourdhui: number; messagesNonLus: number } }>("/admin/badges")
      .then((donnees) => setBadges(donnees.badges))
      .catch(() => undefined);
  }, []);

  if (chargement) {
    return (
      <div className="grid min-h-screen place-items-center bg-fond-page text-sm text-slate-500">
        Chargement de l&apos;administration...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-fond-page">
      <BarreLateraleAdmin
        commandesAujourdhui={badges.commandesAujourdhui}
        messagesNonLus={badges.messagesNonLus}
      />
      <div className="min-w-0 lg:pl-[280px]">
        <header className="fixed inset-x-0 top-0 z-40 h-[var(--hauteur-en-tete)] border-b-2 border-bleu-hero bg-white px-3 pt-[env(safe-area-inset-top)] sm:px-5 lg:left-[280px] lg:px-6">
          <div className="flex h-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-bleu-hero p-2 text-bleu-hero lg:hidden"
                onClick={() => definirMenuMobileOuvert(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">{titre}</h1>
                {sousTitre && <p className="truncate text-sm text-slate-400">{sousTitre}</p>}
              </div>
            </div>
            <div className="hidden shrink-0 rounded-xl border border-bleu-hero bg-white px-3 py-2 text-sm text-slate-600 sm:block">
              {formaterDateCourte()}
            </div>
          </div>
        </header>
        <div className="h-[var(--hauteur-en-tete)]" aria-hidden />
        <main className="px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
