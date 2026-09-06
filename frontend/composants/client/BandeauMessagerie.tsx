"use client";

import Link from "next/link";
import { lienMessagerie } from "@/lib/compte";
import { useClient } from "@/store/contexteClient";

export function BandeauMessagerie() {
  const { compteReel, menuMobileOuvert } = useClient();

  if (menuMobileOuvert) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-20 lg:left-[286px]">
      <div className="pointer-events-auto flex flex-col gap-3 rounded-[1.75rem] border-2 border-bleu-hero bg-white px-4 py-3 shadow-[0_12px_40px_rgba(79,116,255,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-slate-600">
          {compteReel
            ? "Des questions ? Notre équipe est disponible pour vous aider."
            : "Discutez d’un produit via « Discuter ici ». Pour voir toutes vos conversations, connectez-vous."}
        </p>
        <Link
          href={lienMessagerie(compteReel)}
          className="inline-flex items-center justify-center rounded-full bg-violet-marque px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-fonce"
        >
          {compteReel ? "Ouvrir la messagerie" : "Se connecter pour l’historique"}
        </Link>
      </div>
    </div>
  );
}
