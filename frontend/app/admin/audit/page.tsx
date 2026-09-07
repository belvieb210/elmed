"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, ShieldAlert } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { formaterDateHeure, libelleRole } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { estSuperAdmin } from "@/lib/roles";
import { useClient } from "@/store/contexteClient";

type EntreeAudit = {
  id: string;
  action: string;
  tableCible: string;
  details: string | null;
  adresseIp: string | null;
  dateAction: string;
  auteur: {
    id: string;
    nomComplet: string;
    email: string;
    role: string;
    photoProfil: string | null;
  } | null;
};

const filtresAction = [
  { valeur: "", libelle: "Toutes les actions" },
  { valeur: "CONNEXION", libelle: "Connexions" },
  { valeur: "ENREGISTREMENT_CLIENT", libelle: "Clients enregistrés" },
  { valeur: "ETABLISSEMENT_FACTURE", libelle: "Factures" },
  { valeur: "COMMANDE", libelle: "Commandes" },
  { valeur: "PAIEMENT", libelle: "Paiements" },
  { valeur: "CONSULTATION_PRODUIT", libelle: "Vues produits" },
  { valeur: "PRODUIT", libelle: "Catalogue produits" },
  { valeur: "PERSONNEL", libelle: "Personnel" },
];

export default function PageAuditAdmin() {
  const { utilisateur } = useClient();
  const superAdmin = estSuperAdmin(utilisateur?.role);
  const [entrees, setEntrees] = useState<EntreeAudit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [recherche, setRecherche] = useState("");
  const [action, setAction] = useState("");
  const [chargement, setChargement] = useState(false);

  const charger = useCallback(() => {
    if (!superAdmin) return;
    setChargement(true);
    const params = new URLSearchParams({
      page: String(page),
      limite: "40",
    });
    if (action) params.set("action", action);
    if (recherche.trim()) params.set("recherche", recherche.trim());

    appelerApi<{
      entrees: EntreeAudit[];
      total: number;
      pages: number;
    }>(`/admin/audit?${params}`)
      .then((donnees) => {
        setEntrees(donnees.entrees);
        setTotal(donnees.total);
        setPages(donnees.pages);
      })
      .catch(() => {
        setEntrees([]);
        setTotal(0);
      })
      .finally(() => setChargement(false));
  }, [superAdmin, page, action, recherche]);

  useEffect(() => {
    charger();
  }, [charger]);

  if (!superAdmin) {
    return (
      <MiseEnPageAdmin titre="Audit" sousTitre="Journal système">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-amber-700" />
          <p className="mt-3 text-sm font-semibold text-amber-900">
            Accès réservé au Super Admin
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Seul un compte Super Admin peut consulter le journal d’audit.
          </p>
        </div>
      </MiseEnPageAdmin>
    );
  }

  return (
    <MiseEnPageAdmin
      titre="Audit"
      sousTitre="Qui a fait quoi, quand — traçabilité complète du système"
    >
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-bleu-hero bg-white p-4 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Recherche
          </span>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={recherche}
              onChange={(e) => {
                setPage(1);
                setRecherche(e.target.value);
              }}
              placeholder="Nom, email, détail, action…"
              className="w-full rounded-2xl border border-bleu-hero py-2.5 pr-3 pl-10 text-sm outline-none"
            />
          </div>
        </label>
        <label className="block sm:w-64">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Filtre action
          </span>
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            className="mt-1.5 w-full rounded-2xl border border-bleu-hero px-3 py-2.5 text-sm outline-none"
          >
            {filtresAction.map((filtre) => (
              <option key={filtre.valeur || "all"} value={filtre.valeur}>
                {filtre.libelle}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bleu-hero px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Journal ({total} événement{total > 1 ? "s" : ""})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || chargement}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-bleu-hero px-3 py-1.5 text-xs font-semibold uppercase disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <span className="text-xs text-slate-500">
              {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages || chargement}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-bleu-hero px-3 py-1.5 text-xs font-semibold uppercase disabled:opacity-40"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date / heure</th>
                <th className="px-4 py-3 font-medium">Auteur</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Détails</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {entrees.map((entree) => (
                <tr key={entree.id} className="border-t border-bleu-hero align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {formaterDateHeure(entree.dateAction)}
                  </td>
                  <td className="px-4 py-3">
                    {entree.auteur ? (
                      <div>
                        <p className="font-medium text-slate-800">{entree.auteur.nomComplet}</p>
                        <p className="text-xs text-slate-400">
                          {libelleRole(entree.auteur.role)} · {entree.auteur.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Visiteur / système</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {entree.action}
                    </span>
                    <p className="mt-1 text-[11px] text-slate-400">{entree.tableCible}</p>
                  </td>
                  <td className="max-w-md px-4 py-3 text-slate-600">{entree.details || "—"}</td>
                  <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                    {entree.adresseIp || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {chargement && <p className="px-4 py-6 text-sm text-slate-400">Chargement du journal…</p>}
        {!chargement && entrees.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-400">
            Aucun événement pour le moment. Les actions (connexion, clients, factures, commandes,
            vues produits…) apparaîtront ici.
          </p>
        )}
      </section>
    </MiseEnPageAdmin>
  );
}
