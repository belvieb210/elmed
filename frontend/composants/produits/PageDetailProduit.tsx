"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { CarteProduit } from "@/composants/client/CarteProduit";
import { GalerieProduit } from "@/composants/produits/GalerieProduit";
import { appelerApi } from "@/lib/api";
import { formaterMontant } from "@/lib/formatage";
import { useClient } from "@/store/contexteClient";
import type { DetailProduit } from "@/types/modeles";

export function PageDetailProduit({ identifiantProduit }: { identifiantProduit: string }) {
  const { ajouterProduitAuPanier } = useClient();
  const [produit, setProduit] = useState<DetailProduit | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const bandeauSimilaires = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProduit(null);
    appelerApi<{ produit: DetailProduit }>(`/produits/${identifiantProduit}`).then((donnees) => {
      setProduit(donnees.produit);
      setQuantite(1);
      setMessage(null);
    });
  }, [identifiantProduit]);

  async function ajouter() {
    if (!produit) return;
    setEnCours(true);
    try {
      for (let index = 0; index < quantite; index += 1) {
        await ajouterProduitAuPanier(produit.id);
      }
      setMessage("Produit ajouté au panier.");
    } finally {
      setEnCours(false);
    }
  }

  function defiler(direction: number) {
    bandeauSimilaires.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  }

  if (!produit) {
    return (
      <MiseEnPageClient>
        <p className="text-sm text-slate-500">Chargement du produit...</p>
      </MiseEnPageClient>
    );
  }

  const moitie = Math.ceil(produit.caracteristiques.length / 2);
  const colonneGauche = produit.caracteristiques.slice(0, moitie);
  const colonneDroite = produit.caracteristiques.slice(moitie);

  return (
    <MiseEnPageClient>
      <p className="mb-4 text-sm text-slate-500">
        <Link href="/produits" className="hover:text-violet-marque">
          Produits
        </Link>
        {produit.slugCategorie && (
          <>
            {" / "}
            <Link href={`/produits?categorie=${produit.slugCategorie}`} className="hover:text-violet-marque">
              {produit.nomCategorie}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-slate-800">{produit.nom}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <GalerieProduit images={produit.images?.length ? produit.images : [produit.image ?? ""]} nomProduit={produit.nom} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-marque">
            {produit.nomCategorie}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{produit.nom}</h1>
          <p className="mt-2 text-sm text-slate-500">SKU : {produit.sku}</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{produit.description}</p>
          <p className="mt-5 text-3xl font-semibold text-slate-900">{formaterMontant(produit.prix)}</p>
          <p className="mt-1 text-sm text-slate-500">
            Stock disponible : {produit.quantiteStock ?? 0} · Prix unitaire hors taxes
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200">
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQuantite((actuel) => Math.max(1, actuel - 1))}
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantite}</span>
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQuantite((actuel) => actuel + 1)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={ajouter}
              disabled={enCours}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-marque px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {enCours ? "Ajout..." : "Ajouter au panier"}
            </button>
          </div>
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        </div>
      </div>

      {produit.caracteristiques.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Caractéristiques du produit</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid md:grid-cols-2">
              <TableauCaracteristiques lignes={colonneGauche} />
              <TableauCaracteristiques lignes={colonneDroite} />
            </div>
          </div>
        </section>
      )}

      {produit.produitsSimilaires.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Autres recommandations pour votre entreprise</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => defiler(-1)}
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => defiler(1)}
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white"
                aria-label="Suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div ref={bandeauSimilaires} className="flex gap-3 overflow-x-auto pb-2">
            {produit.produitsSimilaires.map((similaire) => (
              <div key={similaire.id} className="w-56 shrink-0">
                <CarteProduit produit={similaire} />
              </div>
            ))}
          </div>
        </section>
      )}

      <BandeauMessagerie />
    </MiseEnPageClient>
  );
}

function TableauCaracteristiques({
  lignes,
}: {
  lignes: { libelle: string; valeur: string }[];
}) {
  return (
    <div>
      {lignes.map((ligne) => (
        <div key={ligne.libelle} className="grid grid-cols-2 border-b border-slate-100 text-sm last:border-b-0">
          <p className="bg-slate-50 px-4 py-2.5 text-slate-500">{ligne.libelle}</p>
          <p className="px-4 py-2.5 font-medium text-slate-800">{ligne.valeur}</p>
        </div>
      ))}
    </div>
  );
}
