"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Download, MoreVertical, Smartphone } from "lucide-react";
import { formaterDateHeure, formaterMontant } from "@/lib/formatage";
import { ouvrirPdf } from "@/lib/api";
import type { CommandeResume } from "@/types/modeles";
import {
  classeBadgePaiement,
  classeBadgeStatut,
  etapesSuivi,
  indexEtape,
  libelleAffichageStatut,
} from "@/composants/commandes/suivi";

function StepperCommande({ statut }: { statut: string }) {
  const actif = indexEtape(statut);
  const annulee = actif < 0;

  return (
    <div className="w-full min-w-0">
      <div className="mb-2 flex items-center px-1">
        {etapesSuivi.map((etape, index) => {
          const complete = !annulee && index <= actif;
          return (
            <div key={etape} className="flex flex-1 items-center last:flex-none">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  complete ? "bg-bleu-hero" : annulee ? "bg-red-300" : "bg-slate-200"
                }`}
              />
              {index < etapesSuivi.length - 1 && (
                <span className={`h-0.5 flex-1 ${complete && index < actif ? "bg-bleu-hero" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        {etapesSuivi.map((etape) => (
          <span key={etape}>{etape}</span>
        ))}
      </div>
    </div>
  );
}

export function CarteCommande({
  commande,
  selectionnee,
  onSelection,
}: {
  commande: CommandeResume;
  selectionnee: boolean;
  onSelection: (id: string, cochee: boolean) => void;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState(false);
  const paiement = commande.paiement;
  const IconePaiement = paiement?.mode.startsWith("MOBILE_MONEY") ? Smartphone : CreditCard;

  async function telechargerFacture() {
    setPdfEnCours(true);
    try {
      await ouvrirPdf(`/commandes/${commande.id}/facture`);
    } finally {
      setPdfEnCours(false);
      setMenuOuvert(false);
    }
  }

  return (
    <article className="relative rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3 pr-8 lg:w-64 lg:pr-0">
          <input
            type="checkbox"
            checked={selectionnee}
            onChange={(evenement) => onSelection(commande.id, evenement.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-bleu-hero"
            aria-label={`Sélectionner ${commande.numeroCommande}`}
          />
          <img
            src={commande.image ?? ""}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">Commande #{commande.numeroCommande}</p>
            <p className="text-xs text-slate-400">{formaterDateHeure(commande.dateCommande)}</p>
            <span className="mt-1 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              Produits ({commande.nombreProduits ?? commande.nombreArticles ?? 0})
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start gap-2 lg:items-center">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classeBadgeStatut(commande.statut)}`}>
            {libelleAffichageStatut(commande.statut)}
          </span>
          <StepperCommande statut={commande.statut} />
        </div>

        <div className="flex items-center gap-2 lg:w-40">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-50 text-slate-500">
            <IconePaiement className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] text-slate-400">Paiement</p>
            <p className="text-sm font-medium text-slate-800">{paiement?.libelleMode ?? "Paiement à la commande"}</p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${classeBadgePaiement(paiement?.statut ?? "EN_ATTENTE")}`}
            >
              {paiement?.libelleStatut ?? "En attente"}
            </span>
          </div>
        </div>

        <div className="lg:w-28">
          <p className="text-[11px] text-slate-400">Total</p>
          <p className="text-sm font-semibold text-slate-900">{formaterMontant(commande.montantTotal)}</p>
        </div>

        <div className="flex items-center gap-2 lg:w-36 lg:flex-col lg:items-stretch">
          <Link
            href={`/commandes/${commande.id}`}
            className="rounded-xl bg-bleu-hero px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-600"
          >
            Voir détails
          </Link>
          <button
            type="button"
            onClick={telechargerFacture}
            disabled={pdfEnCours}
            className="inline-flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-bleu-hero disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {pdfEnCours ? "PDF..." : "Facture PDF"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOuvert((ouvert) => !ouvert)}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 lg:static"
          aria-label="Autres actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {menuOuvert && (
        <div className="absolute right-3 top-12 z-10 w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
          <Link
            href={`/commandes/${commande.id}`}
            className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setMenuOuvert(false)}
          >
            Voir les détails
          </Link>
          <button
            type="button"
            onClick={telechargerFacture}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Télécharger la facture
          </button>
        </div>
      )}
    </article>
  );
}
