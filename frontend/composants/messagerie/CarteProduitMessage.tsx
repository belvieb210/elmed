"use client";

import Link from "next/link";
import { formaterHeure, formaterMontant } from "@/lib/formatage";
import type { FicheProduitMessage, MessageChat } from "@/types/modeles";

export function CarteProduitMessage({
  fiche,
  message,
  lienProduit = true,
}: {
  fiche: FicheProduitMessage;
  message: MessageChat;
  lienProduit?: boolean;
}) {
  const corps = (
    <div className="overflow-hidden rounded-2xl border border-bleu-hero bg-white shadow-sm">
      {fiche.image && <img src={fiche.image} alt={fiche.nom} className="h-40 w-full object-cover" />}
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{fiche.nom}</p>
        <p className="mt-1 text-lg font-bold text-slate-900">{formaterMontant(fiche.prix)}</p>
        <p className="mt-1 text-xs text-slate-500">SKU : {fiche.sku}</p>
      </div>
    </div>
  );

  return (
    <div className={`max-w-[92%] sm:max-w-[320px] ${message.estMoi ? "ml-auto" : ""}`}>
      {lienProduit ? (
        <Link href={`/produits/${fiche.produitId}`} className="block">
          {corps}
        </Link>
      ) : (
        corps
      )}
      <p className={`mt-1 text-[10px] text-slate-400 ${message.estMoi ? "text-right" : ""}`}>
        {message.estMoi ? "Vous" : message.nomAuteur} · {formaterHeure(message.dateEnvoi)}
      </p>
    </div>
  );
}
