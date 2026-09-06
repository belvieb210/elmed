"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { lienMessagerie } from "@/lib/compte";
import { useClient } from "@/store/contexteClient";

const CLE_FERMETURE = "mm_bandeau_msg";

export function BandeauMessagerie() {
  const { compteReel, menuMobileOuvert } = useClient();
  const [ferme, setFerme] = useState(false);

  useEffect(() => {
    setFerme(sessionStorage.getItem(CLE_FERMETURE) === "1");
  }, []);

  if (menuMobileOuvert || ferme) return null;

  function masquer() {
    setFerme(true);
    sessionStorage.setItem(CLE_FERMETURE, "1");
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 lg:left-[286px]">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-bleu-hero bg-white/95 px-2 py-1.5 shadow-[0_8px_24px_rgba(79,116,255,0.14)] backdrop-blur-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-2">
        <p className="hidden min-w-0 flex-1 text-sm text-slate-600 sm:block">
          {compteReel
            ? "Des questions ? Notre équipe est disponible pour vous aider."
            : "Discutez d’un produit via « Discuter ici ». Un compte sert à retrouver vos conversations."}
        </p>
        <Link
          href={lienMessagerie(compteReel)}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-violet-marque px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-fonce sm:flex-none sm:px-4"
        >
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">{compteReel ? "Ouvrir la messagerie" : "Se connecter"}</span>
        </Link>
        <button
          type="button"
          onClick={masquer}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fermer le bandeau"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
