"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { ParcoursPaiement } from "@/composants/paiement/ParcoursPaiement";
import { appelerApi } from "@/lib/api";
import { useClient } from "@/store/contexteClient";
import type { ArticlePanier, DetailCommande } from "@/types/modeles";

export default function RoutePaiementCommande() {
  const params = useParams<{ id: string }>();
  const routeur = useRouter();
  const { utilisateur, chargerTableauDeBord } = useClient();
  const [commande, setCommande] = useState<DetailCommande | null>(null);

  useEffect(() => {
    appelerApi<{ commande: DetailCommande }>(`/commandes/${params.id}`).then((donnees) => {
      if (donnees.commande.paiement?.statut === "PAYE") {
        routeur.replace(`/commandes/${params.id}`);
        return;
      }
      setCommande(donnees.commande);
    });
  }, [params.id, routeur]);

  if (!commande) {
    return (
      <MiseEnPageClient>
        <p className="text-sm text-slate-500">Chargement du paiement...</p>
      </MiseEnPageClient>
    );
  }

  const articles: ArticlePanier[] = commande.lignes.map((ligne) => ({
    id: ligne.id,
    produitId: ligne.id,
    nomProduit: ligne.nomProduit,
    sku: ligne.sku ?? "",
    image: ligne.image,
    quantite: ligne.quantite,
    prixUnitaire: ligne.prixUnitaire,
    sousTotal: ligne.sousTotal,
  }));

  return (
    <MiseEnPageClient>
      <ParcoursPaiement
        montantCommande={commande.montantTotal}
        articles={articles}
        entrepot={commande.entrepot}
        utilisateur={utilisateur}
        commandeId={commande.id}
        onFermer={() => routeur.push(`/commandes/${commande.id}`)}
        onSucces={(payee) => {
          void chargerTableauDeBord();
          routeur.push(`/panier/livraison?commande=${payee.id}`);
        }}
      />
    </MiseEnPageClient>
  );
}
