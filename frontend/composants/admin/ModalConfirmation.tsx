"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ModalConfirmation({
  ouverte,
  titre,
  message,
  confirmerLibelle = "Confirmer",
  annulerLibelle = "Annuler",
  danger = false,
  enCours = false,
  onConfirmer,
  onAnnuler,
}: {
  ouverte: boolean;
  titre: string;
  message: string;
  confirmerLibelle?: string;
  annulerLibelle?: string;
  danger?: boolean;
  enCours?: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) {
  useEffect(() => {
    if (!ouverte) return;
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") onAnnuler();
    }
    document.addEventListener("keydown", surTouche);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = "";
    };
  }, [ouverte, onAnnuler]);

  if (!ouverte) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        aria-label="Fermer"
        onClick={onAnnuler}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmation-titre"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-bleu-hero bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-bleu-hero px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                danger ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-700"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id="modal-confirmation-titre" className="text-base font-semibold text-[#1e3a8a]">
                {titre}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={enCours}
            className="rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
          >
            {annulerLibelle}
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={enCours}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
            }`}
          >
            {enCours ? "Traitement..." : confirmerLibelle}
          </button>
        </div>
      </div>
    </div>
  );
}
