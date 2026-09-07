"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { lienMessagerie } from "@/lib/compte";
import { useClient } from "@/store/contexteClient";

const CLE_ANCIENNE = "mm_bandeau_msg";
const CLE_MASQUAGE = "mm_bandeau_msg_jusqua";
const DUREE_MASQUAGE_MS = 5 * 60 * 1000;

function lireMasqueJusqua() {
  if (typeof window === "undefined") return 0;
  window.sessionStorage.removeItem(CLE_ANCIENNE);
  const jusqua = Number(window.localStorage.getItem(CLE_MASQUAGE) ?? 0);
  return Number.isFinite(jusqua) ? jusqua : 0;
}

export function BandeauMessagerie() {
  const chemin = usePathname();
  const { compteReel, menuMobileOuvert } = useClient();
  const [masqueJusqua, setMasqueJusqua] = useState(0);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    setMasqueJusqua(lireMasqueJusqua());
    setPret(true);
  }, []);

  useEffect(() => {
    if (!pret) return;
    const reste = masqueJusqua - Date.now();
    if (reste <= 0) {
      window.localStorage.removeItem(CLE_MASQUAGE);
      return;
    }
    const minuteur = window.setTimeout(() => {
      window.localStorage.removeItem(CLE_MASQUAGE);
      setMasqueJusqua(0);
    }, reste);
    return () => window.clearTimeout(minuteur);
  }, [masqueJusqua, pret]);

  const visible = pret && masqueJusqua <= Date.now();

  if (chemin === "/messagerie" || menuMobileOuvert || !visible) return null;

  function masquer() {
    const jusqua = Date.now() + DUREE_MASQUAGE_MS;
    window.localStorage.setItem(CLE_MASQUAGE, String(jusqua));
    setMasqueJusqua(jusqua);
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
          aria-label="Masquer le bandeau pendant 5 minutes"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
