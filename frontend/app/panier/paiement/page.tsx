"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { ParcoursPaiement } from "@/composants/paiement/ParcoursPaiement";
import { useClient } from "@/store/contexteClient";

export default function RoutePaiement() {
  const routeur = useRouter();
  const { panier, utilisateur, chargerPanier, chargerTableauDeBord } = useClient();

  useEffect(() => {
    void chargerPanier();
  }, [chargerPanier]);

  const montant = panier?.montantTotal ?? 0;

  useEffect(() => {
    if (panier && panier.articles.length === 0) {
      routeur.replace("/panier");
    }
  }, [panier, routeur]);

  return (
    <MiseEnPageClient>
      <ParcoursPaiement
        montantCommande={montant}
        articles={panier?.articles ?? []}
        entrepot={panier?.entrepot}
        utilisateur={utilisateur}
        onFermer={() => routeur.push("/panier")}
        onSucces={() => {
          void Promise.all([chargerPanier(), chargerTableauDeBord()]);
        }}
      />
    </MiseEnPageClient>
  );
}
