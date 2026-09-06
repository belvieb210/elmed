"use client";

import { Suspense } from "react";
import { PageLivraisonCommande } from "@/composants/panier/PageLivraisonCommande";

export default function RouteLivraison() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Chargement...</p>}>
      <PageLivraisonCommande />
    </Suspense>
  );
}
