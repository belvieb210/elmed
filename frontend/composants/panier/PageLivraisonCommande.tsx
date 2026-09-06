"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, FileText, MapPin, Package } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { BoutonRetourEtape, EtapesParcoursCommande } from "@/composants/panier/EtapesParcoursCommande";
import { classeBadgePaiement } from "@/composants/commandes/suivi";
import { appelerApi } from "@/lib/api";
import { formaterMontant } from "@/lib/formatage";
import type { DetailCommande } from "@/types/modeles";

export function PageLivraisonCommande() {
  const params = useSearchParams();
  const commandeId = params.get("commande");
  const [commande, setCommande] = useState<DetailCommande | null>(null);

  useEffect(() => {
    if (!commandeId) return;
    appelerApi<{ commande: DetailCommande }>(`/commandes/${commandeId}`).then((donnees) => {
      setCommande(donnees.commande);
    });
  }, [commandeId]);

  const paiement = commande?.paiement;
  const payee = paiement?.statut === "PAYE";
  const entrepot = commande?.entrepot;

  return (
    <MiseEnPageClient>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center gap-3">
          <BoutonRetourEtape
            href={commandeId ? `/commandes/${commandeId}` : "/commandes"}
            libelle="Retour à la commande"
          />
          <h1 className="text-2xl font-semibold text-slate-900">Livraison</h1>
        </div>
        <div className="mt-3">
          <EtapesParcoursCommande etapeCourante={4} retourAutorise={false} />
        </div>

        {!commandeId && (
          <p className="mt-8 text-sm text-slate-500">
            Aucune commande à afficher.{" "}
            <Link href="/panier" className="font-medium text-orange-paiement">
              Retour au panier
            </Link>
          </p>
        )}

        {commandeId && !commande && <p className="mt-8 text-sm text-slate-500">Chargement de la confirmation...</p>}

        {commande && (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm lg:col-span-7 xl:col-span-8">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="h-10 w-10" strokeWidth={3} />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-slate-900">
                {payee ? "Paiement confirmé avec succès" : "Commande enregistrée"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {payee
                  ? `Votre paiement de ${formaterMontant(paiement?.montant ?? commande.montantTotal)} a été traité. Commande ${commande.numeroCommande}.`
                  : `Votre commande ${commande.numeroCommande} a été transmise. Le paiement sera réglé au retrait ou à la livraison.`}
              </p>
              {paiement && (
                <p className="mt-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classeBadgePaiement(paiement.statut)}`}>
                    {paiement.libelleStatut} · {paiement.libelleMode}
                  </span>
                </p>
              )}
              <p className="mt-4 text-sm text-slate-500">
                Vérifiez le statut de la commande dans 1 à 2 heures. ELMED prépare maintenant l&apos;expédition ou le retrait.
              </p>
              <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href={`/commandes/${commande.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-orange-paiement px-5 py-3 text-sm font-bold text-white hover:bg-orange-paiement-fonce"
                >
                  Afficher les détails de la commande
                </Link>
                <Link
                  href={`/commandes/${commande.id}/facture`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  Voir la facture
                </Link>
              </div>
            </section>

            <aside className="space-y-4 lg:col-span-5 xl:col-span-4">
              <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Package className="h-4 w-4 text-orange-paiement" />
                  Livraison / retrait
                </h3>
                <p className="text-sm text-slate-600">{paiement?.libelleLivraison ?? "Retrait en entrepôt"}</p>
                {entrepot && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Point de retrait
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{entrepot.nom}</p>
                    <p className="text-xs text-slate-500">
                      {entrepot.adresse}, {entrepot.ville}
                    </p>
                    {entrepot.heures && <p className="mt-1 text-[11px] text-slate-400">{entrepot.heures}</p>}
                  </div>
                )}
              </article>
              <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Articles</h3>
                <ul className="space-y-2 text-sm">
                  {commande.lignes.map((ligne) => (
                    <li key={ligne.id} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate text-slate-700">
                        {ligne.quantite} × {ligne.nomProduit}
                      </span>
                      <span className="shrink-0 font-medium">{formaterMontant(ligne.sousTotal)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-slate-100 pt-3 text-right text-base font-bold">
                  {formaterMontant(commande.montantTotal)}
                </p>
              </article>
            </aside>
          </div>
        )}
      </div>
    </MiseEnPageClient>
  );
}
