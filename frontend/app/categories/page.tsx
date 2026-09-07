"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical, Layers, Microscope, Package, Pill, ShieldCheck } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { appelerApi } from "@/lib/api";
import type { Categorie } from "@/types/modeles";

const icones: Record<string, typeof Package> = {
  flask: FlaskConical,
  microscope: Microscope,
  package: Package,
  pill: Pill,
  shield: ShieldCheck,
  layers: Layers,
};

export default function PageCategories() {
  const [categories, setCategories] = useState<Categorie[]>([]);

  useEffect(() => {
    appelerApi<{ categories: Categorie[] }>("/categories")
      .then((donnees) => setCategories(donnees.categories))
      .catch(async () => {
        const { tableauDeBordDemo } = await import("@/lib/donneesDemo");
        setCategories(tableauDeBordDemo.categories);
      });
  }, []);

  return (
    <MiseEnPageClient>
      <EnTetePage titre="Catégories" description="Parcourez le catalogue par famille de produits." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((categorie) => {
          const Icone = icones[categorie.icone] ?? Package;
          return (
            <Link
              key={categorie.id}
              href={`/produits?categorie=${categorie.slug}`}
              className="rounded-2xl border border-bleu-hero bg-white p-5 transition hover:border-bleu-hero"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-clair text-violet-marque">
                <Icone className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-800">{categorie.nom}</h2>
              <p className="mt-1 text-sm text-slate-500">{categorie.description}</p>
              <p className="mt-3 text-sm font-medium text-violet-marque">
                {categorie.nombreProduits} produits
              </p>
            </Link>
          );
        })}
      </div>
    </MiseEnPageClient>
  );
}
