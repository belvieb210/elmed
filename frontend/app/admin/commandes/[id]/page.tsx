"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { classeStatut, formaterDate, formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";

const statuts = [
  "EN_ATTENTE",
  "VALIDEE",
  "EN_PREPARATION",
  "PRET_RETRAIT",
  "EXPEDIEE",
  "EN_ROUTE",
  "LIVREE",
  "ANNULEE",
];

export default function PageDetailCommandeAdmin() {
  const params = useParams<{ id: string }>();
  const [commande, setCommande] = useState<{
    id: string;
    numeroCommande: string;
    montantTotal: number;
    statut: string;
    libelleStatut: string;
    dateCommande: string;
    notes?: string | null;
    client: { nomComplet: string; email?: string | null; telephone?: string | null; nomSociete?: string | null };
    lignes: Array<{ id: string; nomProduit: string; quantite: number; prixUnitaire: number; sousTotal: number }>;
  } | null>(null);

  async function charger() {
    const donnees = await appelerApi<{ commande: NonNullable<typeof commande> }>(`/admin/commandes/${params.id}`);
    setCommande(donnees.commande);
  }

  useEffect(() => {
    void charger();
  }, [params.id]);

  async function changerStatut(statut: string) {
    await appelerApi(`/admin/commandes/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify({ statut }),
    });
    await charger();
  }

  if (!commande) {
    return (
      <MiseEnPageAdmin titre="Commande">
        <p className="text-sm text-slate-500">Chargement...</p>
      </MiseEnPageAdmin>
    );
  }

  return (
    <MiseEnPageAdmin titre={`Commande #${commande.numeroCommande}`} sousTitre={formaterDate(commande.dateCommande)}>
      <div className="mb-4">
        <Link href="/admin/commandes" className="text-sm font-medium text-violet-marque hover:underline">
          ← Toutes les commandes
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 lg:col-span-8">
          {commande.lignes.map((ligne) => (
            <div key={ligne.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3">
              <div>
                <p className="font-medium text-slate-800">{ligne.nomProduit}</p>
                <p className="text-xs text-slate-400">
                  {ligne.quantite} × {formaterMontant(ligne.prixUnitaire)}
                </p>
              </div>
              <p className="font-semibold">{formaterMontant(ligne.sousTotal)}</p>
            </div>
          ))}
          <p className="text-right text-lg font-semibold">{formaterMontant(commande.montantTotal)}</p>
        </section>
        <aside className="space-y-4 lg:col-span-4">
          <article className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm text-slate-500">Statut</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classeStatut(commande.statut)}`}>
              {commande.libelleStatut}
            </span>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Mettre à jour
              <select
                value={commande.statut}
                onChange={(e) => void changerStatut(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {statuts.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </article>
          <article className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-semibold text-slate-800">Client</p>
            <p className="mt-2 text-sm text-slate-700">{commande.client.nomSociete || commande.client.nomComplet}</p>
            {commande.client.email && <p className="text-xs text-slate-500">{commande.client.email}</p>}
            {commande.client.telephone && <p className="text-xs text-slate-500">{commande.client.telephone}</p>}
          </article>
        </aside>
      </div>
    </MiseEnPageAdmin>
  );
}
