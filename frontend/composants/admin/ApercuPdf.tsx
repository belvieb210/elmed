"use client";

import { ExternalLink, FileText, Download } from "lucide-react";

export function ApercuPdf({
  url,
  titre,
  sousTitre,
  onOuvrir,
  onTelecharger,
}: {
  url: string | null;
  titre: string;
  sousTitre?: string;
  onOuvrir: () => void;
  onTelecharger?: () => void;
}) {
  return (
    <div className="bg-slate-100 p-3">
      {/* Desktop : prévisualisation iframe */}
      <div className="hidden md:block">
        {url ? (
          <iframe
            title={titre}
            src={`${url}#toolbar=1&navpanes=0`}
            className="h-[420px] w-full rounded-lg border border-bleu-hero bg-white xl:h-[520px]"
          />
        ) : (
          <div className="grid h-[420px] place-items-center rounded-lg border border-bleu-hero bg-white text-sm text-slate-500 xl:h-[520px]">
            Chargement de la facture...
          </div>
        )}
      </div>

      {/* Mobile : les navigateurs n’affichent pas les PDF blob dans une iframe */}
      <div className="md:hidden">
        <div className="rounded-2xl border border-bleu-hero bg-white px-4 py-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-clair text-violet-marque">
            <FileText className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-semibold text-slate-800">{titre}</p>
          {sousTitre && <p className="mt-1 text-xs text-slate-500">{sousTitre}</p>}
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Sur téléphone, la facture s’ouvre dans le lecteur PDF de votre appareil.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={!url}
              onClick={onOuvrir}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              {url ? "Voir la facture" : "Chargement..."}
            </button>
            {onTelecharger && (
              <button
                type="button"
                disabled={!url}
                onClick={onTelecharger}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-bleu-hero px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Télécharger le PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
