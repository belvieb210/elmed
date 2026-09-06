"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { ApercuProforma } from "@/composants/documents/ApercuProforma";
import { ouvrirPdf } from "@/lib/api";
import { useClient } from "@/store/contexteClient";

export function PageProforma() {
  const { panier, utilisateur, chargerPanier } = useClient();
  const [pdfEnCours, setPdfEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    void chargerPanier();
  }, [chargerPanier]);

  const articles = panier?.articles ?? [];
  const montantTotal = panier?.montantTotal ?? 0;
  const nomClient = [utilisateur?.nomSociete, utilisateur?.nomComplet].filter(Boolean).join(" — ") || "Client";

  async function telecharger() {
    setPdfEnCours(true);
    setErreur(null);
    try {
      await ouvrirPdf("/panier/proforma");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Téléchargement impossible.");
    } finally {
      setPdfEnCours(false);
    }
  }

  return (
    <MiseEnPageClient>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <EnTetePage
          titre="Facture proforma"
          description="Document mis à jour en temps réel selon votre panier."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/panier"
            className="inline-flex items-center gap-2 rounded-xl border border-bleu-hero bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au panier
          </Link>
          <button
            type="button"
            onClick={telecharger}
            disabled={pdfEnCours || articles.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {pdfEnCours ? "PDF..." : "Télécharger le PDF"}
          </button>
        </div>
      </div>

      {erreur && <p className="mb-3 text-sm text-red-600">{erreur}</p>}

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-bleu-hero bg-white p-8 text-sm text-slate-500">
          Votre panier est vide. Ajoutez des articles pour générer une proforma.
        </div>
      ) : (
        <ApercuProforma articles={articles} montantTotal={montantTotal} nomClient={nomClient} />
      )}
    </MiseEnPageClient>
  );
}
