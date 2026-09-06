"use client";

import { useEffect, useState } from "react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";

export default function PageProduitsAdmin() {
  const [produits, setProduits] = useState<
    Array<{
      id: string;
      nom: string;
      sku: string;
      prix: number;
      image: string | null;
      quantiteStock: number;
      disponible: boolean;
      nomCategorie: string;
    }>
  >([]);

  useEffect(() => {
    appelerApi<{ produits: typeof produits }>("/admin/produits")
      .then((donnees) => setProduits(donnees.produits))
      .catch(() => setProduits([]));
  }, []);

  return (
    <MiseEnPageAdmin titre="Produits" sousTitre="Catalogue MateMedical">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {produits.map((produit) => (
                <tr key={produit.id} className="border-t border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{produit.nom}</td>
                  <td className="px-4 py-3 text-slate-500">{produit.sku}</td>
                  <td className="px-4 py-3 text-slate-500">{produit.nomCategorie}</td>
                  <td className="px-4 py-3">{formaterMontant(produit.prix)}</td>
                  <td className="px-4 py-3">{produit.quantiteStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MiseEnPageAdmin>
  );
}
