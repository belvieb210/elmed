"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Receipt,
  Search,
  ExternalLink,
} from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import {
  formaterDateCompacte,
  formaterDateHeure,
  formaterMontant,
  libelleStatutCommande,
  libelleStatutPaiement,
  libelleTypeDocument,
} from "@/lib/formatage";
import { appelerApi, ouvrirPdf, telechargerPdf } from "@/lib/api";

type DocumentAdmin = {
  id: string;
  typeDocument: string;
  numeroDocument: string;
  dateCreation: string;
  commandeId: string | null;
  numeroCommande: string | null;
  montantTotal: number | null;
  statutCommande: string | null;
  statutPaiement: string | null;
  modePaiement: string | null;
  nomClient: string;
  numeroClient: string | null;
  emailClient: string | null;
};

const LIMITE = 12;

const filtresType = [
  { valeur: "", libelle: "Tous" },
  { valeur: "FACTURE", libelle: "Factures" },
  { valeur: "PROFORMA", libelle: "Proformas" },
  { valeur: "BON_LIVRAISON", libelle: "Bons de livraison" },
  { valeur: "BON_CAISSE", libelle: "Bons de caisse" },
];

export default function PageDocumentsAdmin() {
  const [documents, setDocuments] = useState<DocumentAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [type, setType] = useState("");
  const [recherche, setRecherche] = useState("");
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [statistiques, setStatistiques] = useState<{ total: number; parType: Record<string, number> }>({
    total: 0,
    parType: {},
  });
  const [chargement, setChargement] = useState(false);
  const [erreurPdf, setErreurPdf] = useState<string | null>(null);
  const panneauRef = useRef<HTMLElement>(null);

  const selection = useMemo(
    () => documents.find((document) => document.id === selectionId) ?? null,
    [documents, selectionId],
  );

  function selectionner(id: string) {
    setSelectionId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      window.setTimeout(() => {
        panneauRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  const charger = useCallback(() => {
    setChargement(true);
    const params = new URLSearchParams({
      page: String(page),
      limite: String(LIMITE),
    });
    if (type) params.set("type", type);
    if (recherche.trim()) params.set("recherche", recherche.trim());

    appelerApi<{
      documents: DocumentAdmin[];
      total: number;
      pages: number;
      statistiques: { total: number; parType: Record<string, number> };
    }>(`/admin/documents?${params}`)
      .then((donnees) => {
        setDocuments(donnees.documents);
        setTotal(donnees.total);
        setPages(donnees.pages);
        setStatistiques(donnees.statistiques);
        setSelectionId((actuel) => {
          if (actuel && donnees.documents.some((item) => item.id === actuel)) return actuel;
          return donnees.documents[0]?.id ?? null;
        });
      })
      .catch(() => {
        setDocuments([]);
        setTotal(0);
      })
      .finally(() => setChargement(false));
  }, [page, type, recherche]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function ouvrirDocument(document: DocumentAdmin, options?: { telecharger?: boolean }) {
    if (!document.commandeId) {
      setErreurPdf("Aucune commande liée à ce document.");
      return;
    }
    setErreurPdf(null);
    const typeQuery = document.typeDocument === "PROFORMA" ? "?type=proforma" : "";
    const chemin = `/admin/factures/${document.commandeId}/pdf${typeQuery}`;
    try {
      if (options?.telecharger) {
        await telechargerPdf(
          chemin,
          `${document.typeDocument.toLowerCase()}-${document.numeroDocument}.pdf`,
        );
      } else {
        await ouvrirPdf(chemin);
      }
    } catch (err) {
      setErreurPdf(err instanceof Error ? err.message : "Ouverture du PDF impossible.");
    }
  }

  const cartes = [
    {
      libelle: "Total documents",
      valeur: statistiques.total,
      icone: FileText,
      nuance: "bg-slate-50 text-slate-700",
    },
    {
      libelle: "Factures",
      valeur: statistiques.parType.FACTURE ?? 0,
      icone: Receipt,
      nuance: "bg-emerald-50 text-emerald-800",
    },
    {
      libelle: "Proformas",
      valeur: statistiques.parType.PROFORMA ?? 0,
      icone: FileText,
      nuance: "bg-sky-50 text-sky-800",
    },
    {
      libelle: "Autres pièces",
      valeur:
        (statistiques.parType.BON_LIVRAISON ?? 0) +
        (statistiques.parType.BON_CAISSE ?? 0) +
        (statistiques.parType.AUTRE ?? 0),
      icone: FileText,
      nuance: "bg-violet-50 text-violet-800",
    },
  ];

  return (
    <MiseEnPageAdmin
      titre="Documents"
      sousTitre="Registre des factures, proformas et pièces commerciales"
    >
      {erreurPdf && (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {erreurPdf}
        </p>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cartes.map((carte) => {
          const Icone = carte.icone;
          return (
            <article
              key={carte.libelle}
              className={`rounded-2xl border border-bleu-hero px-4 py-4 ${carte.nuance}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                  {carte.libelle}
                </p>
                <Icone className="h-4 w-4 opacity-70" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{carte.valeur}</p>
            </article>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-bleu-hero bg-white p-4 lg:flex-row lg:items-end">
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
              placeholder="N° document, commande, client…"
              className="w-full rounded-2xl border border-bleu-hero py-2.5 pr-3 pl-10 text-sm outline-none"
            />
          </div>
        </label>
        <div className="flex flex-wrap gap-2">
          {filtresType.map((filtre) => (
            <button
              key={filtre.valeur || "tous"}
              type="button"
              onClick={() => {
                setPage(1);
                setType(filtre.valeur);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                type === filtre.valeur
                  ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                  : "border-bleu-hero bg-white text-slate-600"
              }`}
            >
              {filtre.libelle}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bleu-hero px-4 py-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Registre ({total})
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Page {page} / {pages}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || chargement}
                onClick={() => setPage((actuel) => Math.max(1, actuel - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-bleu-hero px-3 py-1.5 text-xs font-semibold uppercase disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <button
                type="button"
                disabled={page >= pages || chargement}
                onClick={() => setPage((actuel) => Math.min(pages, actuel + 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-bleu-hero px-3 py-1.5 text-xs font-semibold uppercase disabled:opacity-40"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-medium sm:px-4">Document</th>
                  <th className="px-3 py-3 font-medium sm:px-4">Type</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Client</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Montant</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => {
                  const actif = selectionId === document.id;
                  return (
                    <tr
                      key={document.id}
                      onClick={() => selectionner(document.id)}
                      className={`cursor-pointer border-t border-bleu-hero ${
                        actif ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-3 sm:px-4">
                        <p className="font-semibold text-slate-800">{document.numeroDocument}</p>
                        <p className="text-xs text-slate-400 sm:hidden">
                          {document.nomClient}
                          {document.montantTotal != null
                            ? ` · ${formaterMontant(document.montantTotal)}`
                            : ""}
                        </p>
                        <p className="hidden text-xs text-slate-400 sm:block">
                          {document.numeroCommande || "Sans commande"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 lg:hidden">
                          {formaterDateCompacte(document.dateCreation)}
                        </p>
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${
                            document.typeDocument === "FACTURE"
                              ? "bg-emerald-100 text-emerald-800"
                              : document.typeDocument === "PROFORMA"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {libelleTypeDocument(document.typeDocument)}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{document.nomClient}</td>
                      <td className="hidden px-4 py-3 font-medium text-slate-800 md:table-cell">
                        {document.montantTotal != null ? formaterMontant(document.montantTotal) : "—"}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                        {formaterDateHeure(document.dateCreation)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {chargement && <p className="px-4 py-6 text-sm text-slate-400">Chargement…</p>}
          {!chargement && documents.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400">
              Aucun document. Les factures établies depuis Facturations apparaîtront ici.
            </p>
          )}
        </section>

        <aside
          ref={panneauRef}
          className="scroll-mt-24 xl:sticky xl:top-[calc(var(--hauteur-en-tete)+1rem)] xl:col-span-4 xl:self-start"
        >
          {selection ? (
            <article className="space-y-4 rounded-2xl border border-bleu-hero bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Détail du document
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[#1e3a8a]">
                  {selection.numeroDocument}
                </h3>
                <p className="mt-1 text-sm text-violet-marque">
                  {libelleTypeDocument(selection.typeDocument)}
                </p>
              </div>

              <dl className="space-y-2.5 text-sm">
                {[
                  { label: "Client", valeur: selection.nomClient },
                  { label: "N° client", valeur: selection.numeroClient || "—" },
                  { label: "Email", valeur: selection.emailClient || "—" },
                  { label: "Commande", valeur: selection.numeroCommande || "—" },
                  {
                    label: "Montant",
                    valeur:
                      selection.montantTotal != null
                        ? formaterMontant(selection.montantTotal)
                        : "—",
                  },
                  {
                    label: "Statut commande",
                    valeur: selection.statutCommande
                      ? libelleStatutCommande(selection.statutCommande)
                      : "—",
                  },
                  {
                    label: "Paiement",
                    valeur: selection.statutPaiement
                      ? libelleStatutPaiement(selection.statutPaiement)
                      : "—",
                  },
                  { label: "Émis le", valeur: formaterDateHeure(selection.dateCreation) },
                ].map((ligne) => (
                  <div key={ligne.label} className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">{ligne.label}</dt>
                    <dd className="text-right font-medium text-[#1e3a8a]">{ligne.valeur}</dd>
                  </div>
                ))}
              </dl>

              <div className="grid gap-2 border-t border-bleu-hero pt-4">
                <button
                  type="button"
                  onClick={() => void ouvrirDocument(selection)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Eye className="h-4 w-4" />
                  Ouvrir le PDF
                </button>
                <button
                  type="button"
                  onClick={() => void ouvrirDocument(selection, { telecharger: true })}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </button>
                {selection.commandeId && (
                  <Link
                    href={`/admin/commandes/${selection.commandeId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Voir la commande
                  </Link>
                )}
              </div>
            </article>
          ) : (
            <article className="rounded-2xl border border-dashed border-bleu-hero bg-slate-50 p-6 text-center text-sm text-slate-400">
              Sélectionnez un document pour afficher le détail et les actions.
            </article>
          )}
        </aside>
      </div>
    </MiseEnPageAdmin>
  );
}
