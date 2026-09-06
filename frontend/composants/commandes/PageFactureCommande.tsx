"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { ApercuProforma } from "@/composants/documents/ApercuProforma";
import { classeBadgePaiement } from "@/composants/commandes/suivi";
import { appelerApi, ouvrirPdf } from "@/lib/api";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import { formaterDate } from "@/lib/formatage";
import type { DetailCommande } from "@/types/modeles";

export function PageFactureCommande() {
  const params = useParams<{ id: string }>();
  const [commande, setCommande] = useState<DetailCommande | null>(null);
  const [pdfEnCours, setPdfEnCours] = useState(false);

  const charger = useCallback(() => {
    appelerApi<{ commande: DetailCommande }>(`/commandes/${params.id}`).then((donnees) => {
      setCommande(donnees.commande);
    });
  }, [params.id]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEvenementTempsReel("commande", charger);
  useEvenementTempsReel("notification", charger);

  async function telecharger() {
    if (!commande) return;
    setPdfEnCours(true);
    try {
      await ouvrirPdf(`/commandes/${commande.id}/facture`);
    } finally {
      setPdfEnCours(false);
    }
  }

  if (!commande) {
    return (
      <MiseEnPageClient>
        <p className="text-sm text-slate-500">Chargement de la facture...</p>
      </MiseEnPageClient>
    );
  }

  const paiement = commande.paiement;
  const nomClient =
    [commande.client?.nomSociete, commande.client?.nomComplet].filter(Boolean).join(" — ") || "Client";

  return (
    <MiseEnPageClient>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <EnTetePage
          titre={`Facture ${commande.numeroCommande}`}
          description="Le statut de paiement est le même que sur la commande."
        />
        <div className="flex flex-wrap items-center gap-2">
          {paiement && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classeBadgePaiement(paiement.statut)}`}>
              {paiement.libelleStatut}
            </span>
          )}
          <Link
            href={`/commandes/${commande.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-bleu-hero bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la commande
          </Link>
          <button
            type="button"
            onClick={telecharger}
            disabled={pdfEnCours}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {pdfEnCours ? "PDF..." : "Télécharger le PDF"}
          </button>
        </div>
      </div>

      <ApercuProforma
        articles={commande.lignes.map((ligne) => ({
          id: ligne.id,
          nomProduit: ligne.nomProduit,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          sousTotal: ligne.sousTotal,
        }))}
        montantTotal={commande.montantTotal}
        nomClient={nomClient}
        numero={commande.numeroCommande}
        dateTexte={formaterDate(commande.dateCommande)}
        titreDocument="FACTURE"
        paiement={
          paiement
            ? {
                statut: paiement.statut,
                libelleStatut: paiement.libelleStatut,
                libelleMode: paiement.libelleMode,
              }
            : { statut: "EN_ATTENTE", libelleStatut: "En attente", libelleMode: "Paiement" }
        }
      />
    </MiseEnPageClient>
  );
}
