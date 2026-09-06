"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FlaskConical, Package, Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { TableauFacturesEnAttente } from "@/composants/admin/TableauFacturesEnAttente";
import { appelerApi, ouvrirPdf } from "@/lib/api";
import { formaterDate, formaterMontant } from "@/lib/formatage";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import type { ClientAdmin, FactureAvanceAdmin, ProduitAdmin } from "@/types/modeles";

type ModeFacture = "CASH" | "AVANCE" | "SOLDE" | "PRISE_EN_CHARGE" | "ABONNE" | "CONVENTIONNE";
type TypeFacture = "STANDARD" | "GROS";
type ModePaiement = "ESPECES" | "CARTE_BANCAIRE" | "MOBILE_MONEY_MPESA" | "ASSURANCE" | "VIREMENT";

type LigneFacture = {
  produitId: string;
  nom: string;
  sku: string;
  quantite: number;
  prixUnitaire: number;
};

type FactureChargee = {
  id: string;
  clientId?: string;
  lignes: LigneFacture[];
  modeFacture: ModeFacture;
  typeFacture: TypeFacture;
  remise: number;
  fraisDivers: number;
  numeroRecu: string | null;
  notes: string | null;
  montantPaye: number;
  resteAPayer?: number;
  modePaiement: ModePaiement;
  statutPaiement?: string;
};

function numeroRecuDuJour() {
  return `REC${new Date().getFullYear()}`;
}

function factureDejaSoldée(facture: Pick<FactureChargee, "resteAPayer" | "statutPaiement">) {
  return facture.statutPaiement === "PAYE" && (facture.resteAPayer ?? 0) <= 0.009;
}

const modesFacture: Array<{ id: ModeFacture; titre: string; texte: string }> = [
  { id: "CASH", titre: "Cash", texte: "Paiement complet immédiat" },
  { id: "AVANCE", titre: "Avance", texte: "Paiement partiel, solde à payer" },
  { id: "SOLDE", titre: "Solde", texte: "Disponible après une avance" },
  { id: "PRISE_EN_CHARGE", titre: "Prise en charge", texte: "Facturé à un tiers payant" },
  { id: "ABONNE", titre: "Abonné", texte: "Client abonné, règlement différé" },
  { id: "CONVENTIONNE", titre: "Conventionné", texte: "Tarif établissement conventionné" },
];

const moyensPaiement: Array<{ id: ModePaiement; libelle: string }> = [
  { id: "ESPECES", libelle: "Espèces" },
  { id: "CARTE_BANCAIRE", libelle: "Carte bancaire" },
  { id: "MOBILE_MONEY_MPESA", libelle: "Mobile Money" },
  { id: "ASSURANCE", libelle: "Assurance" },
  { id: "VIREMENT", libelle: "Virement bancaire" },
];

const mois = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function PageFacturationClient({
  clientId,
  commandeId,
}: {
  clientId: string;
  commandeId: string | null;
}) {
  const routeur = useRouter();
  const aujourdHui = new Date();
  const [client, setClient] = useState<ClientAdmin | null>(null);
  const [produits, setProduits] = useState<ProduitAdmin[]>([]);
  const [peutSolde, setPeutSolde] = useState(false);
  const [factureAvance, setFactureAvance] = useState<FactureAvanceAdmin | null>(null);
  const [lignes, setLignes] = useState<LigneFacture[]>([]);
  const [commandeCourante, setCommandeCourante] = useState<string | null>(commandeId);
  const [montantDejaAvance, setMontantDejaAvance] = useState(0);
  const [statutEncaissement, setStatutEncaissement] = useState("EN_ATTENTE");
  const [cleAttente, setCleAttente] = useState(0);
  const [rechercheProduit, setRechercheProduit] = useState("");
  const [modeFacture, setModeFacture] = useState<ModeFacture>("CASH");
  const [typeFacture, setTypeFacture] = useState<TypeFacture>("STANDARD");
  const [modePaiement, setModePaiement] = useState<ModePaiement>("ESPECES");
  const [remise, setRemise] = useState(0);
  const [fraisDivers, setFraisDivers] = useState(0);
  const [montantPaye, setMontantPaye] = useState(0);
  const [numeroRecu, setNumeroRecu] = useState(numeroRecuDuJour);
  const [notes, setNotes] = useState("");
  const [jour, setJour] = useState(String(aujourdHui.getDate()));
  const [moisPaiement, setMoisPaiement] = useState(String(aujourdHui.getMonth() + 1));
  const [annee, setAnnee] = useState(String(aujourdHui.getFullYear()));
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [motDePasseTemporaire, setMotDePasseTemporaire] = useState<string | null>(null);
  const [saisiePrete, setSaisiePrete] = useState(false);

  const totalProduits = useMemo(
    () => lignes.reduce((somme, ligne) => somme + ligne.prixUnitaire * ligne.quantite, 0),
    [lignes],
  );
  const sousTotal = Math.max(0, totalProduits - remise);
  const totalAPayer = Math.max(0, sousTotal + fraisDivers);
  const soldeAEncaisser = Math.max(0, Number((totalAPayer - montantDejaAvance).toFixed(2)));
  const resteAPayer =
    modeFacture === "SOLDE" ? Math.max(0, soldeAEncaisser - montantPaye) : Math.max(0, totalAPayer - montantPaye);
  const nombreArticles = lignes.reduce((somme, ligne) => somme + ligne.quantite, 0);
  const peutImprimer =
    (modeFacture === "AVANCE" || statutEncaissement === "PARTIEL" || montantDejaAvance > 0) &&
    (statutEncaissement === "PARTIEL" || (modeFacture === "AVANCE" && montantPaye > 0)) &&
    resteAPayer > 0;

  function viderSaisieFacture() {
    setLignes([]);
    setCommandeCourante(null);
    setMontantDejaAvance(0);
    setStatutEncaissement("EN_ATTENTE");
    setRechercheProduit("");
    setModeFacture("CASH");
    setTypeFacture("STANDARD");
    setModePaiement("ESPECES");
    setRemise(0);
    setFraisDivers(0);
    setMontantPaye(0);
    setNumeroRecu(numeroRecuDuJour());
    setNotes("");
    setPeutSolde(false);
    setFactureAvance(null);
    setMessage(null);
    setErreur(null);
    setSaisiePrete(false);
  }

  function quitterApresEncaissement() {
    sessionStorage.setItem("mm_facture_ok", "1");
    viderSaisieFacture();
    setClient(null);
    routeur.replace("/admin/clients");
  }

  function appliquerFacture(facture: FactureChargee, modeForce?: ModeFacture) {
    if (facture.clientId && facture.clientId !== clientId) return;
    const mode = modeForce ?? facture.modeFacture;
    const dejaAvance = facture.montantPaye;
    const reste = facture.resteAPayer ?? 0;
    setCommandeCourante(facture.id);
    setLignes(facture.lignes);
    setModeFacture(mode);
    setTypeFacture(facture.typeFacture);
    setRemise(facture.remise);
    setFraisDivers(facture.fraisDivers);
    setNumeroRecu(facture.numeroRecu ?? numeroRecuDuJour());
    setNotes(facture.notes ?? "");
    setMontantDejaAvance(dejaAvance);
    setMontantPaye(mode === "SOLDE" ? reste : dejaAvance);
    setModePaiement(facture.modePaiement);
    setStatutEncaissement(facture.statutPaiement ?? (dejaAvance > 0 ? "PARTIEL" : "EN_ATTENTE"));
    if (dejaAvance > 0 && reste > 0) setPeutSolde(true);
  }

  async function chargerFacture(id: string, modeForce?: ModeFacture) {
    const donnees = await appelerApi<{ facture: FactureChargee }>(`/admin/factures/${id}`);
    if (donnees.facture.clientId && donnees.facture.clientId !== clientId) return donnees.facture;
    appliquerFacture(donnees.facture, modeForce);
    return donnees.facture;
  }

  const chargerClient = useCallback(async (quitterSiSoldée = false) => {
    const donnees = await appelerApi<{
      client: ClientAdmin;
      peutSolde: boolean;
      factureAvance: FactureAvanceAdmin | null;
    }>(`/admin/clients/${clientId}`);
    const aCharger = commandeId ?? donnees.factureAvance?.id;
    if (aCharger) {
      const facture = await appelerApi<{ facture: FactureChargee }>(`/admin/factures/${aCharger}`).then(
        (reponse) => reponse.facture,
      );
      if (facture.clientId && facture.clientId !== clientId) {
        setClient(donnees.client);
        setSaisiePrete(true);
        return donnees;
      }
      if (factureDejaSoldée(facture)) {
        if (quitterSiSoldée) {
          quitterApresEncaissement();
          return donnees;
        }
        viderSaisieFacture();
        setClient(donnees.client);
        setSaisiePrete(true);
        return donnees;
      }
      setClient(donnees.client);
      setPeutSolde(donnees.peutSolde);
      setFactureAvance(donnees.factureAvance);
      appliquerFacture(facture);
      setSaisiePrete(true);
      return donnees;
    }
    setClient(donnees.client);
    setPeutSolde(donnees.peutSolde);
    setFactureAvance(donnees.factureAvance);
    setSaisiePrete(true);
    return donnees;
  }, [clientId, commandeId]);

  useEffect(() => {
    let ignore = false;
    viderSaisieFacture();
    setClient(null);
    setCommandeCourante(commandeId);

    const temporaire = sessionStorage.getItem("mm_mdp_client");
    if (temporaire) {
      setMotDePasseTemporaire(temporaire);
      sessionStorage.removeItem("mm_mdp_client");
    }

    void chargerClient(true).catch(() => {
      if (!ignore) setClient(null);
    });

    appelerApi<{ produits: ProduitAdmin[] }>("/admin/produits")
      .then((donnees) => {
        if (!ignore) setProduits(donnees.produits);
      })
      .catch(() => {
        if (!ignore) setProduits([]);
      });

    return () => {
      ignore = true;
    };
  }, [clientId, commandeId, chargerClient]);

  const surEvenementClient = useCallback(
    (detail?: { clientId?: string }) => {
      if (detail?.clientId !== clientId) return;
      void chargerClient(true).catch(() => undefined);
    },
    [chargerClient, clientId],
  );

  useEvenementTempsReel("commande", surEvenementClient);
  useEvenementTempsReel("client", surEvenementClient);

  useEffect(() => {
    if (modeFacture === "CASH") setMontantPaye(Number(totalAPayer.toFixed(2)));
    if (modeFacture === "SOLDE") setMontantPaye(soldeAEncaisser);
    if (modeFacture === "SOLDE" && !peutSolde) setModeFacture("CASH");
  }, [modeFacture, totalAPayer, soldeAEncaisser, peutSolde]);

  const suggestions = produits.filter((produit) => {
    if (!rechercheProduit.trim()) return false;
    const terme = rechercheProduit.toLowerCase();
    return (
      produit.disponible &&
      !lignes.some((ligne) => ligne.produitId === produit.id) &&
      (produit.nom.toLowerCase().includes(terme) || produit.sku.toLowerCase().includes(terme))
    );
  }).slice(0, 8);

  function ajouterProduit(produit: ProduitAdmin) {
    setLignes((actuelles) => [
      ...actuelles,
      {
        produitId: produit.id,
        nom: produit.nom,
        sku: produit.sku,
        quantite: 1,
        prixUnitaire: produit.prix,
      },
    ]);
    setRechercheProduit("");
  }

  async function enregistrer(valider: boolean) {
    if (lignes.length === 0) {
      setErreur("Ajoutez au moins un produit médical.");
      return null;
    }
    if (modeFacture === "AVANCE" && (montantPaye <= 0 || montantPaye >= totalAPayer)) {
      setErreur("Saisissez un montant d'avance inférieur au total de la facture.");
      return null;
    }
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const donnees = await appelerApi<{ commandeId: string; numeroCommande: string; numeroRecu: string | null }>(
        "/admin/factures",
        {
          method: "POST",
          body: JSON.stringify({
            clientId,
            commandeId: commandeCourante || undefined,
            lignes: lignes.map((ligne) => ({
              produitId: ligne.produitId,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
            })),
            modeFacture,
            typeFacture,
            modePaiement,
            remise,
            fraisDivers,
            montantPaye: modeFacture === "SOLDE" ? totalAPayer : montantPaye,
            numeroRecu,
            notes,
            valider,
          }),
        },
      );
      setCommandeCourante(donnees.commandeId);
      setNumeroRecu(donnees.numeroRecu ?? donnees.numeroCommande);
      if (valider) {
        if (modeFacture === "AVANCE") {
          setMontantDejaAvance(montantPaye);
          setStatutEncaissement("PARTIEL");
          setPeutSolde(true);
          setFactureAvance({
            id: donnees.commandeId,
            numeroCommande: donnees.numeroCommande,
            montantTotal: totalAPayer,
            montantPaye,
            resteAPayer,
            statutPaiement: "PARTIEL",
            modeFacture: "AVANCE",
          });
          setMessage(
            `Avance ${donnees.numeroCommande} encaissée : ${formaterMontant(montantPaye)} payés, reste ${formaterMontant(resteAPayer)} pour la facture solde.`,
          );
        } else {
          quitterApresEncaissement();
          return donnees.commandeId;
        }
      } else {
        setMessage(`Facture ${donnees.numeroCommande} enregistrée.`);
      }
      setCleAttente((actuel) => actuel + 1);
      return donnees.commandeId;
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Enregistrement impossible.");
      return null;
    } finally {
      setEnCours(false);
    }
  }

  async function imprimer(type: "proforma" | "facture") {
    const id = commandeCourante ?? (await enregistrer(false));
    if (!id) return;
    await ouvrirPdf(`/admin/factures/${id}/pdf?type=${type}`);
  }

  if (!client) {
    return (
      <MiseEnPageAdmin titre="Facture client">
        <p className="text-sm text-slate-500">Chargement du client...</p>
      </MiseEnPageAdmin>
    );
  }

  const statutPaiement =
    statutEncaissement === "PAYE" || (montantPaye > 0 && resteAPayer <= 0 && modeFacture !== "AVANCE")
      ? "Payée"
      : montantDejaAvance > 0 || (modeFacture === "AVANCE" && montantPaye > 0)
        ? "Avance versée"
        : "En attente de paiement";

  return (
    <MiseEnPageAdmin titre="Facturation" sousTitre={`${client.nomSociete || client.nomComplet} · produits médicaux`}>
      <Link href="/admin/clients" className="mb-4 inline-flex text-sm font-medium text-violet-marque hover:underline">
        ← Retour à la liste
      </Link>

      <article className="mb-4 rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#1e3a8a] text-lg font-semibold text-white">
              {client.initials || client.nomComplet.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold uppercase tracking-wide text-slate-900">
                  {client.nomComplet}
                </h2>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase text-sky-700">
                  Client
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    statutPaiement === "Payée"
                      ? "bg-emerald-100 text-emerald-800"
                      : statutPaiement === "Avance versée"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {statutPaiement}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Dossier {client.numeroDossier} · {client.email}
                {client.telephone ? ` · ${client.telephone}` : ""}
                {client.ville ? ` · ${client.ville}` : ""}
              </p>
              {client.nomSociete && <p className="text-sm text-slate-500">Société : {client.nomSociete}</p>}
              <p className="mt-1 text-xs text-slate-400">Client depuis le {formaterDate(client.dateCreation)}</p>
              {(montantDejaAvance > 0 || modeFacture === "AVANCE" || modeFacture === "SOLDE") && (
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Montant payé {formaterMontant(modeFacture === "AVANCE" ? montantPaye : montantDejaAvance)}
                  {" · "}
                  Reste à payer {formaterMontant(modeFacture === "SOLDE" ? soldeAEncaisser : resteAPayer)}
                </p>
              )}
              {motDePasseTemporaire && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Mot de passe temporaire à transmettre : <strong>{motDePasseTemporaire}</strong>
                </p>
              )}
            </div>
          </div>
          <Link
            href="/admin/commandes"
            className="shrink-0 rounded-xl border border-bleu-hero px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voir les commandes
          </Link>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Produits médicaux à facturer
            </h3>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={rechercheProduit}
                onChange={(e) => setRechercheProduit(e.target.value)}
                placeholder={
                  modeFacture === "SOLDE"
                    ? "Les produits de l'avance sont verrouillés"
                    : "Rechercher un produit (nom ou SKU)"
                }
                disabled={modeFacture === "SOLDE"}
                className="w-full rounded-xl border border-bleu-hero py-2.5 pl-9 pr-3 text-sm outline-none disabled:bg-slate-50"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-bleu-hero bg-white shadow-lg">
                  {suggestions.map((produit) => (
                    <button
                      key={produit.id}
                      type="button"
                      onClick={() => ajouterProduit(produit)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span>
                        <span className="font-medium text-slate-800">{produit.nom}</span>
                        <span className="ml-2 text-xs text-slate-400">{produit.sku}</span>
                      </span>
                      <span className="text-xs font-semibold">{formaterMontant(produit.prix)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-3 font-medium">N°</th>
                    <th className="py-2 pr-3 font-medium">Produit</th>
                    <th className="py-2 pr-3 font-medium">Prix unit.</th>
                    <th className="py-2 pr-3 font-medium">Qté</th>
                    <th className="py-2 pr-3 font-medium">Montant</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne, index) => (
                    <tr key={ligne.produitId} className="border-t border-bleu-hero">
                      <td className="py-2 pr-3 text-slate-400">{index + 1}</td>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-slate-800">{ligne.nom}</p>
                        <p className="text-xs text-slate-400">{ligne.sku}</p>
                      </td>
                      <td className="py-2 pr-3">{formaterMontant(ligne.prixUnitaire)}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min={1}
                          value={ligne.quantite}
                          readOnly={modeFacture === "SOLDE"}
                          onChange={(e) =>
                            setLignes((actuelles) =>
                              actuelles.map((item) =>
                                item.produitId === ligne.produitId
                                  ? { ...item, quantite: Math.max(1, Number(e.target.value) || 1) }
                                  : item,
                              ),
                            )
                          }
                          className={`w-16 rounded-lg border border-bleu-hero px-2 py-1 text-sm ${
                            modeFacture === "SOLDE" ? "bg-slate-50 text-slate-500" : ""
                          }`}
                        />
                      </td>
                      <td className="py-2 pr-3 font-semibold">
                        {formaterMontant(ligne.prixUnitaire * ligne.quantite)}
                      </td>
                      <td className="py-2">
                        {modeFacture !== "SOLDE" && (
                          <button
                            type="button"
                            onClick={() => setLignes((actuelles) => actuelles.filter((item) => item.produitId !== ligne.produitId))}
                            className="text-red-500 hover:text-red-700"
                            aria-label="Retirer le produit"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">
                {lignes.length === 0 ? "Aucun produit ajouté." : `${lignes.length} produit(s) sélectionné(s)`}
              </p>
              <p className="text-sm font-semibold text-slate-800">Total produits {formaterMontant(totalProduits)}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Mode de facture</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {modesFacture.map((mode) => {
                const actif = modeFacture === mode.id;
                const bloque = mode.id === "SOLDE" && !peutSolde;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={bloque}
                    onClick={() => {
                      if (mode.id === "SOLDE") {
                        const idAvance = commandeCourante ?? factureAvance?.id;
                        if (idAvance) {
                          void chargerFacture(idAvance, "SOLDE").catch(() => setModeFacture("SOLDE"));
                          return;
                        }
                      }
                      setModeFacture(mode.id);
                      if (mode.id === "AVANCE") {
                        setMontantPaye(0);
                        if (statutEncaissement === "EN_ATTENTE") setMontantDejaAvance(0);
                      }
                    }}
                    className={`rounded-xl border px-3 py-3 text-left ${
                      actif ? "border-2 border-bleu-hero bg-sky-50" : "border-bleu-hero bg-white"
                    } ${bloque ? "opacity-50" : ""}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{mode.titre}</span>
                      {actif && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-bleu-hero text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {mode.id === "SOLDE" && factureAvance
                        ? `Reste ${formaterMontant(factureAvance.resteAPayer)} après l'avance`
                        : mode.texte}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Informations de paiement
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                {modeFacture === "SOLDE" ? "Solde à encaisser" : "Montant à payer"}
                <input
                  readOnly
                  value={formaterMontant(modeFacture === "SOLDE" ? soldeAEncaisser : totalAPayer)}
                  className="mt-1.5 w-full rounded-xl border border-bleu-hero bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                {modeFacture === "AVANCE"
                  ? "Montant avance *"
                  : modeFacture === "SOLDE"
                    ? "Montant solde *"
                    : "Montant payé *"}
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  readOnly={modeFacture !== "AVANCE"}
                  value={montantPaye}
                  onChange={(e) => {
                    const saisi = Number(e.target.value) || 0;
                    setMontantPaye(
                      modeFacture === "AVANCE"
                        ? Math.min(Math.max(0, saisi), Math.max(0, totalAPayer - 0.01))
                        : saisi,
                    );
                  }}
                  className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm ${
                    modeFacture === "AVANCE"
                      ? "border-2 border-bleu-hero"
                      : "border-bleu-hero bg-slate-50 text-slate-500"
                  }`}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Monnaie
                <select disabled value="USD" className="mt-1.5 w-full rounded-xl border border-bleu-hero bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-slate-700">Date paiement</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <input readOnly value={jour} className="rounded-xl border border-bleu-hero bg-slate-50 px-3 py-2.5 text-sm text-slate-500" />
                <input
                  readOnly
                  value={mois[Number(moisPaiement) - 1] ?? ""}
                  className="rounded-xl border border-bleu-hero bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
                <input readOnly value={annee} className="rounded-xl border border-bleu-hero bg-slate-50 px-3 py-2.5 text-sm text-slate-500" />
              </div>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                N° Reçu *
                <span className="relative mt-1.5 block">
                  <input
                    readOnly
                    value={numeroRecu}
                    className="w-full rounded-xl border border-bleu-hero bg-slate-50 px-3 py-2.5 pr-11 text-sm text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const suite = Math.random().toString(36).slice(2, 6).toUpperCase();
                      setNumeroRecu(`REC${aujourdHui.getFullYear()}${String(aujourdHui.getMonth() + 1).padStart(2, "0")}${suite}`);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-bleu-hero"
                    aria-label="Générer un nouveau numéro"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </span>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Notes (optionnel)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-bleu-hero px-3 py-2.5 text-sm"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:col-span-4">
          <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Résumé de la facture</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {modeFacture === "AVANCE" && (
                <label className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-700">Montant avance</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    max={Math.max(0, totalAPayer - 0.01)}
                    value={montantPaye}
                    onChange={(e) => {
                      const saisi = Number(e.target.value) || 0;
                      setMontantPaye(Math.min(Math.max(0, saisi), Math.max(0, totalAPayer - 0.01)));
                    }}
                    className="w-28 rounded-lg border-2 border-bleu-hero px-2 py-1.5 text-right text-sm"
                    aria-label="Montant de l'avance"
                  />
                </label>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Total produits</dt>
                <dd className="font-medium">{formaterMontant(totalProduits)}</dd>
              </div>
              <label className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Remise</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={remise}
                  readOnly={modeFacture === "SOLDE"}
                  onChange={(e) => setRemise(Number(e.target.value) || 0)}
                  className="w-28 rounded-lg border border-bleu-hero px-2 py-1.5 text-right text-sm read-only:bg-slate-50"
                />
              </label>
              <div className="flex justify-between">
                <dt className="text-slate-500">Sous-total</dt>
                <dd className="font-medium">{formaterMontant(sousTotal)}</dd>
              </div>
              <label className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Frais divers</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={fraisDivers}
                  readOnly={modeFacture === "SOLDE"}
                  onChange={(e) => setFraisDivers(Number(e.target.value) || 0)}
                  className="w-28 rounded-lg border border-bleu-hero px-2 py-1.5 text-right text-sm read-only:bg-slate-50"
                />
              </label>
            </dl>
            <div className="mt-4 border-t border-bleu-hero pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total à payer</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{formaterMontant(totalAPayer)}</p>
              {(modeFacture === "AVANCE" || modeFacture === "SOLDE" || montantDejaAvance > 0) && (
                <div className="mt-3 rounded-xl border border-bleu-hero bg-sky-50 px-3 py-2.5 text-sm">
                  <p className="flex justify-between text-slate-600">
                    <span>Montant payé</span>
                    <span className="font-semibold">
                      {formaterMontant(modeFacture === "AVANCE" ? montantPaye : montantDejaAvance)}
                    </span>
                  </p>
                  <p className={`mt-1 flex justify-between font-semibold ${resteAPayer > 0 || soldeAEncaisser > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                    <span>Reste à payer</span>
                    <span>{formaterMontant(modeFacture === "SOLDE" ? soldeAEncaisser : resteAPayer)}</span>
                  </p>
                </div>
              )}
              {modeFacture !== "AVANCE" && modeFacture !== "SOLDE" && montantDejaAvance <= 0 && (
                <>
                  <p className="mt-2 text-sm text-slate-500">Montant payé {formaterMontant(montantPaye)}</p>
                  <p className={`text-sm font-semibold ${resteAPayer > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                    Reste à payer {formaterMontant(resteAPayer)}
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Moyens de paiement</h3>
            <div className="mt-3 space-y-2">
              {moyensPaiement.map((moyen) => {
                const actif = modePaiement === moyen.id;
                return (
                  <button
                    key={moyen.id}
                    type="button"
                    onClick={() => setModePaiement(moyen.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm ${
                      actif ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-800" : "border-bleu-hero"
                    }`}
                  >
                    {moyen.libelle}
                    <span className={`h-4 w-4 rounded-full border ${actif ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Type de facture</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTypeFacture("STANDARD")}
                className={`rounded-xl border p-3 text-center ${
                  typeFacture === "STANDARD" ? "border-2 border-bleu-hero bg-sky-50" : "border-bleu-hero"
                }`}
              >
                <FlaskConical className="mx-auto h-5 w-5 text-bleu-hero" />
                <span className="mt-2 block text-xs font-semibold">Facture standard</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFacture("GROS")}
                className={`rounded-xl border p-3 text-center ${
                  typeFacture === "GROS" ? "border-2 border-bleu-hero bg-sky-50" : "border-bleu-hero"
                }`}
              >
                <Package className="mx-auto h-5 w-5 text-bleu-hero" />
                <span className="mt-2 block text-xs font-semibold">Facture gros</span>
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Facture adaptée aux produits médicaux du catalogue, pas aux examens cliniques.
            </p>
          </section>
        </aside>
      </div>

      {erreur && <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}
      {message && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-bleu-hero bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => routeur.push("/admin/clients")}
            className="rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Annuler
          </button>
          {peutImprimer && (
            <>
              <button
                type="button"
                disabled={enCours}
                onClick={() => void imprimer("proforma")}
                className="inline-flex items-center gap-2 rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                <Printer className="h-4 w-4" />
                Imprimer proforma
              </button>
              <button
                type="button"
                disabled={enCours}
                onClick={() => void imprimer("facture")}
                className="inline-flex items-center gap-2 rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                <Printer className="h-4 w-4" />
                Imprimer facture
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          disabled={enCours}
          onClick={() => void enregistrer(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {modeFacture === "AVANCE"
            ? "Valider l'avance"
            : modeFacture === "SOLDE"
              ? "Valider le solde"
              : "Valider et encaisser"}
        </button>
      </div>

      <div className="mt-6">
        <TableauFacturesEnAttente
          key={cleAttente}
          clientIdActif={clientId}
          rafraichir={cleAttente}
          brouillon={
            saisiePrete
              ? {
                  nombreArticles,
                  montantTotal: totalAPayer,
                  montantPaye: modeFacture === "SOLDE" ? montantDejaAvance : montantPaye,
                  resteAPayer: modeFacture === "SOLDE" ? soldeAEncaisser : resteAPayer,
                }
              : undefined
          }
        />
      </div>
    </MiseEnPageAdmin>
  );
}
