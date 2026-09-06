"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Pill } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { chargerUrlPdf, ouvrirPdf, appelerApi } from "@/lib/api";
import { classeStatut, formaterHeure, formaterMontant } from "@/lib/formatage";
import type { CommandeAdmin } from "@/types/modeles";

function libelleStatutVente(commande: CommandeAdmin) {
  if (commande.statut === "LIVREE" || commande.statut === "CLOTUREE") return "Délivrée";
  if (commande.paiement?.statut === "PAYE") return "Payée";
  if (commande.paiement?.mode === "PAIEMENT_LIVRAISON") return "Paiement à la livraison";
  if (commande.paiement?.mode === "PAIEMENT_RETRAIT") return "Paiement au retrait";
  return commande.libelleStatut;
}

export function PageCommandesEnLigne() {
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [urlFacture, setUrlFacture] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function charger() {
    const donnees = await appelerApi<{ commandes: CommandeAdmin[] }>("/admin/commandes");
    setCommandes(donnees.commandes);
    setSelectionId((actuel) => actuel ?? donnees.commandes[0]?.id ?? null);
  }

  useEffect(() => {
    void charger().catch(() => setCommandes([]));
  }, []);

  const selection = useMemo(
    () => commandes.find((commande) => commande.id === selectionId) ?? null,
    [commandes, selectionId],
  );

  useEffect(() => {
    if (!selection) {
      setUrlFacture(null);
      return;
    }
    let ignore = false;
    let url: string | null = null;
    void chargerUrlPdf(`/admin/factures/${selection.id}/pdf`).then((cree) => {
      if (ignore) {
        URL.revokeObjectURL(cree);
        return;
      }
      url = cree;
      setUrlFacture(cree);
    }).catch(() => {
      if (!ignore) setUrlFacture(null);
    });
    return () => {
      ignore = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [selection?.id]);

  async function marquerDelivree() {
    if (!selection) return;
    setEnCours(true);
    try {
      await appelerApi(`/admin/commandes/${selection.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statut: "LIVREE" }),
      });
      await charger();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <MiseEnPageAdmin titre="Commandes" sousTitre="Ventes en ligne, paiement à la livraison ou au retrait">
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white xl:col-span-7">
          <div className="border-b border-bleu-hero px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Paiements validés ({commandes.length})
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Liste des ventes en ligne — sélectionnez une ligne pour le détail et la remise des médicaments.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">N° vente</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">N° client</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Heure paiement</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {commandes.map((commande, index) => {
                  const actif = commande.id === selectionId;
                  return (
                    <tr
                      key={commande.id}
                      onClick={() => setSelectionId(commande.id)}
                      className={`cursor-pointer border-t border-bleu-hero ${
                        actif ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-violet-marque">{commande.numeroCommande}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{commande.nomClient}</td>
                      <td className="px-4 py-3 text-slate-500">{commande.numeroClient || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-marque">
                          Client
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{formaterMontant(commande.montantTotal)}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {formaterHeure(commande.datePaiement || commande.dateCommande)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classeStatut(commande.statut)}`}>
                          {libelleStatutVente(commande)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {commandes.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400">Aucune commande en ligne pour le moment.</p>
          )}
        </section>

        <aside className="space-y-4 xl:col-span-5">
          {selection ? (
            <>
              <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
                <div className="flex items-center justify-between border-b border-bleu-hero px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-marque" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Facture {selection.numeroCommande}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void ouvrirPdf(`/admin/factures/${selection.id}/pdf`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-bleu-hero px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ouvrir
                  </button>
                </div>
                <div className="bg-slate-700 p-3">
                  {urlFacture ? (
                    <iframe title={`Facture ${selection.numeroCommande}`} src={urlFacture} className="h-[520px] w-full rounded-lg bg-white" />
                  ) : (
                    <div className="grid h-[520px] place-items-center rounded-lg bg-slate-800 text-sm text-slate-300">
                      Chargement de la facture...
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a8a]">Résumé du paiement</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Client</dt>
                    <dd className="font-semibold text-slate-800">{selection.nomClient}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">N° vente</dt>
                    <dd className="font-medium text-violet-marque">{selection.numeroCommande}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Montant</dt>
                    <dd className="font-semibold">{formaterMontant(selection.montantTotal)}</dd>
                  </div>
                  {(selection.montantPaye ?? 0) > 0 && (selection.resteAPayer ?? 0) > 0 && (
                    <>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Montant payé</dt>
                        <dd className="font-medium">{formaterMontant(selection.montantPaye ?? 0)}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Reste à payer</dt>
                        <dd className="font-semibold text-orange-600">{formaterMontant(selection.resteAPayer ?? 0)}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Statut</dt>
                    <dd>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classeStatut(selection.statut)}`}>
                        {libelleStatutVente(selection)}
                      </span>
                    </dd>
                  </div>
                  {selection.paiement && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Mode</dt>
                      <dd className="text-slate-700">{selection.paiement.libelleMode}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a8a]">Actions rapides</h3>
                <div className="mt-3 rounded-xl border border-bleu-hero px-4 py-6 text-center">
                  {selection.statut === "LIVREE" || selection.statut === "CLOTUREE" ? (
                    <>
                      <Pill className="mx-auto h-8 w-8 text-violet-marque" />
                      <p className="mt-3 text-sm font-medium text-slate-700">Médicaments déjà remis au client.</p>
                    </>
                  ) : (
                    <>
                      <Pill className="mx-auto h-8 w-8 text-bleu-hero" />
                      <p className="mt-3 text-sm text-slate-500">
                        {selection.paiement?.statut === "PAYE"
                          ? "Paiement reçu. Vous pouvez remettre les médicaments."
                          : "Paiement à encaisser à la livraison ou au retrait."}
                      </p>
                      <button
                        type="button"
                        disabled={enCours}
                        onClick={() => void marquerDelivree()}
                        className="mt-4 rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Marquer comme délivrée
                      </button>
                    </>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="grid min-h-80 place-items-center rounded-2xl border border-bleu-hero bg-white p-6 text-sm text-slate-400">
              Sélectionnez une commande pour afficher la facture.
            </section>
          )}
        </aside>
      </div>
    </MiseEnPageAdmin>
  );
}
