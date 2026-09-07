"use client";

import { FileText, X } from "lucide-react";
import { formaterTailleFichier } from "@/lib/formatage";
import { estImage, type PieceJointeBrouillon } from "@/lib/messagerie";

export function ApercuPiecesJointes({
  fichiers,
  onRetirer,
}: {
  fichiers: PieceJointeBrouillon[];
  onRetirer: (id: string) => void;
}) {
  if (fichiers.length === 0) return null;
  return (
    <div className="rounded-2xl border border-bleu-hero bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bleu-hero">
        {fichiers.length} fichier{fichiers.length > 1 ? "s" : ""} joint{fichiers.length > 1 ? "s" : ""}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {fichiers.map((fichier) => (
          <div key={fichier.id} className="relative shrink-0">
            {estImage(fichier.typeMime) ? (
              <img src={fichier.dataUrl} alt={fichier.nom} className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 min-w-[180px] max-w-[220px] items-center gap-2 rounded-xl border border-bleu-hero bg-white px-3">
                <FileText className="h-8 w-8 shrink-0 text-rose-500" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">{fichier.nom}</p>
                  <p className="text-[10px] uppercase text-slate-400">
                    {fichier.nom.split(".").pop()} · {formaterTailleFichier(fichier.taille)}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => onRetirer(fichier.id)}
              className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-800 text-white"
              aria-label={`Retirer ${fichier.nom}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
