"use client";

import { FormEvent, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { ApercuPiecesJointes } from "@/composants/messagerie/ApercuPiecesJointes";
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
    <form onSubmit={(e) => void envoyer(e)} className="space-y-2 border-t border-bleu-hero p-3">
      {reponse && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>
            Réponse à <strong>{reponse.nomAuteur}</strong> — {reponse.contenu}
          </span>
          <button type="button" onClick={onAnnulerReponse} aria-label="Annuler la réponse">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <ApercuPiecesJointes fichiers={fichiers} onRetirer={(id) => setFichiers((actuels) => actuels.filter((f) => f.id !== id))} />
      {erreur && <p className="text-xs text-rose-600">{erreur}</p>}
      <div className="flex items-center gap-2">
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
          className="grid h-11 w-11 place-items-center rounded-xl border border-bleu-hero bg-white text-slate-600"
          aria-label="Joindre un fichier"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-bleu-hero px-4 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={enCours}
          className="grid h-11 w-11 place-items-center rounded-xl bg-[#1e3a8a] text-white disabled:opacity-60"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
