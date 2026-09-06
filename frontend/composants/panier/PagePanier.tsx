"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Trash2,
} from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { BoutonRetourEtape, EtapesParcoursCommande } from "@/composants/panier/EtapesParcoursCommande";
import { formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { useClient } from "@/store/contexteClient";
import type { ArticlePanier, EntrepotResume } from "@/types/modeles";

const modesPaiement = [
  { id: "CARTE_BANCAIRE", libelle: "Paiement en ligne" },
  { id: "PAIEMENT_RETRAIT", libelle: "Paiement au retrait" },
  { id: "PAIEMENT_LIVRAISON", libelle: "Paiement à la livraison" },
];

const entrepotParDefaut: EntrepotResume = {
  nom: "Entrepôt Central Kinshasa",
  adresse: "Avenue des Poids Lourds",
  ville: "Kinshasa",
  latitude: -4.3276,
  longitude: 15.3136,
};

function classeCategorie(slug?: string) {
  if (slug?.includes("reactif")) return "bg-violet-100 text-violet-700";
  if (slug?.includes("equip")) return "bg-sky-100 text-sky-700";
  if (slug?.includes("conso")) return "bg-orange-100 text-orange-700";
  if (slug?.includes("medic")) return "bg-emerald-100 text-emerald-700";
  if (slug?.includes("secur")) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export function PagePanier() {
  const routeur = useRouter();
  const { panier, chargerPanier, chargerTableauDeBord } = useClient();
  const [selection, setSelection] = useState<string[]>([]);
  const [modePaiement, setModePaiement] = useState("CARTE_BANCAIRE");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    chargerPanier();
  }, [chargerPanier]);

  const articles = panier?.articles ?? [];

  useEffect(() => {
    setSelection(articles.map((article) => article.id));
  }, [panier?.articles]);

  const articlesSelectionnes = useMemo(
    () => articles.filter((article) => selection.includes(article.id)),
    [articles, selection],
  );
  const sousTotal = articlesSelectionnes.reduce((somme, article) => somme + article.sousTotal, 0);
  const entrepot = panier?.entrepot ?? entrepotParDefaut;
  const carteUrl =
    entrepot.latitude && entrepot.longitude
      ? `https://www.google.com/maps?q=${entrepot.latitude},${entrepot.longitude}`
      : `https://www.google.com/maps/search/${encodeURIComponent(`${entrepot.adresse} ${entrepot.ville}`)}`;
  const itineraireUrl =
    entrepot.latitude && entrepot.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${entrepot.latitude},${entrepot.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${entrepot.adresse} ${entrepot.ville}`)}`;
  const carteEmbed =
    entrepot.latitude && entrepot.longitude
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${entrepot.longitude - 0.02}%2C${entrepot.latitude - 0.015}%2C${entrepot.longitude + 0.02}%2C${entrepot.latitude + 0.015}&layer=mapnik&marker=${entrepot.latitude}%2C${entrepot.longitude}`
      : null;

  async function changerQuantite(id: string, quantite: number) {
    await appelerApi(`/panier/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantite }),
    });
    await Promise.all([chargerPanier(), chargerTableauDeBord()]);
  }

  async function supprimerSelection() {
    if (selection.length === 0 || selection.length === articles.length) {
      await appelerApi("/panier", { method: "DELETE" });
    } else {
      await Promise.all(selection.map((id) => appelerApi(`/panier/${id}`, { method: "DELETE" })));
    }
    await Promise.all([chargerPanier(), chargerTableauDeBord()]);
  }

  async function envoyerCommande() {
    if (articles.length === 0) return;
    if (modePaiement === "CARTE_BANCAIRE") {
      routeur.push("/panier/paiement");
      return;
    }
    setEnCours(true);
    setMessage(null);
    try {
      const resultat = await appelerApi<{
        message: string;
        commande: { id: string };
      }>("/commandes", {
        method: "POST",
        body: JSON.stringify({ modePaiement }),
      });
      setMessage(resultat.message);
      await Promise.all([chargerPanier(), chargerTableauDeBord()]);
      routeur.push(`/panier/livraison?commande=${resultat.commande.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <MiseEnPageClient>
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <BoutonRetourEtape href="/produits" libelle="Retour aux produits" />
          <h1 className="text-2xl font-semibold text-slate-900">Mon panier</h1>
        </div>
        <div className="mt-3">
          <EtapesParcoursCommande etapeCourante={1} />
        </div>
      </div>

      {!panier || articles.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Votre panier est vide.</p>
          <Link href="/produits" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-marque">
            <ArrowLeft className="h-4 w-4" />
            Continuer mes achats
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs sm:px-4 sm:text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={selection.length === articles.length}
                  onChange={(evenement) =>
                    setSelection(evenement.target.checked ? articles.map((article) => article.id) : [])
                  }
                  className="h-4 w-4 rounded border-slate-300 text-violet-marque"
                />
                {selection.length} article{selection.length > 1 ? "s" : ""} sélectionné{selection.length > 1 ? "s" : ""}
              </label>
              <button
                type="button"
                onClick={supprimerSelection}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 sm:text-sm"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>

            <div className="space-y-3">
              {articles.map((article) => (
                <LigneArticle
                  key={article.id}
                  article={article}
                  selectionne={selection.includes(article.id)}
                  onSelection={(cochee) =>
                    setSelection((actuel) =>
                      cochee ? [...actuel, article.id] : actuel.filter((id) => id !== article.id),
                    )
                  }
                  onQuantite={changerQuantite}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/produits"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Continuer mes achats
              </Link>
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <Link
                  href="/panier/proforma"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  Facture proforma
                </Link>
                <button
                  type="button"
                  onClick={envoyerCommande}
                  disabled={enCours}
                  className="rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
                >
                  {enCours ? "Envoi..." : "Passer la commande →"}
                </button>
              </div>
            </div>
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Résumé de la commande</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Sous-total</dt>
                <dd>{formaterMontant(sousTotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Frais de livraison</dt>
                <dd>{formaterMontant(0)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Remises</dt>
                <dd>{formaterMontant(0)}</dd>
              </div>
            </dl>
            <div className="rounded-xl bg-violet-clair px-4 py-3">
              <p className="text-sm text-slate-600">Total à payer</p>
              <p className="text-xl font-semibold text-violet-marque">{formaterMontant(sousTotal)}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Mode de paiement</p>
              <div className="space-y-2">
                {modesPaiement.map((mode) => (
                  <label key={mode.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="mode-paiement"
                      checked={modePaiement === mode.id}
                      onChange={() => setModePaiement(mode.id)}
                      className="text-violet-marque"
                    />
                    {mode.libelle}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Point de retrait / Livraison</p>
              <p className="text-sm font-medium text-slate-800">{entrepot.nom}</p>
              <p className="text-sm text-slate-500">
                {entrepot.adresse}, {entrepot.ville}
              </p>
              {entrepot.heures && <p className="text-xs text-slate-400">{entrepot.heures}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={carteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Voir sur la carte
                </a>
                <a
                  href={itineraireUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Obtenir l&apos;itinéraire
                </a>
              </div>
              {carteEmbed && (
                <iframe
                  title="Carte de l'entrepôt"
                  src={carteEmbed}
                  className="mt-3 h-32 w-full rounded-xl border border-slate-200"
                />
              )}
            </div>

            <button
              type="button"
              onClick={envoyerCommande}
              disabled={enCours}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-marque py-3 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {enCours ? "Envoi..." : "Confirmer la commande"}
            </button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </aside>
        </div>
      )}

      <BandeauMessagerie />
    </MiseEnPageClient>
  );
}

function LigneArticle({
  article,
  selectionne,
  onSelection,
  onQuantite,
}: {
  article: ArticlePanier;
  selectionne: boolean;
  onSelection: (cochee: boolean) => void;
  onQuantite: (id: string, quantite: number) => Promise<void>;
}) {
  const [attente, setAttente] = useState(false);

  async function changer(quantite: number) {
    setAttente(true);
    try {
      await onQuantite(article.id, quantite);
    } finally {
      setAttente(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selectionne}
          onChange={(evenement) => onSelection(evenement.target.checked)}
          className="mt-2 h-4 w-4 rounded border-slate-300 text-violet-marque"
          aria-label={`Sélectionner ${article.nomProduit}`}
        />
        <img src={article.image ?? ""} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 object-cover sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1">
          {article.nomCategorie && (
            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${classeCategorie(article.slugCategorie)}`}>
              {article.nomCategorie}
            </span>
          )}
          <h2 className="mt-1 text-sm font-medium text-slate-800 sm:text-base">{article.nomProduit}</h2>
          <p className="text-xs text-slate-400">
            SKU : {article.sku}
            {article.numeroLot ? ` · Lot : ${article.numeroLot}` : ""}
          </p>
          <p className={`mt-1 text-xs font-medium ${(article.quantiteStock ?? 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {(article.quantiteStock ?? 0) > 0 ? `En stock (${article.quantiteStock})` : "Rupture de stock"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-800">{formaterMontant(article.prixUnitaire)}</p>
          <p className="text-xs text-slate-400">
            ({article.quantite} × {formaterMontant(article.prixUnitaire)})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200">
            <button type="button" className="px-2.5 py-1.5" disabled={attente} onClick={() => changer(article.quantite - 1)}>
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{article.quantite}</span>
            <button type="button" className="px-2.5 py-1.5" disabled={attente} onClick={() => changer(article.quantite + 1)}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="min-w-16 text-right text-sm font-semibold">{formaterMontant(article.sousTotal)}</p>
          <button type="button" className="text-red-500" onClick={() => changer(0)} aria-label="Retirer">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
