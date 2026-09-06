"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formaterHeure, formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import type { FactureAttenteAdmin } from "@/types/modeles";

export function TableauFacturesEnAttente({
  clientIdActif,
  rafraichir = 0,
  brouillon,
}: {
  clientIdActif?: string;
  rafraichir?: number;
  brouillon?: {
    nombreArticles: number;
    montantTotal: number;
    montantPaye: number;
    resteAPayer: number;
  };
}) {
  const routeur = useRouter();
  const [factures, setFactures] = useState<FactureAttenteAdmin[]>([]);

  const charger = useCallback(() => {
    appelerApi<{ factures: FactureAttenteAdmin[] }>("/admin/factures/attente")
      .then((donnees) => setFactures(donnees.factures))
      .catch(() => setFactures([]));
  }, []);

  useEffect(() => {
    charger();
  }, [charger, rafraichir]);

  useEvenementTempsReel("client", charger);
  useEvenementTempsReel("commande", charger);

  const parClient = useMemo(() => {
    const groupes = new Map<string, FactureAttenteAdmin & { nombreFactures: number }>();
    for (const facture of factures) {
      const actuel = groupes.get(facture.clientId);
      if (!actuel) {
        groupes.set(facture.clientId, { ...facture, nombreFactures: 1 });
        continue;
      }
      const plusRecent = new Date(facture.dateCommande) > new Date(actuel.dateCommande);
      groupes.set(facture.clientId, {
        ...actuel,
        id: plusRecent ? facture.id : actuel.id,
        dateCommande: plusRecent ? facture.dateCommande : actuel.dateCommande,
        provenance: plusRecent ? facture.provenance : actuel.provenance,
        nombreArticles: actuel.nombreArticles + facture.nombreArticles,
        montantTotal: actuel.montantTotal + facture.montantTotal,
        montantPaye: actuel.montantPaye + facture.montantPaye,
        resteAPayer: actuel.resteAPayer + facture.resteAPayer,
        statutPaiement:
          actuel.statutPaiement === "PARTIEL" || facture.statutPaiement === "PARTIEL" ? "PARTIEL" : "EN_ATTENTE",
        libelleStatut:
          actuel.statutPaiement === "PARTIEL" || facture.statutPaiement === "PARTIEL"
            ? "Avance à solder"
            : "À facturer",
        nombreFactures: actuel.nombreFactures + 1,
      });
    }
    return Array.from(groupes.values());
  }, [factures]);

  return (
    <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
      <div className="flex items-center justify-between border-b border-bleu-hero px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Clients en attente de facture ({parClient.length})
        </h2>
        <Link href="/admin/facturations" className="text-sm font-medium text-violet-marque hover:underline">
          Voir tout
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">N°</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Provenance</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Produits</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Heure</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parClient.map((facture, index) => {
              const href = facture.id
                ? `/admin/clients/${facture.clientId}?commande=${facture.id}`
                : `/admin/clients/${facture.clientId}`;
              const selectionne = facture.clientId === clientIdActif;
              const sansFacture = !facture.id;
              const nombreArticles =
                selectionne && brouillon ? brouillon.nombreArticles : facture.nombreArticles;
              const montantTotal = selectionne && brouillon ? brouillon.montantTotal : facture.montantTotal;
              const montantPaye = selectionne && brouillon ? brouillon.montantPaye : facture.montantPaye;
              const resteAPayer = selectionne && brouillon ? brouillon.resteAPayer : facture.resteAPayer;
              const afficherMontants = nombreArticles > 0 || montantTotal > 0;
              return (
                <tr
                  key={facture.clientId}
                  role="link"
                  tabIndex={0}
                  onClick={() => routeur.push(href)}
                  onKeyDown={(evenement) => {
                    if (evenement.key === "Enter" || evenement.key === " ") {
                      evenement.preventDefault();
                      routeur.push(href);
                    }
                  }}
                  className={`cursor-pointer border-t border-bleu-hero ${
                    selectionne ? "bg-sky-50" : "hover:bg-sky-50"
                  }`}
                >
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{facture.nomClient}</p>
                    <p className="text-[11px] uppercase tracking-wide text-sky-600">
                      {selectionne ? "Sélectionné" : "Client"}
                      {sansFacture
                        ? " · sans facture"
                        : facture.nombreFactures > 1
                          ? ` · ${facture.nombreFactures} factures`
                          : ""}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{facture.provenance}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{afficherMontants ? nombreArticles : "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{afficherMontants ? formaterMontant(montantTotal) : "—"}</p>
                    {montantPaye > 0 && (
                      <p className="text-[11px] text-slate-500">
                        Payé {formaterMontant(montantPaye)} · Reste {formaterMontant(resteAPayer)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        facture.statutPaiement === "PARTIEL"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {facture.libelleStatut}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{formaterHeure(facture.dateCommande)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={href}
                      onClick={(evenement) => evenement.stopPropagation()}
                      className="rounded-lg border border-bleu-hero px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {parClient.length === 0 && (
        <p className="px-4 py-6 text-sm text-slate-400">Aucun client en attente de facture.</p>
      )}
    </section>
  );
}
