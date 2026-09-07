"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Pin } from "lucide-react";
import { CarteProduitMessage } from "@/composants/messagerie/CarteProduitMessage";
import { MenuActionsMessage } from "@/composants/messagerie/MenuActionsMessage";
import { formaterHeure, formaterTailleFichier } from "@/lib/formatage";
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

  if (message.ficheProduit) {
    return (
      <div ref={zone} className={`group relative ${message.estMoi ? "flex justify-end" : ""}`}>
        <CarteProduitMessage fiche={message.ficheProduit} message={message} lienProduit={lienProduit} />
        <BoutonMenu
          alignerDroite={message.estMoi}
          ouvert={ouvert}
          onOuvrir={() => setOuvert((actuel) => !actuel)}
          message={message}
          onRepondre={onRepondre}
          onTransferer={onTransferer}
          onEpingler={onEpingler}
          onModifier={onModifier}
          onSupprimer={onSupprimer}
          onFermer={() => setOuvert(false)}
        />
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
    <div ref={zone} className={`group relative flex ${message.estMoi ? "justify-end" : "justify-start"}`}>
      {!message.estMoi && (
        <span className="mr-2 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-marque text-[10px] font-semibold text-white">
          {message.initialsAuteur || message.nomAuteur.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className={`max-w-[88%] sm:max-w-[78%] ${message.estMoi ? "" : ""}`}>
        {!message.estMoi && (
          <p className="mb-1 text-xs font-semibold text-slate-800">
            {message.nomAuteur}
            {message.roleAuteur ? <span className="font-normal text-slate-400"> ({message.roleAuteur})</span> : null}
          </p>
        )}
        {message.reponseA && (
          <div className="mb-1 rounded-lg border-l-2 border-bleu-hero bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
            <span className="font-semibold">{message.reponseA.nomAuteur}</span>
            <span className="ml-1">{message.reponseA.contenu}</span>
          </div>
        )}
        <div
          className={`relative rounded-2xl border px-3 py-2.5 text-sm ${
            message.estMoi
              ? "border-transparent bg-violet-marque text-white"
              : "border-bleu-hero bg-white text-slate-800"
          }`}
        >
          {message.epingle && <Pin className="absolute right-2 top-2 h-3 w-3 opacity-70" />}
          {image && (
            <img src={message.fichierUrl ?? ""} alt={message.fichierNom ?? "Image"} className="mb-2 max-h-56 rounded-xl object-cover" />
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
          {message.contenu && message.typeMessage === "TEXTE" && <p className="whitespace-pre-wrap">{message.contenu}</p>}
          <p className={`mt-1 text-[10px] ${message.estMoi ? "text-right text-white/70" : "text-right text-slate-400"}`}>
            {formaterHeure(message.dateEnvoi)}
            {message.dateModification ? " · modifié" : ""}
          </p>
        </div>
      </div>
      <BoutonMenu
        alignerDroite={message.estMoi}
        ouvert={ouvert}
        onOuvrir={() => setOuvert((actuel) => !actuel)}
        message={message}
        onRepondre={onRepondre}
        onTransferer={onTransferer}
        onEpingler={onEpingler}
        onModifier={onModifier}
        onSupprimer={onSupprimer}
        onFermer={() => setOuvert(false)}
      />
    </div>
  );
}

function BoutonMenu({
  alignerDroite,
  ouvert,
  onOuvrir,
  message,
  onRepondre,
  onTransferer,
  onEpingler,
  onModifier,
  onSupprimer,
  onFermer,
}: {
  alignerDroite: boolean;
  ouvert: boolean;
  onOuvrir: () => void;
  message: MessageChat;
  onRepondre: (message: MessageChat) => void;
  onTransferer: (message: MessageChat) => void;
  onEpingler: (message: MessageChat) => void;
  onModifier: (message: MessageChat) => void;
  onSupprimer: (message: MessageChat) => void;
  onFermer: () => void;
}) {
  return (
    <div className={`absolute top-1 ${alignerDroite ? "left-1" : "right-1"}`}>
      <button
        type="button"
        onClick={onOuvrir}
        className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm opacity-0 transition group-hover:opacity-100 focus:opacity-100"
        aria-label="Actions du message"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {ouvert && (
        <div className={`${alignerDroite ? "left-0" : "right-0"} relative`}>
          <MenuActionsMessage
            peutModifier={Boolean(message.estMoi && message.typeMessage === "TEXTE" && !message.supprime)}
            epingle={message.epingle}
            onRepondre={() => {
              onRepondre(message);
              onFermer();
            }}
            onCopier={() => {
              void navigator.clipboard.writeText(message.contenu || message.fichierNom || "");
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
        </div>
      )}
    </div>
  );
}
