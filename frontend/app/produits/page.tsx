"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { CarteProduit } from "@/composants/client/CarteProduit";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { appelerApi } from "@/lib/api";
import type { Categorie, Produit } from "@/types/modeles";

function ContenuProduits() {
  const params = useSearchParams();
  const rechercheInitiale = params.get("recherche") ?? "";
  const categorieInitiale = params.get("categorie") ?? "";
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [filtreCategorie, setFiltreCategorie] = useState(categorieInitiale);
  const [chargementListe, setChargementListe] = useState(true);

  useEffect(() => {
    appelerApi<{ categories: Categorie[] }>("/categories")
      .then((donnees) => setCategories(donnees.categories))
      .catch(async () => {
        const { tableauDeBordDemo } = await import("@/lib/donneesDemo");
        setCategories(tableauDeBordDemo.categories);
      });
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (rechercheInitiale) query.set("recherche", rechercheInitiale);
    if (filtreCategorie) query.set("categorie", filtreCategorie);
    setChargementListe(true);
    appelerApi<{ produits: Produit[] }>(`/produits?${query.toString()}`)
      .then((donnees) => setProduits(donnees.produits))
      .catch(async () => {
        const { tableauDeBordDemo } = await import("@/lib/donneesDemo");
        setProduits(tableauDeBordDemo.produitsPopulaires);
      })
      .finally(() => setChargementListe(false));
  }, [rechercheInitiale, filtreCategorie]);

  return (
    <>
      <EnTetePage
        titre="Produits"
        description="Catalogue MateMedical : réactifs, équipements, consommables et plus."
      />

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setFiltreCategorie("")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
            !filtreCategorie ? "bg-violet-marque text-white" : "bg-white text-slate-600"
          }`}
        >
          Tous
        </button>
        {categories.map((categorie) => (
          <button
            key={categorie.id}
            type="button"
            onClick={() => setFiltreCategorie(categorie.slug)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              filtreCategorie === categorie.slug
                ? "bg-violet-marque text-white"
                : "bg-white text-slate-600"
            }`}
          >
            {categorie.nom}
          </button>
        ))}
      </div>

      {chargementListe ? (
        <p className="text-sm text-slate-500">Chargement des produits...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {produits.map((produit) => (
            <CarteProduit key={produit.id} produit={produit} />
          ))}
        </div>
      )}
      <BandeauMessagerie />
    </>
  );
}

export default function PageProduits() {
  return (
    <MiseEnPageClient>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement...</p>}>
        <ContenuProduits />
      </Suspense>
    </MiseEnPageClient>
  );
}
