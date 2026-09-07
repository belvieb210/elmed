"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Pin } from "lucide-react";
import { CarteProduitMessage } from "@/composants/messagerie/CarteProduitMessage";
import { MenuActionsMessage } from "@/composants/messagerie/MenuActionsMessage";
import { PhotoProfil } from "@/composants/messagerie/PhotoProfil";
import { formaterHeure, formaterMontant, formaterTailleFichier } from "@/lib/formatage";
import { resumeMessage } from "@/lib/messagerie";
import type { MessageChat } from "@/types/modeles";

export function BulleMessage({
  message,
  lienProduit,
  onRepondre,
  onTransferer,
  onEpingler,
  onModifier,
  onSupprimer,
}: {
  message: MessageChat;
  lienProduit?: boolean;
  onRepondre: (message: MessageChat) => void;
  onTransferer: (message: MessageChat) => void;
  onEpingler: (message: MessageChat) => void;
  onModifier: (message: MessageChat) => void;
  onSupprimer: (message: MessageChat) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fermer(evenement: MouseEvent) {
      if (zone.current && !zone.current.contains(evenement.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  const menu = (
    <MenuMessage
      message={message}
      onRepondre={onRepondre}
      onTransferer={onTransferer}
      onEpingler={onEpingler}
      onModifier={onModifier}
      onSupprimer={onSupprimer}
      onFermer={() => setOuvert(false)}
    />
  );

  if (message.ficheProduit) {
    return (
      <div ref={zone} className={`w-fit max-w-[min(92%,20rem)] ${message.estMoi ? "ml-auto" : ""}`}>
        <CarteProduitMessage fiche={message.ficheProduit} message={message} lienProduit={lienProduit} />
        <div className="mt-1 flex items-center gap-2">
          <BoutonActions ouvert={ouvert} estMoi={false} onOuvrir={() => setOuvert((actuel) => !actuel)} />
        </div>
        {ouvert && <div className="mt-2">{menu}</div>}
      </div>
    );
  }

  if (message.supprime) {
    return (
      <div className={`flex ${message.estMoi ? "justify-end" : "justify-start"}`}>
        <p className="rounded-2xl bg-slate-100 px-4 py-2 text-xs italic text-slate-400">Message supprimé</p>
      </div>
    );
  }

  const image = message.typeMessage === "IMAGE" && message.fichierUrl;
  const fichier = message.fichierUrl && !image;

  return (
    <div className={`flex items-start gap-2 ${message.estMoi ? "justify-end" : "justify-start"}`}>
      {!message.estMoi && (
        <PhotoProfil
          src={message.photoProfilAuteur}
          alt={message.nomAuteur}
          initials={message.initialsAuteur || message.nomAuteur}
          className="mt-5 h-8 w-8"
        />
      )}
      <div ref={zone} className="min-w-0 max-w-[min(88%,28rem)]">
        <p className={`mb-1 truncate text-xs font-semibold text-slate-800 ${message.estMoi ? "text-right" : ""}`}>
          {message.nomAuteur}
          {message.roleAuteur ? (
            <span className="font-normal text-slate-400"> ({message.roleAuteur})</span>
          ) : null}
        </p>
        {message.reponseA && (
          <div className="mb-1 rounded-lg border-l-2 border-bleu-hero bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
            <span className="font-semibold">{message.reponseA.nomAuteur}</span>
            <span className="ml-1 line-clamp-1">{resumeMessage({ contenu: message.reponseA.contenu })}</span>
          </div>
        )}
        <div
          className={`rounded-2xl border px-3 py-2.5 text-sm ${
            message.estMoi
              ? "border-transparent bg-violet-marque text-white"
              : "border-bleu-hero bg-white text-slate-800"
          }`}
        >
          {message.epingle && <Pin className="float-right ml-2 mt-0.5 h-3 w-3 opacity-70" />}
          {image && (
            <img
              src={message.fichierUrl ?? ""}
              alt={message.fichierNom ?? "Image"}
              className="mb-2 max-h-56 w-full rounded-xl object-cover"
            />
          )}
          {fichier && (
            <a
              href={message.fichierUrl ?? "#"}
              download={message.fichierNom ?? undefined}
              className={`mb-2 flex items-center gap-2 rounded-xl px-2 py-2 ${
                message.estMoi ? "bg-white/15" : "bg-slate-50"
              }`}
            >
              <FileText className="h-5 w-5 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{message.fichierNom || "Fichier"}</span>
                <span className="text-[10px] opacity-70">
                  {message.fichierTaille ? formaterTailleFichier(message.fichierTaille) : "Document"}
                </span>
              </span>
            </a>
          )}
          {message.contenu && message.typeMessage === "TEXTE" && (
            <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <BoutonActions
              ouvert={ouvert}
              estMoi={message.estMoi}
              onOuvrir={() => setOuvert((actuel) => !actuel)}
            />
            <p className={`shrink-0 text-[10px] ${message.estMoi ? "text-white/70" : "text-slate-400"}`}>
              {formaterHeure(message.dateEnvoi)}
              {message.dateModification ? " · modifié" : ""}
            </p>
          </div>
          {ouvert && <div className="mt-2">{menu}</div>}
        </div>
      </div>
      {message.estMoi && (
        <PhotoProfil
          src={message.photoProfilAuteur}
          alt={message.nomAuteur}
          initials={message.initialsAuteur || message.nomAuteur}
          className="mt-5 h-8 w-8"
        />
      )}
    </div>
  );
}

function BoutonActions({
  ouvert,
  estMoi,
  onOuvrir,
}: {
  ouvert: boolean;
  estMoi: boolean;
  onOuvrir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOuvrir}
      className={`grid h-6 w-6 place-items-center rounded-md border ${
        estMoi ? "border-white/30 bg-white/15 text-white" : "border-slate-200 bg-white text-slate-600"
      }`}
      aria-label="Actions du message"
      aria-expanded={ouvert}
    >
      <ChevronDown className={`h-3.5 w-3.5 transition ${ouvert ? "rotate-180" : ""}`} />
    </button>
  );
}

function MenuMessage({
  message,
  onRepondre,
  onTransferer,
  onEpingler,
  onModifier,
  onSupprimer,
  onFermer,
}: {
  message: MessageChat;
  onRepondre: (message: MessageChat) => void;
  onTransferer: (message: MessageChat) => void;
  onEpingler: (message: MessageChat) => void;
  onModifier: (message: MessageChat) => void;
  onSupprimer: (message: MessageChat) => void;
  onFermer: () => void;
}) {
  return (
    <MenuActionsMessage
      peutModifier={Boolean(message.estMoi && message.typeMessage === "TEXTE" && !message.supprime)}
      epingle={message.epingle}
      onRepondre={() => {
        onRepondre(message);
        onFermer();
      }}
      onCopier={() => {
        const fiche = message.ficheProduit;
        void navigator.clipboard.writeText(
          fiche ? `${fiche.nom} — ${formaterMontant(fiche.prix)}` : resumeMessage(message),
        );
        onFermer();
      }}
      onTransferer={() => {
        onTransferer(message);
        onFermer();
      }}
      onEpingler={() => {
        onEpingler(message);
        onFermer();
      }}
      onModifier={() => {
        onModifier(message);
        onFermer();
      }}
      onSupprimer={() => {
        onSupprimer(message);
        onFermer();
      }}
    />
  );
}
