"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, ExternalLink, FileText, ListChecks, Pill, Printer, SlidersHorizontal } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { chargerUrlPdf, ouvrirPdf, appelerApi } from "@/lib/api";
import { classeStatut, formaterHeure, formaterMontant } from "@/lib/formatage";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import type { CommandeAdmin } from "@/types/modeles";

const CLIENTS_PAR_PAGE = 15;
const COMMANDES_PAR_PAGE = 8;

type FiltresVentes = {
  nom: string;
  numeroClient: string;
  numeroVente: string;
  statut: string;
  du: string;
  au: string;
};

const filtresVides: FiltresVentes = {
  nom: "",
  numeroClient: "",
  numeroVente: "",
  statut: "Tous",
  du: "",
  au: "",
};

function libelleStatutVente(commande: CommandeAdmin) {
  if (commande.statut === "LIVREE" || commande.statut === "CLOTUREE") return "Délivrée";
  if (commande.paiement?.statut === "PAYE") return "Payée";
  if (commande.paiement?.mode === "PAIEMENT_LIVRAISON") return "Paiement à la livraison";
  if (commande.paiement?.mode === "PAIEMENT_RETRAIT") return "Paiement au retrait";
  return commande.libelleStatut;
}

function cleClient(commande: CommandeAdmin) {
  return commande.clientId || commande.numeroClient || commande.nomClient;
}

function nombreFiltresActifs(filtres: FiltresVentes) {
  return [
    filtres.nom,
    filtres.numeroClient,
    filtres.numeroVente,
    filtres.statut !== "Tous" ? filtres.statut : "",
    filtres.du,
    filtres.au,
  ].filter(Boolean).length;
}

export function PageCommandesEnLigne() {
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [filtres, setFiltres] = useState<FiltresVentes>(filtresVides);
  const [filtresAppliques, setFiltresAppliques] = useState<FiltresVentes>(filtresVides);
  const [pageClients, setPageClients] = useState(1);
  const [pageCommandes, setPageCommandes] = useState(1);
  const [clientOuvertId, setClientOuvertId] = useState<string | null>(null);
  const [selectionIds, setSelectionIds] = useState<string[]>([]);
  const [urlsFactures, setUrlsFactures] = useState<Array<{ id: string; url: string; numero: string }>>([]);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(async () => {
    const donnees = await appelerApi<{ commandes: CommandeAdmin[] }>("/admin/commandes");
    setCommandes(donnees.commandes);
    setSelectionIds((actuels) => {
      if (actuels.length > 0) return actuels.filter((id) => donnees.commandes.some((commande) => commande.id === id));
      return donnees.commandes[0] ? [donnees.commandes[0].id] : [];
    });
  }, []);

  useEffect(() => {
    void charger().catch(() => setCommandes([]));
  }, [charger]);

  useEvenementTempsReel("commande", charger);

  const groupes = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        nomClient: string;
        numeroClient: string;
        commandes: CommandeAdmin[];
      }
    >();
    for (const commande of commandes) {
      if (!correspondFiltres(commande, filtresAppliques)) continue;
      const id = cleClient(commande);
      const actuel = map.get(id);
      if (actuel) {
        actuel.commandes.push(commande);
        continue;
      }
      map.set(id, {
        id,
        nomClient: commande.nomClient,
        numeroClient: commande.numeroClient || "—",
        commandes: [commande],
      });
    }
    return Array.from(map.values()).map((groupe) => {
      const plusRecente = groupe.commandes[0];
      return {
        ...groupe,
        montantTotal: groupe.commandes.reduce((somme, commande) => somme + commande.montantTotal, 0),
        datePaiement: plusRecente.datePaiement || plusRecente.dateCommande,
        statut: plusRecente.statut,
        libelleStatut: libelleStatutGroupe(groupe.commandes),
        commandeRecente: plusRecente,
      };
    });
  }, [commandes, filtresAppliques]);

  const pagesClients = Math.max(1, Math.ceil(groupes.length / CLIENTS_PAR_PAGE));
  const clientsPage = groupes.slice((pageClients - 1) * CLIENTS_PAR_PAGE, pageClients * CLIENTS_PAR_PAGE);
  const clientOuvert = groupes.find((groupe) => groupe.id === clientOuvertId) ?? null;
  const pagesCommandes = Math.max(1, Math.ceil((clientOuvert?.commandes.length ?? 0) / COMMANDES_PAR_PAGE));
  const commandesPage = (clientOuvert?.commandes ?? []).slice(
    (pageCommandes - 1) * COMMANDES_PAR_PAGE,
    pageCommandes * COMMANDES_PAR_PAGE,
  );
  const selectionnees = commandes.filter((commande) => selectionIds.includes(commande.id));
  const premiereSelection = selectionnees[0] ?? null;
  const actifs = nombreFiltresActifs(filtresAppliques);

  useEffect(() => {
    if (pageClients > pagesClients) setPageClients(pagesClients);
  }, [pageClients, pagesClients]);

  useEffect(() => {
    if (pageCommandes > pagesCommandes) setPageCommandes(pagesCommandes);
  }, [pageCommandes, pagesCommandes]);

  useEffect(() => {
    if (selectionnees.length === 0) {
      setUrlsFactures([]);
      return;
    }
    let ignore = false;
    const urls: string[] = [];
    void Promise.all(
      selectionnees.map(async (commande) => {
        const url = await chargerUrlPdf(`/admin/factures/${commande.id}/pdf`);
        urls.push(url);
        return { id: commande.id, url, numero: commande.numeroCommande };
      }),
    )
      .then((chargees) => {
        if (ignore) {
          for (const item of chargees) URL.revokeObjectURL(item.url);
          return;
        }
        setUrlsFactures(chargees);
      })
      .catch(() => {
        if (!ignore) setUrlsFactures([]);
      });
    return () => {
      ignore = true;
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [selectionIds.join("|")]);

  function ouvrirClient(groupe: (typeof groupes)[number]) {
    if (groupe.commandes.length === 1) {
      setClientOuvertId(null);
      setSelectionIds([groupe.commandeRecente.id]);
      return;
    }
    setClientOuvertId((actuel) => {
      const suivant = actuel === groupe.id ? null : groupe.id;
      if (suivant) {
        setPageCommandes(1);
        setSelectionIds([groupe.commandeRecente.id]);
      }
      return suivant;
    });
  }

  function basculerCommande(id: string) {
    setSelectionIds((actuels) => (actuels.includes(id) ? actuels.filter((item) => item !== id) : [...actuels, id]));
  }

  function selectionnerToutesDuClient() {
    if (!clientOuvert) {
      const ids = clientsPage.flatMap((groupe) => groupe.commandes.map((commande) => commande.id));
      setSelectionIds(ids);
      return;
    }
    setSelectionIds(clientOuvert.commandes.map((commande) => commande.id));
  }

  async function marquerDelivree() {
    if (!premiereSelection) return;
    setEnCours(true);
    try {
      await appelerApi(`/admin/commandes/${premiereSelection.id}`, {
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
        <section className="min-w-0 overflow-hidden rounded-2xl border border-bleu-hero bg-white xl:col-span-8">
          <div className="flex items-start justify-between gap-3 border-b border-bleu-hero px-4 py-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Paiements validés ({groupes.length})
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Liste des ventes en ligne — développez un client pour voir ses commandes.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltresOuverts((actuel) => !actuel)}
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-bleu-hero bg-white text-slate-700"
                aria-label="Filtrer les commandes"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-slate-600 text-[10px] text-white">
                  {actifs}
                </span>
              </button>
              <button
                type="button"
                onClick={selectionnerToutesDuClient}
                className="grid h-9 w-9 place-items-center rounded-xl border border-bleu-hero bg-white text-slate-700"
                aria-label="Sélectionner toutes les commandes"
              >
                <ListChecks className="h-4 w-4" />
              </button>
            </div>
          </div>

          {filtresOuverts && (
            <div className="border-b border-bleu-hero px-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ChampFiltre label="Client" valeur={filtres.nom} onChange={(valeur) => setFiltres({ ...filtres, nom: valeur })} />
                <ChampFiltre
                  label="N° client"
                  valeur={filtres.numeroClient}
                  onChange={(valeur) => setFiltres({ ...filtres, numeroClient: valeur })}
                />
                <ChampFiltre
                  label="N° vente"
                  valeur={filtres.numeroVente}
                  onChange={(valeur) => setFiltres({ ...filtres, numeroVente: valeur })}
                />
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Statut
                  <select
                    value={filtres.statut}
                    onChange={(e) => setFiltres({ ...filtres, statut: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-bleu-hero px-3 py-2.5 text-sm"
                  >
                    <option>Tous</option>
                    <option>Payée</option>
                    <option>Délivrée</option>
                    <option>Paiement à la livraison</option>
                    <option>Paiement au retrait</option>
                  </select>
                </label>
                <ChampFiltre label="Du" type="date" valeur={filtres.du} onChange={(valeur) => setFiltres({ ...filtres, du: valeur })} />
                <ChampFiltre label="Au" type="date" valeur={filtres.au} onChange={(valeur) => setFiltres({ ...filtres, au: valeur })} />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFiltres(filtresVides);
                    setFiltresAppliques(filtresVides);
                    setPageClients(1);
                  }}
                  className="rounded-xl border border-bleu-hero px-3 py-2 text-sm"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltresAppliques(filtres);
                    setFiltresOuverts(false);
                    setPageClients(1);
                  }}
                  className="rounded-xl bg-[#1e3a8a] px-3 py-2 text-sm font-semibold text-white"
                >
                  Rechercher
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">N°</th>
                  <th className="px-4 py-3 font-medium">N° vente</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">N° client</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Type</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Heure</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {clientsPage.map((groupe, index) => {
                  const ouvert = clientOuvertId === groupe.id;
                  const actif = groupe.commandes.some((commande) => selectionIds.includes(commande.id));
                  return (
                    <ClientRows
                      key={groupe.id}
                      index={(pageClients - 1) * CLIENTS_PAR_PAGE + index + 1}
                      groupe={groupe}
                      ouvert={ouvert}
                      actif={actif}
                      commandesPage={ouvert ? commandesPage : []}
                      pageCommandes={pageCommandes}
                      pagesCommandes={pagesCommandes}
                      selectionIds={selectionIds}
                      onOuvrir={() => ouvrirClient(groupe)}
                      onChoisir={(id) => setSelectionIds([id])}
                      onBasculer={basculerCommande}
                      onPageCommandes={setPageCommandes}
                      onSelectionnerToutes={selectionnerToutesDuClient}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          {groupes.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400">Aucune commande en ligne pour le moment.</p>
          )}
          <Pagination
            page={pageClients}
            pages={pagesClients}
            total={groupes.length}
            libelle="client(s)"
            onPage={setPageClients}
          />
        </section>

        <aside className="min-w-0 space-y-4 xl:col-span-4">
          {premiereSelection ? (
            <>
              <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
                <div className="flex items-center justify-between border-b border-bleu-hero px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-marque" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {selectionnees.length > 1
                        ? `Factures sélectionnées (${selectionnees.length})`
                        : `Facture ${premiereSelection.numeroCommande}`}
                    </h2>
                  </div>
                  {selectionnees.length === 1 && (
                    <button
                      type="button"
                      onClick={() => void ouvrirPdf(`/admin/factures/${premiereSelection.id}/pdf`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-bleu-hero px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ouvrir
                    </button>
                  )}
                </div>
                <div className="space-y-3 bg-slate-700 p-3">
                  {urlsFactures.length === 0 ? (
                    <div className="grid h-[280px] place-items-center rounded-lg bg-slate-800 text-sm text-slate-300 sm:h-[420px]">
                      Chargement de la facture...
                    </div>
                  ) : (
                    urlsFactures.map((facture) => (
                      <div key={facture.id}>
                        {selectionnees.length > 1 && (
                          <div className="mb-2 flex items-center justify-between text-xs text-white">
                            <span>{facture.numero}</span>
                            <button
                              type="button"
                              onClick={() => void ouvrirPdf(`/admin/factures/${facture.id}/pdf`)}
                              className="rounded-lg border border-white/40 px-2 py-1"
                            >
                              Ouvrir
                            </button>
                          </div>
                        )}
                        <iframe
                          title={`Facture ${facture.numero}`}
                          src={facture.url}
                          className={`w-full rounded-lg bg-white ${
                            selectionnees.length > 1 ? "h-[280px]" : "h-[280px] sm:h-[420px] xl:h-[520px]"
                          }`}
                        />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a8a]">Résumé du paiement</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Client</dt>
                    <dd className="font-semibold text-slate-800">{premiereSelection.nomClient}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">{selectionnees.length > 1 ? "Commandes" : "N° vente"}</dt>
                    <dd className="font-medium text-violet-marque">
                      {selectionnees.length > 1
                        ? `${selectionnees.length} factures`
                        : premiereSelection.numeroCommande}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Montant</dt>
                    <dd className="font-semibold">
                      {formaterMontant(selectionnees.reduce((somme, commande) => somme + commande.montantTotal, 0))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Statut</dt>
                    <dd>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classeStatut(premiereSelection.statut)}`}>
                        {libelleStatutVente(premiereSelection)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </section>

              {selectionnees.length === 1 && (
                <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1e3a8a]">Actions rapides</h3>
                  <div className="mt-3 rounded-xl border border-bleu-hero px-4 py-6 text-center">
                    {premiereSelection.statut === "LIVREE" || premiereSelection.statut === "CLOTUREE" ? (
                      <>
                        <Pill className="mx-auto h-8 w-8 text-violet-marque" />
                        <p className="mt-3 text-sm font-medium text-slate-700">Médicaments déjà remis au client.</p>
                      </>
                    ) : (
                      <>
                        <Pill className="mx-auto h-8 w-8 text-bleu-hero" />
                        <p className="mt-3 text-sm text-slate-500">
                          {premiereSelection.paiement?.statut === "PAYE"
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
              )}
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

function ClientRows({
  index,
  groupe,
  ouvert,
  actif,
  commandesPage,
  pageCommandes,
  pagesCommandes,
  selectionIds,
  onOuvrir,
  onChoisir,
  onBasculer,
  onPageCommandes,
  onSelectionnerToutes,
}: {
  index: number;
  groupe: {
    id: string;
    nomClient: string;
    numeroClient: string;
    commandes: CommandeAdmin[];
    montantTotal: number;
    datePaiement: string;
    libelleStatut: string;
    statut: string;
    commandeRecente: CommandeAdmin;
  };
  ouvert: boolean;
  actif: boolean;
  commandesPage: CommandeAdmin[];
  pageCommandes: number;
  pagesCommandes: number;
  selectionIds: string[];
  onOuvrir: () => void;
  onChoisir: (id: string) => void;
  onBasculer: (id: string) => void;
  onPageCommandes: (page: number) => void;
  onSelectionnerToutes: () => void;
}) {
  const plusieurs = groupe.commandes.length > 1;
  return (
    <>
      <tr
        onClick={() => (plusieurs ? onOuvrir() : onChoisir(groupe.commandeRecente.id))}
        className={`cursor-pointer border-t border-bleu-hero ${actif ? "bg-sky-50" : "hover:bg-slate-50"}`}
      >
        <td className="px-4 py-3 text-slate-500">{index}</td>
        <td className="px-4 py-3 font-semibold text-violet-marque">
          {plusieurs ? `${groupe.commandes.length} commandes` : groupe.commandeRecente.numeroCommande}
        </td>
        <td className="px-4 py-3 font-medium text-slate-800">{groupe.nomClient}</td>
        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{groupe.numeroClient}</td>
        <td className="hidden px-4 py-3 lg:table-cell">
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-marque">
            Client
          </span>
        </td>
        <td className="px-4 py-3 font-medium">{formaterMontant(groupe.montantTotal)}</td>
        <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{formaterHeure(groupe.datePaiement)}</td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classeStatut(groupe.statut)}`}>
            {groupe.libelleStatut}
          </span>
        </td>
        <td className="px-4 py-3">
          {plusieurs && (
            <button
              type="button"
              onClick={(evenement) => {
                evenement.stopPropagation();
                onOuvrir();
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-bleu-hero bg-white text-[#1e3a8a]"
              aria-label="Voir les commandes du client"
            >
              <ChevronRight className={`h-4 w-4 transition ${ouvert ? "rotate-90" : ""}`} />
            </button>
          )}
        </td>
      </tr>
      {ouvert && (
        <tr className="border-t border-bleu-hero bg-slate-50">
          <td colSpan={9} className="px-4 py-4">
            <div className="rounded-2xl border border-bleu-hero bg-white">
              <div className="flex items-center justify-between border-b border-bleu-hero px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {groupe.commandes.length} commande(s)
                </p>
                <button
                  type="button"
                  onClick={onSelectionnerToutes}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-bleu-hero"
                  aria-label="Tout sélectionner"
                >
                  <ListChecks className="h-4 w-4 text-slate-700" />
                </button>
              </div>
              <ul>
                {commandesPage.map((commande) => {
                  const cochee = selectionIds.includes(commande.id);
                  return (
                    <li key={commande.id} className="flex items-center gap-3 border-t border-bleu-hero px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onBasculer(commande.id)}
                        className={`grid h-5 w-5 place-items-center rounded-md border ${
                          cochee ? "border-bleu-hero bg-bleu-hero text-white" : "border-bleu-hero bg-white"
                        }`}
                        aria-label="Sélectionner la commande"
                      >
                        {cochee && <Check className="h-3 w-3" />}
                      </button>
                      <button type="button" onClick={() => onChoisir(commande.id)} className="min-w-0 flex-1 text-left">
                        <span className="block font-semibold uppercase text-slate-800">{commande.numeroCommande}</span>
                        <span className="block text-xs text-slate-400">
                          {formaterMontant(commande.montantTotal)} · {libelleStatutVente(commande)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void ouvrirPdf(`/admin/factures/${commande.id}/pdf`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-bleu-hero px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Imprimer
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Pagination
                page={pageCommandes}
                pages={pagesCommandes}
                total={groupe.commandes.length}
                libelle="commande(s)"
                onPage={onPageCommandes}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Pagination({
  page,
  pages,
  total,
  libelle,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  libelle: string;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bleu-hero px-4 py-3 text-sm">
      <p className="text-slate-400">
        {total} {libelle} · page {page}/{pages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-bleu-hero px-3 py-1.5 disabled:opacity-40"
        >
          Précédent
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-bleu-hero px-3 py-1.5 disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

function ChampFiltre({
  label,
  valeur,
  onChange,
  type = "text",
}: {
  label: string;
  valeur: string;
  onChange: (valeur: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
      {label}
      <input
        type={type}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-bleu-hero px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function correspondFiltres(commande: CommandeAdmin, filtres: FiltresVentes) {
  if (filtres.nom && !commande.nomClient.toLowerCase().includes(filtres.nom.trim().toLowerCase())) return false;
  if (filtres.numeroClient && !(commande.numeroClient ?? "").toLowerCase().includes(filtres.numeroClient.trim().toLowerCase())) {
    return false;
  }
  if (filtres.numeroVente && !commande.numeroCommande.toLowerCase().includes(filtres.numeroVente.trim().toLowerCase())) {
    return false;
  }
  if (filtres.statut !== "Tous" && libelleStatutVente(commande) !== filtres.statut) return false;
  const date = new Date(commande.datePaiement || commande.dateCommande);
  if (filtres.du && date < new Date(`${filtres.du}T00:00:00`)) return false;
  if (filtres.au && date > new Date(`${filtres.au}T23:59:59`)) return false;
  return true;
}

function libelleStatutGroupe(commandes: CommandeAdmin[]) {
  if (commandes.every((commande) => commande.statut === "LIVREE" || commande.statut === "CLOTUREE")) return "Délivrée";
  if (commandes.every((commande) => commande.paiement?.statut === "PAYE")) return "Payée";
  if (commandes.some((commande) => commande.paiement?.mode === "PAIEMENT_LIVRAISON")) return "Paiement à la livraison";
  if (commandes.some((commande) => commande.paiement?.mode === "PAIEMENT_RETRAIT")) return "Paiement au retrait";
  return libelleStatutVente(commandes[0]);
}
