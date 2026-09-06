"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formaterHeure, formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import type { FactureAttenteAdmin } from "@/types/modeles";

export function TableauFacturesEnAttente() {
  const [factures, setFactures] = useState<FactureAttenteAdmin[]>([]);

  useEffect(() => {
    appelerApi<{ factures: FactureAttenteAdmin[] }>("/admin/factures/attente")
      .then((donnees) => setFactures(donnees.factures))
      .catch(() => setFactures([]));
  }, []);

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
            ? "Partiellement payée"
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
          Clients en attente de paiement ({parClient.length})
        </h2>
        <Link href="/admin/commandes" className="text-sm font-medium text-violet-marque hover:underline">
          Voir tout
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">N°</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Provenance</th>
              <th className="px-4 py-3 font-medium">Produits</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Heure</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parClient.map((facture, index) => (
              <tr key={facture.clientId} className="border-t border-bleu-hero">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{facture.nomClient}</p>
                  <p className="text-[11px] uppercase tracking-wide text-sky-600">
                    Client{facture.nombreFactures > 1 ? ` · ${facture.nombreFactures} factures` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-500">{facture.provenance}</td>
                <td className="px-4 py-3">{facture.nombreArticles}</td>
                <td className="px-4 py-3 font-medium">{formaterMontant(facture.montantTotal)}</td>
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
                <td className="px-4 py-3 text-slate-500">{formaterHeure(facture.dateCommande)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${facture.clientId}?commande=${facture.id}`}
                    className="rounded-lg border border-bleu-hero px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ouvrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {parClient.length === 0 && <p className="px-4 py-6 text-sm text-slate-400">Aucune facture en attente.</p>}
    </section>
  );
}
