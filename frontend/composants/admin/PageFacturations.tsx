"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Printer } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { appelerApi, chargerUrlPdf, ouvrirPdf } from "@/lib/api";
import { classeStatut, formaterHeure, formaterMontant } from "@/lib/formatage";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import type { FacturationAdmin } from "@/types/modeles";

export function PageFacturations() {
  const [factures, setFactures] = useState<FacturationAdmin[]>([]);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [urlFacture, setUrlFacture] = useState<string | null>(null);

  const charger = useCallback(() => {
    appelerApi<{ factures: FacturationAdmin[] }>("/admin/facturations")
      .then((donnees) => {
        setFactures(donnees.factures);
        setSelectionId((actuel) => actuel ?? donnees.factures[0]?.id ?? null);
      })
      .catch(() => setFactures([]));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEvenementTempsReel("commande", charger);
  useEvenementTempsReel("client", charger);

  const selection = useMemo(
    () => factures.find((facture) => facture.id === selectionId) ?? null,
    [factures, selectionId],
  );
  const peutImprimer = Boolean(selection && selection.statutPaiement === "PARTIEL" && selection.resteAPayer > 0);

  useEffect(() => {
    if (!selection) {
      setUrlFacture(null);
      return;
    }
    let ignore = false;
    let url: string | null = null;
    void chargerUrlPdf(`/admin/factures/${selection.id}/pdf`)
      .then((cree) => {
        if (ignore) {
          URL.revokeObjectURL(cree);
          return;
        }
        url = cree;
        setUrlFacture(cree);
      })
      .catch(() => {
        if (!ignore) setUrlFacture(null);
      });
    return () => {
      ignore = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [selection?.id]);

  return (
    <MiseEnPageAdmin titre="Facturations" sousTitre="Factures établies sur place — avance et solde">
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white xl:col-span-7">
          <div className="border-b border-bleu-hero px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Factures établies ({factures.length})
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Clients facturés ici. Pour une avance, imprimez puis établissez le solde.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">N° facture</th>
                  <th className="px-4 py-3 font-medium">Produits</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Heure</th>
                </tr>
              </thead>
              <tbody>
                {factures.map((facture, index) => {
                  const actif = facture.id === selectionId;
                  return (
                    <tr
                      key={facture.id}
                      onClick={() => setSelectionId(facture.id)}
                      className={`cursor-pointer border-t border-bleu-hero ${
                        actif ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{facture.nomClient}</p>
                        <p className="text-[11px] uppercase tracking-wide text-sky-600">
                          {facture.numeroClient || "Client"}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 font-medium text-violet-marque md:table-cell">
                        {facture.numeroRecu || facture.numeroCommande}
                      </td>
                      <td className="px-4 py-3">{facture.nombreArticles}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{formaterMontant(facture.montantTotal)}</p>
                        {facture.montantPaye > 0 && facture.resteAPayer > 0 && (
                          <p className="text-[11px] text-slate-500">
                            Payé {formaterMontant(facture.montantPaye)} · Reste {formaterMontant(facture.resteAPayer)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            facture.statutPaiement === "PARTIEL"
                              ? "bg-orange-100 text-orange-800"
                              : facture.statutPaiement === "PAYE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {facture.libelleStatut}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                        {formaterHeure(facture.dateCommande)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {factures.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400">Aucune facture établie pour le moment.</p>
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
                      Facture {selection.numeroRecu || selection.numeroCommande}
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
                    <iframe
                      title={`Facture ${selection.numeroCommande}`}
                      src={urlFacture}
                      className="h-[280px] w-full rounded-lg bg-white sm:h-[420px] xl:h-[520px]"
                    />
                  ) : (
                    <div className="grid h-[280px] place-items-center rounded-lg bg-slate-800 text-sm text-slate-300 sm:h-[420px]">
                      Chargement de la facture...
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a8a]">Résumé</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Client</dt>
                    <dd className="font-semibold text-slate-800">{selection.nomClient}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Montant</dt>
                    <dd className="font-semibold">{formaterMontant(selection.montantTotal)}</dd>
                  </div>
                  {selection.montantPaye > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Montant payé</dt>
                      <dd>{formaterMontant(selection.montantPaye)}</dd>
                    </div>
                  )}
                  {selection.resteAPayer > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Reste à payer</dt>
                      <dd className="font-semibold text-orange-600">{formaterMontant(selection.resteAPayer)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Statut</dt>
                    <dd>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classeStatut(selection.statutPaiement)}`}>
                        {selection.libelleStatut}
                      </span>
                    </dd>
                  </div>
                </dl>
              </section>

              {peutImprimer && (
                <section className="rounded-2xl border border-bleu-hero bg-white p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void ouvrirPdf(`/admin/factures/${selection.id}/pdf?type=proforma`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer proforma
                    </button>
                    <button
                      type="button"
                      onClick={() => void ouvrirPdf(`/admin/factures/${selection.id}/pdf`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer facture
                    </button>
                  </div>
                  <Link
                    href={`/admin/clients/${selection.clientId}?commande=${selection.id}`}
                    className="mt-3 inline-flex text-sm font-semibold text-violet-marque hover:underline"
                  >
                    Établir la facture solde
                  </Link>
                </section>
              )}
            </>
          ) : (
            <section className="grid min-h-80 place-items-center rounded-2xl border border-bleu-hero bg-white p-6 text-sm text-slate-400">
              Sélectionnez une facture pour l&apos;afficher.
            </section>
          )}
        </aside>
      </div>
    </MiseEnPageAdmin>
  );
}
