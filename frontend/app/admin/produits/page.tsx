"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react";
import { FormulaireNouveauProduit } from "@/composants/admin/FormulaireNouveauProduit";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { ModalConfirmation } from "@/composants/admin/ModalConfirmation";
import {
  PanneauLateralProduit,
  type ApercuProduit,
} from "@/composants/admin/PanneauLateralProduit";
import { formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { estSuperAdmin } from "@/lib/roles";
import { useClient } from "@/store/contexteClient";
import type { Categorie, ProduitAdmin } from "@/types/modeles";

const LIMITE_PAGE = 8;
const SEUIL_STOCK_FAIBLE = 10;

const apercuVide: ApercuProduit = {
  nom: "",
  sku: "",
  description: "",
  prix: 0,
  quantiteStock: 0,
  nomCategorie: "",
  disponible: true,
  populaire: false,
  images: [],
  videoUrl: null,
  videoCouverture: null,
  caracteristiques: [],
};

export default function PageProduitsAdmin() {
  const { utilisateur } = useClient();
  const superAdmin = estSuperAdmin(utilisateur?.role);

  const [produits, setProduits] = useState<ProduitAdmin[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [apercu, setApercu] = useState<ApercuProduit>(apercuVide);
  const [produitAModifier, setProduitAModifier] = useState<ProduitAdmin | null>(null);
  const [produitAfficheId, setProduitAfficheId] = useState<string | null>(null);
  const [cleFormulaire, setCleFormulaire] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [produitASupprimer, setProduitASupprimer] = useState<ProduitAdmin | null>(null);

  const enregistrerApercu = useCallback((suivant: ApercuProduit) => {
    setApercu((actuel) => {
      if (!actuel.id) return suivant;
      if (suivant.id && suivant.id === actuel.id) return suivant;
      return actuel;
    });
  }, []);

  const chargerProduits = useCallback(() => {
    appelerApi<{ produits: ProduitAdmin[] }>("/admin/produits")
      .then((donnees) => setProduits(donnees.produits))
      .catch(() => setProduits([]));
  }, []);

  useEffect(() => {
    chargerProduits();
    appelerApi<{ categories: Categorie[] }>("/categories")
      .then((donnees) => setCategories(donnees.categories))
      .catch(() => setCategories([]));
  }, [chargerProduits]);

  const alertesStock = useMemo(
    () =>
      produits
        .filter((produit) => produit.quantiteStock <= SEUIL_STOCK_FAIBLE)
        .sort((a, b) => a.quantiteStock - b.quantiteStock),
    [produits],
  );

  const totalPages = Math.max(1, Math.ceil(produits.length / LIMITE_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const produitsPage = useMemo(() => {
    const debut = (pageCourante - 1) * LIMITE_PAGE;
    return produits.slice(debut, debut + LIMITE_PAGE);
  }, [produits, pageCourante]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function afficherProduit(produit: ProduitAdmin) {
    setProduitAfficheId(produit.id);
    setApercu(apercuDepuisProduit(produit));
  }

  function reinitialiser() {
    setCleFormulaire((actuel) => actuel + 1);
    setApercu(apercuVide);
    setProduitAfficheId(null);
    setProduitAModifier(null);
    setMessage(null);
  }

  async function chargerPourEdition(produit: ProduitAdmin) {
    if (!superAdmin) {
      setMessage("Seul un Super Admin peut modifier ou supprimer un produit.");
      afficherProduit(produit);
      return;
    }
    try {
      const detail = await appelerApi<{ produit: ProduitAdmin }>(`/admin/produits/${produit.id}`);
      setProduitAModifier(detail.produit);
      afficherProduit(detail.produit);
      setCleFormulaire((actuel) => actuel + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setProduitAModifier(produit);
      afficherProduit(produit);
      setCleFormulaire((actuel) => actuel + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function supprimerProduit() {
    if (!produitASupprimer) return;
    if (!superAdmin) {
      setMessage("Seul un Super Admin peut supprimer un produit.");
      setProduitASupprimer(null);
      return;
    }
    const produit = produitASupprimer;
    setSuppressionEnCours(produit.id);
    try {
      const reponse = await appelerApi<{ message: string; desactive?: boolean }>(
        `/admin/produits/${produit.id}`,
        { method: "DELETE" },
      );
      setMessage(reponse.message);
      if (reponse.desactive) {
        setProduits((actuels) =>
          actuels.map((item) => (item.id === produit.id ? { ...item, disponible: false } : item)),
        );
      } else {
        setProduits((actuels) => actuels.filter((item) => item.id !== produit.id));
      }
      if (produitAModifier?.id === produit.id || produitAfficheId === produit.id) {
        reinitialiser();
      }
      setProduitASupprimer(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setSuppressionEnCours(null);
    }
  }

  return (
    <MiseEnPageAdmin
      titre="Produits"
      sousTitre="Publier le catalogue : médias, prix et caractéristiques"
    >
      {message && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {alertesStock.length > 0 && (
        <div className="mb-4 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Stock à surveiller ({alertesStock.length} produit
                {alertesStock.length > 1 ? "s" : ""})
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Après une vente, le stock baisse automatiquement. Pour réapprovisionner : Super Admin →
                Modifier le produit → augmenter « Stock disponible » → Mettre à jour. En rupture (0),
                masquez temporairement le produit ou réapprovisionnez immédiatement.
              </p>
            </div>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {alertesStock.slice(0, 5).map((produit) => (
              <li
                key={produit.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2"
              >
                <span className="font-medium text-slate-800">
                  {produit.nom}{" "}
                  <span className="text-slate-400">({produit.sku})</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    produit.quantiteStock <= 0
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {produit.quantiteStock <= 0
                    ? "Rupture — réapprovisionner"
                    : `${produit.quantiteStock} restant(s) — réapprovisionner`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!superAdmin && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Vous pouvez publier de nouveaux produits. La modification et la suppression sont réservées au
          Super Admin.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <FormulaireNouveauProduit
            key={cleFormulaire}
            categories={categories}
            produitAModifier={produitAModifier}
            peutModifier={superAdmin}
            onApercu={enregistrerApercu}
            onAnnuler={reinitialiser}
            onCree={(produit) => {
              setProduits((actuels) => [produit, ...actuels.filter((item) => item.id !== produit.id)]);
              afficherProduit(produit);
              setMessage(
                "Produit publié. Il s’affiche côté client sur /produits (et la fiche détail) s’il est marqué « Publié ».",
              );
              setPage(1);
              setCleFormulaire((actuel) => actuel + 1);
            }}
            onModifie={(produit) => {
              setProduits((actuels) =>
                actuels.map((item) => (item.id === produit.id ? produit : item)),
              );
              setProduitAModifier(null);
              afficherProduit(produit);
              setMessage("Produit mis à jour — visible immédiatement côté client.");
              setCleFormulaire((actuel) => actuel + 1);
            }}
          />
        </div>
        <div className="xl:col-span-4">
          <PanneauLateralProduit apercu={apercu} onNouveau={reinitialiser} onAnnuler={reinitialiser} />
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-bleu-hero bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bleu-hero px-4 py-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Catalogue ({produits.length})
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {LIMITE_PAGE} par page — page {pageCourante} / {totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageCourante <= 1}
              onClick={() => setPage((actuel) => Math.max(1, actuel - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-bleu-hero px-3 py-2 text-xs font-semibold uppercase text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <button
              type="button"
              disabled={pageCourante >= totalPages}
              onClick={() => setPage((actuel) => Math.min(totalPages, actuel + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-bleu-hero px-3 py-2 text-xs font-semibold uppercase text-slate-600 disabled:opacity-40"
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
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {produitsPage.map((produit) => {
                const affiche = produitAfficheId === produit.id;
                const stockFaible = produit.quantiteStock <= SEUIL_STOCK_FAIBLE;
                return (
                  <tr
                    key={produit.id}
                    onClick={() => afficherProduit(produit)}
                    className={`cursor-pointer border-t border-bleu-hero ${
                      affiche ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {produit.image ? (
                          <img
                            src={produit.image}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
                            —
                          </span>
                        )}
                        <span className="font-medium text-slate-800">{produit.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{produit.sku}</td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      {produit.nomCategorie}
                    </td>
                    <td className="px-4 py-3">{formaterMontant(produit.prix)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          stockFaible
                            ? produit.quantiteStock <= 0
                              ? "font-semibold text-rose-700"
                              : "font-semibold text-amber-700"
                            : undefined
                        }
                      >
                        {produit.quantiteStock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          produit.disponible
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {produit.disponible ? "Publié" : "Masqué"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            afficherProduit(produit);
                          }}
                          className="rounded-lg border border-bleu-hero p-1.5 text-slate-600"
                          aria-label="Voir le résumé"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {superAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void chargerPourEdition(produit);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-bleu-hero px-2 py-1.5 text-xs font-semibold uppercase text-slate-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Modifier
                          </button>
                        )}
                        <Link
                          href={`/produits/${produit.id}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-bleu-hero px-2 py-1.5 text-xs font-semibold uppercase text-slate-600"
                        >
                          Fiche
                        </Link>
                        {superAdmin && (
                        <button
                          type="button"
                          disabled={suppressionEnCours === produit.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProduitASupprimer(produit);
                          }}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 disabled:opacity-50"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {produits.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-400">
            Aucun produit. Remplissez le formulaire pour publier le premier article du catalogue.
          </p>
        )}
        {produits.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bleu-hero px-4 py-3 text-xs text-slate-500">
            <span>
              Affichage {(pageCourante - 1) * LIMITE_PAGE + 1}–
              {Math.min(pageCourante * LIMITE_PAGE, produits.length)} sur {produits.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageCourante <= 1}
                onClick={() => setPage((actuel) => Math.max(1, actuel - 1))}
                className="rounded-lg border border-bleu-hero px-3 py-1.5 font-semibold uppercase disabled:opacity-40"
              >
                Précédent
              </button>
              <span>
                {pageCourante} / {totalPages}
              </span>
              <button
                type="button"
                disabled={pageCourante >= totalPages}
                onClick={() => setPage((actuel) => Math.min(totalPages, actuel + 1))}
                className="rounded-lg border border-bleu-hero px-3 py-1.5 font-semibold uppercase disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </section>

      <ModalConfirmation
        ouverte={Boolean(produitASupprimer)}
        titre="Retirer du catalogue"
        message={
          produitASupprimer
            ? `Retirer « ${produitASupprimer.nom} » du catalogue ? Si le produit a déjà des commandes, il sera masqué plutôt que supprimé.`
            : ""
        }
        confirmerLibelle="Retirer"
        danger
        enCours={Boolean(suppressionEnCours)}
        onAnnuler={() => {
          if (!suppressionEnCours) setProduitASupprimer(null);
        }}
        onConfirmer={() => void supprimerProduit()}
      />
    </MiseEnPageAdmin>
  );
}

function apercuDepuisProduit(produit: ProduitAdmin): ApercuProduit {
  const images = produit.images?.length
    ? produit.images
    : produit.medias?.filter((m) => m.type === "IMAGE").map((m) => m.url) ??
      (produit.image ? [produit.image] : []);
  const video = produit.medias?.find((m) => m.type === "VIDEO");

  return {
    id: produit.id,
    nom: produit.nom,
    sku: produit.sku,
    description: produit.description ?? "",
    prix: produit.prix,
    quantiteStock: produit.quantiteStock,
    nomCategorie: produit.nomCategorie,
    disponible: produit.disponible,
    populaire: Boolean(produit.populaire),
    images,
    videoUrl: video?.url ?? null,
    videoCouverture: video?.urlCouverture ?? null,
    caracteristiques: produit.caracteristiques ?? [],
  };
}
