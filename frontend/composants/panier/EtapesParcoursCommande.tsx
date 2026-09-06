import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const etapesParcoursCommande = ["Panier", "Paiement", "Confirmation", "Livraison"] as const;

const liensEtapes: Record<number, string> = {
  1: "/panier",
  2: "/panier/paiement",
};

export function BoutonRetourEtape({
  href,
  onClick,
  libelle = "Retour",
}: {
  href?: string;
  onClick?: () => void;
  libelle?: string;
}) {
  const classe =
    "inline-flex items-center gap-2 rounded-xl border border-bleu-hero bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

  if (href) {
    return (
      <Link href={href} className={classe}>
        <ArrowLeft className="h-4 w-4" />
        {libelle}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classe}>
      <ArrowLeft className="h-4 w-4" />
      {libelle}
    </button>
  );
}

export function EtapesParcoursCommande({
  etapeCourante,
  retourAutorise = true,
}: {
  etapeCourante: 1 | 2 | 3 | 4;
  retourAutorise?: boolean;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {etapesParcoursCommande.map((nom, index) => {
        const numero = index + 1;
        const complete = numero < etapeCourante;
        const courant = numero === etapeCourante;
        const lien = retourAutorise && complete ? liensEtapes[numero] : undefined;
        const contenu = (
          <>
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                courant
                  ? "bg-orange-paiement text-white"
                  : complete
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {numero}
            </span>
            <span className={courant ? "font-medium text-slate-900" : complete ? "text-slate-600" : "text-slate-400"}>
              {nom}
            </span>
          </>
        );

        return (
          <li key={nom} className="flex items-center gap-2">
            {lien ? (
              <Link href={lien} className="flex items-center gap-2 hover:opacity-80">
                {contenu}
              </Link>
            ) : (
              <span className="flex items-center gap-2">{contenu}</span>
            )}
            {index < etapesParcoursCommande.length - 1 && <span className="text-slate-300">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
