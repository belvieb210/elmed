"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Box,
  Calendar,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Headset,
  MapPin,
  Package,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import {
  classeBadgePaiement,
  classeBadgeStatut,
  etapesDetail,
  indexEtapeDetail,
  libelleDetailStatut,
} from "@/composants/commandes/suivi";
import { appelerApi, ouvrirPdf } from "@/lib/api";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import { formaterDate, formaterDateHeure, formaterHeure, formaterMontant } from "@/lib/formatage";
import type { DetailCommande } from "@/types/modeles";

export function PageDetailCommande() {
  const params = useParams<{ id: string }>();
  const [commande, setCommande] = useState<DetailCommande | null>(null);
  const [copie, setCopie] = useState(false);
  const [pdfEnCours, setPdfEnCours] = useState(false);
  const suiviRef = useRef<HTMLElement>(null);
  const articlesRef = useRef<HTMLElement>(null);

  const charger = useCallback(() => {
    appelerApi<{ commande: DetailCommande }>(`/commandes/${params.id}`).then((donnees) => {
      setCommande(donnees.commande);
    });
  }, [params.id]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEvenementTempsReel("commande", charger);

  async function copierNumero() {
    if (!commande) return;
    await navigator.clipboard.writeText(commande.numeroCommande);
    setCopie(true);
    window.setTimeout(() => setCopie(false), 1500);
  }

  async function telechargerFacture() {
    if (!commande) return;
    setPdfEnCours(true);
    try {
      await ouvrirPdf(`/commandes/${commande.id}/facture`);
    } finally {
      setPdfEnCours(false);
    }
  }

  if (!commande) {
    return (
      <MiseEnPageClient>
        <p className="text-sm text-slate-500">Chargement de la commande...</p>
      </MiseEnPageClient>
    );
  }

  const etape = indexEtapeDetail(commande.statut);
  const paiement = commande.paiement;
  const entrepot = commande.entrepot;
  const client = commande.client;
  const nombreArticles = commande.nombreArticles ?? commande.lignes.reduce((somme, ligne) => somme + ligne.quantite, 0);
  const carteUrl =
    entrepot?.latitude && entrepot.longitude
      ? `https://www.google.com/maps?q=${entrepot.latitude},${entrepot.longitude}`
      : entrepot
        ? `https://www.google.com/maps/search/${encodeURIComponent(`${entrepot.adresse} ${entrepot.ville}`)}`
        : "https://www.google.com/maps/search/Kinshasa";

  return (
    <MiseEnPageClient>
      <p className="mb-3 text-sm text-slate-500">
        <Link href="/" className="hover:text-violet-marque">
          Accueil
        </Link>
        {" > "}
        <Link href="/commandes" className="hover:text-violet-marque">
          Mes commandes
        </Link>
        {" > "}
        <span className="text-slate-800">Détails de la commande</span>
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Commande #{commande.numeroCommande}</h1>
        <button
          type="button"
          onClick={copierNumero}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white"
          aria-label="Copier le numéro"
        >
          {copie ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          href="/commandes"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <span className="inline-flex items-center gap-1 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          Date : {formaterDate(commande.dateCommande)} - {formaterHeure(commande.dateCommande)}
        </span>
        {client && (
          <span className="inline-flex items-center gap-1 text-sm text-slate-500">
            <User className="h-4 w-4" />
            Client : {client.nomComplet}
          </span>
        )}
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classeBadgeStatut(commande.statut)}`}>
          {libelleDetailStatut(commande.statut)}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classeBadgePaiement(paiement?.statut ?? "EN_ATTENTE")}`}>
          {paiement?.libelleStatut ?? "En attente"}
        </span>
      </div>

      {paiement?.statut === "PAYE" && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Cette commande est payée
          {paiement.libelleMode ? ` · ${paiement.libelleMode}` : ""}
          {paiement.reference ? ` · réf. ${paiement.reference}` : ""}.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CarteMetrique
              icone={<Package className="h-4 w-4" />}
              titre="Total produits"
              valeur={`${nombreArticles} article${nombreArticles > 1 ? "s" : ""}`}
              action={
                <button type="button" onClick={() => articlesRef.current?.scrollIntoView({ behavior: "smooth" })} className="text-xs font-medium text-bleu-hero">
                  Voir le détail
                </button>
              }
            />
            <CarteMetrique
              icone={<Box className="h-4 w-4 text-amber-500" />}
              titre="Montant total"
              valeur={formaterMontant(commande.montantTotal)}
              sousTitre="TVA incluse"
            />
            <CarteMetrique
              icone={<Wallet className="h-4 w-4" />}
              titre="Paiement"
              valeur={paiement?.libelleMode ?? "Paiement"}
              action={
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${classeBadgePaiement(paiement?.statut ?? "EN_ATTENTE")}`}>
                  {paiement?.libelleStatut ?? "En attente"}
                </span>
              }
            />
            <CarteMetrique
              icone={<Truck className="h-4 w-4" />}
              titre="Livraison"
              valeur={paiement?.libelleLivraison ?? "Retrait en entrepôt"}
              sousTitre={entrepot?.nom ?? "Entrepôt Central Kinshasa"}
            />
          </div>

          <section ref={articlesRef} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="inline-flex items-center gap-2 font-semibold text-slate-900">
                <Box className="h-4 w-4 text-violet-marque" />
                Articles de la commande
              </h2>
              <span className="rounded-full bg-violet-clair px-2.5 py-0.5 text-xs font-medium text-violet-marque">
                {nombreArticles} article{nombreArticles > 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-3 p-3 md:hidden">
              {commande.lignes.map((ligne) => (
                <article key={ligne.id} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                  <img src={ligne.image ?? ""} alt="" className="h-14 w-14 rounded-xl bg-slate-100 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{ligne.nomProduit}</p>
                    <p className="text-xs text-slate-400">
                      {ligne.sku ? `SKU : ${ligne.sku}` : ""}
                      {ligne.numeroLot ? ` · Lot : ${ligne.numeroLot}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ligne.quantite} × {formaterMontant(ligne.prixUnitaire)}
                    </p>
                    <p className="text-sm font-semibold">{formaterMontant(ligne.sousTotal)}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Produit</th>
                    <th className="px-4 py-2 font-medium">Quantité</th>
                    <th className="px-4 py-2 font-medium">Prix unitaire</th>
                    <th className="px-4 py-2 font-medium">Prix total</th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {commande.lignes.map((ligne) => (
                    <tr key={ligne.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={ligne.image ?? ""} alt="" className="h-12 w-12 rounded-xl bg-slate-100 object-cover" />
                          <div>
                            <p className="font-medium text-slate-800">{ligne.nomProduit}</p>
                            <p className="text-xs text-slate-400">
                              {ligne.sku ? `SKU : ${ligne.sku}` : ""}
                              {ligne.numeroLot ? ` · Lot : ${ligne.numeroLot}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{ligne.quantite}</td>
                      <td className="px-4 py-3">{formaterMontant(ligne.prixUnitaire)}</td>
                      <td className="px-4 py-3 font-semibold">{formaterMontant(ligne.sousTotal)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${classeBadgePaiement(paiement?.statut ?? "EN_ATTENTE")}`}>
                          {paiement?.libelleStatut ?? "En attente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section ref={suiviRef} className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
            <h2 className="mb-5 inline-flex items-center gap-2 font-semibold text-slate-900">
              <Download className="h-4 w-4 text-violet-marque" />
              Suivi de la commande
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {etapesDetail.map((item, index) => {
                const complete = etape >= 0 && index <= etape;
                const actuelle = index === etape;
                return (
                  <div key={item.id} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                    <div className="flex items-center sm:w-full">
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          actuelle
                            ? "bg-violet-marque text-white"
                            : complete
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {complete && !actuelle ? <Check className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                      </span>
                      {index < etapesDetail.length - 1 && (
                        <span className={`hidden h-0.5 flex-1 sm:block ${index < etape ? "bg-emerald-400" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${actuelle ? "text-violet-marque" : "text-slate-700"}`}>{item.libelle}</p>
                      <p className="text-[11px] text-slate-400">
                        {index === 0
                          ? formaterDateHeure(commande.dateCommande)
                          : actuelle && commande.dateMaj
                            ? formaterDateHeure(commande.dateMaj)
                            : complete
                              ? formaterDateHeure(commande.dateCommande)
                              : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Vous recevrez une notification dès que votre commande sera prête pour le retrait.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-100 bg-white p-4">
            <h3 className="mb-3 font-semibold text-slate-900">Détails de la commande</h3>
            <dl className="space-y-2 text-sm">
              <LigneDetail libelle="N° commande" valeur={`#${commande.numeroCommande}`} />
              <LigneDetail libelle="Date" valeur={formaterDateHeure(commande.dateCommande)} />
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Statut</dt>
                <dd className={`rounded-full px-2 py-0.5 text-xs font-medium ${classeBadgeStatut(commande.statut)}`}>
                  {libelleDetailStatut(commande.statut)}
                </dd>
              </div>
              {entrepot && (
                <div className="pt-2">
                  <p className="inline-flex items-center gap-1 text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Entrepôt
                  </p>
                  <p className="mt-1 font-medium text-slate-800">{entrepot.nom}</p>
                  <p className="text-xs text-slate-500">
                    {entrepot.adresse}, {entrepot.ville}
                  </p>
                  <a
                    href={carteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-bleu-hero"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Voir sur la carte
                  </a>
                </div>
              )}
            </dl>
          </article>

          {client && (
            <article className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Informations du client</h3>
                <Link href="/profil" className="text-xs font-medium text-bleu-hero">
                  Voir profil
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={client.photoProfil ?? "https://i.pravatar.cc/80?img=12"}
                  alt={client.nomComplet}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-slate-800">{client.nomComplet}</p>
                  {client.telephone && <p className="text-xs text-slate-500">{client.telephone}</p>}
                  {client.email && <p className="text-xs text-slate-500">{client.email}</p>}
                  {client.nomSociete && <p className="text-xs text-slate-500">{client.nomSociete}</p>}
                </div>
              </div>
            </article>
          )}

          <article className="rounded-2xl border border-slate-100 bg-white p-4">
            <h3 className="mb-3 font-semibold text-slate-900">Paiement</h3>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-700">{paiement?.libelleMode ?? "Paiement à la commande"}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${classeBadgePaiement(paiement?.statut ?? "EN_ATTENTE")}`}>
                {paiement?.libelleStatut ?? "En attente"}
              </span>
            </div>
            <p className="mt-2 text-lg font-semibold">{formaterMontant(paiement?.montant ?? commande.montantTotal)}</p>
            {paiement?.datePaiement && (
              <p className="text-xs text-slate-400">{formaterDateHeure(paiement.datePaiement)}</p>
            )}
            <Link
              href={`/commandes/${commande.id}/facture`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-bleu-hero"
            >
              <FileText className="h-4 w-4" />
              Voir la facture
            </Link>
          </article>

          <article className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4">
            <h3 className="mb-2 font-semibold text-slate-900">Actions</h3>
            <button
              type="button"
              onClick={telechargerFacture}
              disabled={pdfEnCours}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-marque py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {pdfEnCours ? "Préparation..." : "Télécharger la facture (PDF)"}
            </button>
            <button
              type="button"
              onClick={() => suiviRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              Suivre la commande
            </button>
            <Link
              href="/messagerie"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Headset className="h-4 w-4" />
              Contacter le support
            </Link>
          </article>
        </aside>
      </div>
      <BandeauMessagerie />
    </MiseEnPageClient>
  );
}

function CarteMetrique({
  icone,
  titre,
  valeur,
  sousTitre,
  action,
}: {
  icone: ReactNode;
  titre: string;
  valeur: string;
  sousTitre?: string;
  action?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="inline-flex items-center gap-2 text-xs text-slate-500">
        {icone}
        {titre}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{valeur}</p>
      {sousTitre && <p className="text-xs text-slate-400">{sousTitre}</p>}
      {action && <div className="mt-1">{action}</div>}
    </article>
  );
}

function LigneDetail({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{libelle}</dt>
      <dd className="text-right font-medium text-slate-800">{valeur}</dd>
    </div>
  );
}
