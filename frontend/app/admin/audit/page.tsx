"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { formaterDateCompacte, formaterDateHeure, libelleRole } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { estSuperAdmin } from "@/lib/roles";
import { useClient } from "@/store/contexteClient";

type AuteurAudit = {
  id: string;
  prenom: string;
  nom: string;
  nomComplet: string;
  email: string;
  telephone: string | null;
  role: string;
  photoProfil: string | null;
  nomSociete: string | null;
  adresse: string | null;
  ville: string | null;
  numeroClient: string | null;
  actif: boolean;
  dateCreation: string;
};

type EntreeAudit = {
  id: string;
  action: string;
  tableCible: string;
  details: string | null;
  adresseIp: string | null;
  dateAction: string;
  auteur: AuteurAudit | null;
};

const LIMITE = 30;

const filtresAction = [
  { valeur: "", libelle: "Toutes les actions" },
  { valeur: "CONNEXION", libelle: "Connexions" },
  { valeur: "DECONNEXION", libelle: "Déconnexions" },
  { valeur: "MODIFICATION_PROFIL", libelle: "Profils modifiés" },
  { valeur: "MOT_DE_PASSE", libelle: "Mots de passe" },
  { valeur: "INSCRIPTION_CLIENT", libelle: "Inscriptions" },
  { valeur: "ENREGISTREMENT_CLIENT", libelle: "Clients enregistrés" },
  { valeur: "MODIFICATION_CLIENT", libelle: "Clients modifiés" },
  { valeur: "ETABLISSEMENT_FACTURE", libelle: "Factures" },
  { valeur: "COMMANDE", libelle: "Commandes" },
  { valeur: "PAIEMENT", libelle: "Paiements" },
  { valeur: "CONSULTATION_PRODUIT", libelle: "Vues produits" },
  { valeur: "PRODUIT", libelle: "Catalogue produits" },
  { valeur: "PERSONNEL", libelle: "Personnel" },
];

function libelleAction(action: string) {
  const libelles: Record<string, string> = {
    CONNEXION: "Connexion",
    DECONNEXION: "Déconnexion",
    INSCRIPTION_CLIENT: "Inscription client",
    MODIFICATION_PROFIL: "Modification du profil",
    CHANGEMENT_MOT_DE_PASSE: "Changement de mot de passe",
    REINITIALISATION_MOT_DE_PASSE: "Réinitialisation du mot de passe",
    ENREGISTREMENT_CLIENT: "Enregistrement client",
    MODIFICATION_CLIENT: "Modification client",
    CREATION_PERSONNEL: "Création personnel",
    MODIFICATION_PERSONNEL: "Modification personnel",
    ACTIVATION_PERSONNEL: "Activation personnel",
    DESACTIVATION_PERSONNEL: "Désactivation personnel",
  };
  if (libelles[action]) return libelles[action];
  const trouve = filtresAction.find(
    (filtre) => filtre.valeur && action.toUpperCase().includes(filtre.valeur),
  );
  return trouve?.libelle ?? action.replaceAll("_", " ");
}

function initiales(auteur: AuteurAudit) {
  return `${auteur.prenom.charAt(0)}${auteur.nom.charAt(0)}`.toUpperCase();
}

function AvatarAuteur({
  auteur,
  taille = "md",
}: {
  auteur: AuteurAudit | null;
  taille?: "sm" | "md" | "lg";
}) {
  const classes =
    taille === "lg"
      ? "h-20 w-20 text-xl"
      : taille === "sm"
        ? "h-9 w-9 text-xs"
        : "h-11 w-11 text-sm";

  if (!auteur) {
    return (
      <span
        className={`${classes} grid shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400`}
      >
        <Globe className={taille === "lg" ? "h-8 w-8" : "h-4 w-4"} />
      </span>
    );
  }

  if (auteur.photoProfil) {
    return (
      <img
        src={auteur.photoProfil}
        alt=""
        className={`${classes} shrink-0 rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <span
      className={`${classes} grid shrink-0 place-items-center rounded-full bg-[#1e3a8a] font-semibold text-white`}
    >
      {initiales(auteur)}
    </span>
  );
}

export default function PageAuditAdmin() {
  const { utilisateur } = useClient();
  const superAdmin = estSuperAdmin(utilisateur?.role);
  const [entrees, setEntrees] = useState<EntreeAudit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [recherche, setRecherche] = useState("");
  const [action, setAction] = useState("");
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const panneauRef = useRef<HTMLElement>(null);

  const selection = useMemo(
    () => entrees.find((entree) => entree.id === selectionId) ?? null,
    [entrees, selectionId],
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
    if (!superAdmin) return;
    setChargement(true);
    const params = new URLSearchParams({
      page: String(page),
      limite: String(LIMITE),
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
        setSelectionId((actuel) => {
          if (actuel && donnees.entrees.some((item) => item.id === actuel)) return actuel;
          return donnees.entrees[0]?.id ?? null;
        });
      })
      .catch(() => {
        setEntrees([]);
        setTotal(0);
        setSelectionId(null);
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

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white xl:col-span-8">
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

          <div className="table-scroll">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-medium sm:px-4">Date</th>
                  <th className="px-3 py-3 font-medium sm:px-4">Auteur</th>
                  <th className="px-3 py-3 font-medium sm:px-4">Action</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Détails</th>
                </tr>
              </thead>
              <tbody>
                {entrees.map((entree) => {
                  const actif = selectionId === entree.id;
                  return (
                    <tr
                      key={entree.id}
                      onClick={() => selectionner(entree.id)}
                      className={`cursor-pointer border-t border-bleu-hero align-middle ${
                        actif ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-3 text-slate-500 sm:px-4">
                        <span className="md:hidden">{formaterDateCompacte(entree.dateAction)}</span>
                        <span className="hidden whitespace-nowrap md:inline">
                          {formaterDateHeure(entree.dateAction)}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <AvatarAuteur auteur={entree.auteur} taille="sm" />
                          <div className="min-w-0">
                            {entree.auteur ? (
                              <>
                                <p className="truncate font-medium text-slate-800">
                                  {entree.auteur.nomComplet}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  {libelleRole(entree.auteur.role)}
                                </p>
                              </>
                            ) : (
                              <p className="text-slate-400">Visiteur / système</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <span className="inline-block max-w-[7.5rem] truncate rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 sm:max-w-none sm:px-2.5 sm:text-[11px]">
                          {libelleAction(entree.action)}
                        </span>
                      </td>
                      <td className="hidden max-w-xs truncate px-4 py-3 text-slate-600 md:table-cell">
                        {entree.details || "—"}
                      </td>
                    </tr>
                  );
                })}
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

        <aside
          ref={panneauRef}
          className="scroll-mt-24 xl:sticky xl:top-[calc(var(--hauteur-en-tete)+1rem)] xl:col-span-4 xl:self-start"
        >
          {selection ? (
            <article className="space-y-5 rounded-2xl border border-bleu-hero bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Qui a fait quoi
                </p>
                <div className="mt-4 flex flex-col items-center text-center">
                  <AvatarAuteur auteur={selection.auteur} taille="lg" />
                  {selection.auteur ? (
                    <>
                      <h3 className="mt-3 text-lg font-semibold text-[#1e3a8a]">
                        {selection.auteur.nomComplet}
                      </h3>
                      <p className="mt-1 text-sm text-violet-marque">
                        {libelleRole(selection.auteur.role)}
                      </p>
                      <span
                        className={`mt-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          selection.auteur.actif
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {selection.auteur.actif ? "Compte actif" : "Compte inactif"}
                      </span>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-3 text-lg font-semibold text-[#1e3a8a]">
                        Visiteur / système
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Action sans utilisateur connecté
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-bleu-hero bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Événement
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1e3a8a]">
                  {libelleAction(selection.action)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{selection.action}</p>
                <p className="mt-3 text-sm text-slate-700">
                  {selection.details || "Aucun détail complémentaire."}
                </p>
              </div>

              <dl className="space-y-2.5 text-sm">
                {[
                  { label: "Date", valeur: formaterDateHeure(selection.dateAction) },
                  { label: "Table cible", valeur: selection.tableCible },
                  { label: "Adresse IP", valeur: selection.adresseIp || "—" },
                  ...(selection.auteur
                    ? [
                        { label: "Email", valeur: selection.auteur.email },
                        {
                          label: "Téléphone",
                          valeur: selection.auteur.telephone || "—",
                        },
                        {
                          label: "Société",
                          valeur: selection.auteur.nomSociete || "—",
                        },
                        {
                          label: "N° client",
                          valeur: selection.auteur.numeroClient || "—",
                        },
                        {
                          label: "Ville",
                          valeur: selection.auteur.ville || "—",
                        },
                        {
                          label: "Adresse",
                          valeur: selection.auteur.adresse || "—",
                        },
                        {
                          label: "Inscrit le",
                          valeur: formaterDateHeure(selection.auteur.dateCreation),
                        },
                      ]
                    : []),
                ].map((ligne) => (
                  <div key={ligne.label} className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">{ligne.label}</dt>
                    <dd className="max-w-[60%] text-right font-medium break-words text-[#1e3a8a]">
                      {ligne.valeur}
                    </dd>
                  </div>
                ))}
              </dl>

              {!selection.auteur && (
                <div className="flex items-start gap-2 rounded-xl border border-dashed border-bleu-hero bg-slate-50 px-3 py-3 text-xs text-slate-500">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Aucune fiche utilisateur liée. Il peut s’agir d’une action anonyme, d’un
                    invité ou d’un processus système.
                  </p>
                </div>
              )}
            </article>
          ) : (
            <article className="rounded-2xl border border-dashed border-bleu-hero bg-slate-50 p-6 text-center text-sm text-slate-400">
              Sélectionnez un événement pour afficher la photo et les détails de l’auteur.
            </article>
          )}
        </aside>
      </div>
    </MiseEnPageAdmin>
  );
}
