"use client";

import Link from "next/link";
import { Eye, Package, Plus, RotateCcw, ShoppingCart } from "lucide-react";
import { formaterMontant } from "@/lib/formatage";

export type ApercuProduit = {
  id?: string;
  nom: string;
  sku: string;
  description: string;
  prix: number;
  quantiteStock: number;
  nomCategorie: string;
  disponible: boolean;
  populaire: boolean;
  images: string[];
  videoUrl: string | null;
  videoCouverture: string | null;
  caracteristiques: Array<{ libelle: string; valeur: string }>;
};

export function PanneauLateralProduit({
  apercu,
  onNouveau,
  onAnnuler,
}: {
  apercu: ApercuProduit;
  onNouveau: () => void;
  onAnnuler: () => void;
}) {
  const imagePrincipale = apercu.images.find(Boolean) || apercu.videoCouverture;
  const vignettes = [
    ...apercu.images.filter(Boolean).slice(0, 4),
    ...(apercu.videoUrl ? [apercu.videoCouverture || apercu.videoUrl] : []),
  ].slice(0, 5);

  const lignes = [
    { label: "SKU", valeur: apercu.sku || "—" },
    { label: "Catégorie", valeur: apercu.nomCategorie || "—" },
    { label: "Prix", valeur: apercu.prix > 0 ? formaterMontant(apercu.prix) : "—" },
    { label: "Stock", valeur: String(apercu.quantiteStock || 0) },
    { label: "Statut", valeur: apercu.disponible ? "Publié" : "Masqué" },
    { label: "Populaire", valeur: apercu.populaire ? "Oui" : "Non" },
    { label: "Médias", valeur: `${apercu.images.filter(Boolean).length}/4 img · ${apercu.videoUrl ? "1" : "0"} vid` },
    { label: "Specs", valeur: `${apercu.caracteristiques.filter((c) => c.libelle && c.valeur).length}` },
  ];

  return (
    <aside className="space-y-4 xl:sticky xl:top-[calc(var(--hauteur-en-tete)+1rem)]">
      <article className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
        <div className="border-b border-bleu-hero px-5 py-3">
          <h2 className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Aperçu catalogue
          </h2>
        </div>

        <div className="p-4">
          <div className="overflow-hidden rounded-2xl border border-bleu-hero bg-slate-50">
            {imagePrincipale ? (
              <img src={imagePrincipale} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center text-slate-300">
                <Package className="h-12 w-12" />
              </div>
            )}
          </div>

          {vignettes.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto">
              {vignettes.map((url, index) => (
                <span
                  key={`${url}-${index}`}
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-bleu-hero"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </span>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-violet-marque">
            {apercu.nomCategorie || "Catégorie"}
          </p>
          <p className="mt-1 text-base font-semibold text-[#1e3a8a]">
            {apercu.nom.trim() || "Nouveau produit"}
          </p>
          <p className="mt-1 text-xs text-slate-400">SKU : {apercu.sku || "—"}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
            {apercu.description || "Description courte visible sur la fiche client."}
          </p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="text-xl font-semibold text-slate-900">
              {apercu.prix > 0 ? formaterMontant(apercu.prix) : "0,00 $"}
            </p>
            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-marque/10 px-2 py-1 text-[11px] font-semibold text-violet-marque">
              <ShoppingCart className="h-3 w-3" />
              Carte client
            </span>
          </div>
        </div>

        <dl className="space-y-2.5 border-t border-bleu-hero px-5 py-4 text-sm">
          {lignes.map((ligne) => (
            <div key={ligne.label} className="flex items-start justify-between gap-3">
              <dt className="text-slate-400">{ligne.label}</dt>
              <dd className="text-right font-medium text-[#1e3a8a]">{ligne.valeur}</dd>
            </div>
          ))}
        </dl>

        {apercu.caracteristiques.some((c) => c.libelle && c.valeur) && (
          <div className="border-t border-bleu-hero px-5 py-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Caractéristiques
            </p>
            <ul className="space-y-1.5 text-sm">
              {apercu.caracteristiques
                .filter((c) => c.libelle && c.valeur)
                .slice(0, 6)
                .map((c) => (
                  <li key={`${c.libelle}-${c.valeur}`} className="flex justify-between gap-2">
                    <span className="text-slate-400">{c.libelle}</span>
                    <span className="text-right font-medium text-slate-700">{c.valeur}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-bleu-hero bg-white p-5">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Actions rapides
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <BoutonAction icone={Plus} libelle="Nouveau produit" onClick={onNouveau} />
          <BoutonAction icone={RotateCcw} libelle="Réinitialiser" onClick={onAnnuler} />
          {apercu.id ? (
            <Link
              href={`/produits/${apercu.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 flex min-h-16 items-center justify-center gap-2 rounded-xl border border-bleu-hero bg-slate-50 px-3 py-3 text-xs font-semibold text-[#1e3a8a] hover:bg-white"
            >
              <Eye className="h-4 w-4" />
              Voir la fiche publique
            </Link>
          ) : (
            <p className="col-span-2 rounded-xl border border-dashed border-bleu-hero bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
              Enregistrez pour ouvrir la fiche côté client
            </p>
          )}
        </div>
      </article>
    </aside>
  );
}

function BoutonAction({
  icone: Icone,
  libelle,
  onClick,
}: {
  icone: typeof Plus;
  libelle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-bleu-hero bg-slate-50 px-2 py-3 text-center text-xs font-semibold text-[#1e3a8a] hover:bg-white"
    >
      <Icone className="h-5 w-5" />
      {libelle}
    </button>
  );
}
