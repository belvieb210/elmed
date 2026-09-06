"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { ParcoursPaiement } from "@/composants/paiement/ParcoursPaiement";
import { useClient } from "@/store/contexteClient";

export default function RoutePaiement() {
  const routeur = useRouter();
  const { panier, utilisateur, chargerPanier, chargerTableauDeBord } = useClient();
  const [paiementReussi, setPaiementReussi] = useState(false);

  useEffect(() => {
    void chargerPanier();
  }, [chargerPanier]);

  const montant = panier?.montantTotal ?? 0;

  useEffect(() => {
    if (paiementReussi) return;
    if (panier && panier.articles.length === 0) {
      routeur.replace("/panier");
    }
  }, [panier, routeur, paiementReussi]);

  return (
    <MiseEnPageClient>
      <ParcoursPaiement
        montantCommande={montant}
        articles={panier?.articles ?? []}
        entrepot={panier?.entrepot}
        utilisateur={utilisateur}
        onFermer={() => routeur.push("/panier")}
        onSucces={(commande) => {
          setPaiementReussi(true);
          void chargerTableauDeBord();
          routeur.push(`/panier/livraison?commande=${commande.id}`);
        }}
      />
    </MiseEnPageClient>
  );
}
