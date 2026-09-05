"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { appelerApi } from "@/lib/api";
import { classeStatut, formaterDate, formaterMontant, libelleStatutCommande } from "@/lib/formatage";

interface DetailCommande {
  id: string;
  numeroCommande: string;
  montantTotal: number;
  statut: string;
  libelleStatut: string;
  dateCommande: string;
  notes: string | null;
  lignes: {
    id: string;
    nomProduit: string;
    image: string | null;
    quantite: number;
    prixUnitaire: number;
    sousTotal: number;
  }[];
}

export default function PageDetailCommande() {
  const params = useParams<{ id: string }>();
  const [commande, setCommande] = useState<DetailCommande | null>(null);

  useEffect(() => {
    appelerApi<{ commande: DetailCommande }>(`/commandes/${params.id}`).then((donnees) => {
      setCommande(donnees.commande);
    });
  }, [params.id]);

  return (
    <MiseEnPageClient>
      {commande && (
        <>
          <EnTetePage
            titre={`Commande #${commande.numeroCommande}`}
            description={formaterDate(commande.dateCommande)}
          />
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${classeStatut(commande.statut)}`}>
            {commande.libelleStatut ?? libelleStatutCommande(commande.statut)}
          </span>
          <div className="mt-5 space-y-3">
            {commande.lignes.map((ligne) => (
              <article
                key={ligne.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4"
              >
                <img src={ligne.image ?? ""} alt={ligne.nomProduit} className="h-16 w-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{ligne.nomProduit}</p>
                  <p className="text-sm text-slate-500">
                    {ligne.quantite} × {formaterMontant(ligne.prixUnitaire)}
                  </p>
                </div>
                <p className="font-semibold">{formaterMontant(ligne.sousTotal)}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-lg font-semibold">Total : {formaterMontant(commande.montantTotal)}</p>
        </>
      )}
      <BandeauMessagerie />
    </MiseEnPageClient>
  );
}
