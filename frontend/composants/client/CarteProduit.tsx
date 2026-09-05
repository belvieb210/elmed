"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { formaterMontant } from "@/lib/formatage";
import { useClient } from "@/store/contexteClient";
import type { Produit } from "@/types/modeles";

export function CarteProduit({ produit }: { produit: Produit }) {
  const { ajouterProduitAuPanier } = useClient();
  const [enCours, setEnCours] = useState(false);

  async function ajouter() {
    setEnCours(true);
    try {
      await ajouterProduitAuPanier(produit.id);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <article className="carte-douce overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <div className="aspect-[5/4] overflow-hidden bg-slate-100">
        <img
          src={produit.image ?? ""}
          alt={produit.nom}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium text-slate-800">{produit.nom}</h3>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{formaterMontant(produit.prix)}</p>
          <button
            type="button"
            onClick={ajouter}
            disabled={enCours}
            className="grid h-9 w-9 place-items-center rounded-xl bg-violet-marque text-white transition hover:bg-violet-fonce disabled:opacity-60"
            aria-label={`Ajouter ${produit.nom} au panier`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
