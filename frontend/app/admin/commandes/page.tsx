"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { classeStatut, formaterDate, formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import type { CommandeAdmin } from "@/types/modeles";

export default function PageCommandesAdmin() {
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);

  useEffect(() => {
    appelerApi<{ commandes: CommandeAdmin[] }>("/admin/commandes")
      .then((donnees) => setCommandes(donnees.commandes))
      .catch(() => setCommandes([]));
  }, []);

  return (
    <MiseEnPageAdmin titre="Commandes" sousTitre="Toutes les commandes clients">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Commande</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {commandes.map((commande) => (
                <tr key={commande.id} className="border-t border-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/commandes/${commande.id}`} className="font-semibold text-violet-marque">
                      #{commande.numeroCommande}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{commande.nomClient}</td>
                  <td className="px-4 py-3 text-slate-500">{formaterDate(commande.dateCommande)}</td>
                  <td className="px-4 py-3 font-medium">{formaterMontant(commande.montantTotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${classeStatut(commande.statut)}`}>
                      {commande.libelleStatut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {commandes.length === 0 && <p className="p-6 text-sm text-slate-400">Aucune commande enregistrée.</p>}
      </div>
    </MiseEnPageAdmin>
  );
}
