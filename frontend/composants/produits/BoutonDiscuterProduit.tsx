"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { appelerApi } from "@/lib/api";

export function BoutonDiscuterProduit({
  produitId,
  variante = "fiche",
}: {
  produitId: string;
  variante?: "carte" | "fiche";
}) {
  const routeur = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function ouvrirDiscussion(evenement: MouseEvent) {
    evenement.preventDefault();
    evenement.stopPropagation();
    if (enCours) return;
    setEnCours(true);
    try {
      await appelerApi("/messagerie", {
        method: "POST",
        body: JSON.stringify({ produitId }),
      });
      routeur.push(`/messagerie?produit=${encodeURIComponent(produitId)}`);
    } catch {
      routeur.push(`/messagerie?produit=${encodeURIComponent(produitId)}`);
    } finally {
      setEnCours(false);
    }
  }

  const classeCarte =
    "shrink-0 rounded-full border border-bleu-hero bg-white px-2 py-1 text-[10px] font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60 sm:px-2.5 sm:text-[11px]";
  const classeFiche =
    "w-full rounded-full border border-bleu-hero bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60 sm:w-auto sm:px-5";

  return (
    <button
      type="button"
      onClick={ouvrirDiscussion}
      disabled={enCours}
      className={variante === "carte" ? classeCarte : classeFiche}
    >
      {enCours ? "..." : variante === "carte" ? "Discuter" : "Discuter ici"}
    </button>
  );
}
