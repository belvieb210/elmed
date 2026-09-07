"use client";

import { FormEvent, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { ApercuPiecesJointes } from "@/composants/messagerie/ApercuPiecesJointes";
import { formaterMontant } from "@/lib/formatage";
import { lirePiecesJointes, type PieceJointeBrouillon } from "@/lib/messagerie";
import type { ReponseMessage } from "@/types/modeles";

export function ComposerMessage({
  placeholder,
  reponse,
  texteInitial = "",
  onAnnulerReponse,
  onEnvoyer,
}: {
  placeholder: string;
  reponse?: ReponseMessage | null;
  texteInitial?: string;
  onAnnulerReponse?: () => void;
  onEnvoyer: (donnees: { contenu: string; fichiers: PieceJointeBrouillon[]; reponseAId?: string }) => Promise<void>;
}) {
  const [contenu, setContenu] = useState(texteInitial);
  const [fichiers, setFichiers] = useState<PieceJointeBrouillon[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const inputFichier = useRef<HTMLInputElement>(null);

  async function ajouterFichiers(liste?: FileList | null) {
    if (!liste?.length) return;
    try {
      const nouveaux = await lirePiecesJointes(liste);
      setFichiers((actuels) => [...actuels, ...nouveaux].slice(0, 10));
      setErreur(null);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Fichier refusé.");
    }
    if (inputFichier.current) inputFichier.current.value = "";
  }

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    if (!contenu.trim() && fichiers.length === 0) return;
    setEnCours(true);
    try {
      await onEnvoyer({
        contenu: contenu.trim(),
        fichiers,
        reponseAId: reponse?.id,
      });
      setContenu("");
      setFichiers([]);
      onAnnulerReponse?.();
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Envoi impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={(e) => void envoyer(e)} className="shrink-0 space-y-2 border-t border-bleu-hero bg-white p-3 sm:p-4">
      {reponse && (
        <div className="flex items-start gap-3 rounded-xl border border-bleu-hero bg-slate-50 px-3 py-2">
          {reponse.ficheProduit?.image && (
            <img
              src={reponse.ficheProduit.image}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500">
              Réponse à <strong className="text-slate-700">{reponse.nomAuteur}</strong>
            </p>
            {reponse.ficheProduit ? (
              <>
                <p className="truncate text-sm font-semibold text-slate-800">{reponse.ficheProduit.nom}</p>
                <p className="text-xs text-slate-500">{formaterMontant(reponse.ficheProduit.prix)}</p>
              </>
            ) : (
              <p className="truncate text-sm text-slate-700">{reponse.contenu}</p>
            )}
          </div>
          <button type="button" onClick={onAnnulerReponse} className="shrink-0 text-slate-400" aria-label="Annuler la réponse">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <ApercuPiecesJointes fichiers={fichiers} onRetirer={(id) => setFichiers((actuels) => actuels.filter((f) => f.id !== id))} />
      {erreur && <p className="text-xs text-rose-600">{erreur}</p>}
      <div className="flex min-w-0 items-center gap-2">
        <input
          ref={inputFichier}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          multiple
          className="hidden"
          onChange={(e) => void ajouterFichiers(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputFichier.current?.click()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-bleu-hero bg-white text-slate-600 sm:h-11 sm:w-11"
          aria-label="Joindre un fichier"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-full border border-bleu-hero px-3 py-2.5 text-sm outline-none sm:px-4"
        />
        <button
          type="submit"
          disabled={enCours}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1e3a8a] text-white disabled:opacity-60 sm:h-11 sm:w-11"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
