"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { appelerApi } from "@/lib/api";
import { formaterHeure, formaterMontant } from "@/lib/formatage";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import { useClient } from "@/store/contexteClient";
import type { FicheProduitMessage, MessageChat } from "@/types/modeles";

function ficheDuMessage(message: MessageChat): FicheProduitMessage | null {
  if (message.ficheProduit) return message.ficheProduit;
  if (message.typeMessage !== "PRODUIT") return null;
  try {
    return JSON.parse(message.contenu) as FicheProduitMessage;
  } catch {
    return null;
  }
}

export default function PageMessagerie() {
  const { chargerTableauDeBord } = useClient();
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [contenu, setContenu] = useState("");
  const listeRef = useRef<HTMLDivElement>(null);

  const charger = useCallback(async () => {
    const donnees = await appelerApi<{ conversation: { messages: MessageChat[] } }>("/messagerie");
    setMessages(donnees.conversation.messages);
    await chargerTableauDeBord();
  }, [chargerTableauDeBord]);

  useEffect(() => {
    void charger();
  }, [charger]);

  useEvenementTempsReel("message", charger);

  useEffect(() => {
    listeRef.current?.scrollTo({ top: listeRef.current.scrollHeight });
  }, [messages.length]);

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    if (!contenu.trim()) return;
    await appelerApi("/messagerie", {
      method: "POST",
      body: JSON.stringify({ contenu }),
    });
    setContenu("");
    await charger();
  }

  return (
    <MiseEnPageClient>
      <EnTetePage titre="Messagerie" description="Échanges directs avec l'équipe MateMedical." />
      <div className="flex h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white sm:h-[68vh]">
        <div ref={listeRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => {
            const fiche = ficheDuMessage(message);
            return (
              <div key={message.id} className={`flex ${message.estMoi ? "justify-end" : "justify-start"}`}>
                {fiche ? (
                  <div className="max-w-[92%] sm:max-w-[80%]">
                    <Link
                      href={`/produits/${fiche.produitId}`}
                      className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      {fiche.image && (
                        <img src={fiche.image} alt={fiche.nom} className="h-36 w-full object-cover" />
                      )}
                      <div className="p-3">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{fiche.nom}</p>
                        <p className="mt-1 text-base font-bold text-slate-900">{formaterMontant(fiche.prix)}</p>
                        <p className="mt-1 text-xs text-slate-500">SKU : {fiche.sku}</p>
                      </div>
                    </Link>
                    <p className={`mt-1 text-[10px] ${message.estMoi ? "text-right text-slate-400" : "text-slate-400"}`}>
                      {message.estMoi ? "Lu" : message.nomAuteur} · {formaterHeure(message.dateEnvoi)}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[80%] ${
                      message.estMoi ? "bg-violet-marque text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p>{message.contenu}</p>
                    <p className={`mt-1 text-[10px] ${message.estMoi ? "text-white/70" : "text-slate-400"}`}>
                      {formaterHeure(message.dateEnvoi)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <form onSubmit={envoyer} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Écrire un message sur ce produit..."
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
          />
          <button
            type="submit"
            className="grid h-11 w-11 place-items-center rounded-xl bg-violet-marque text-white"
            aria-label="Envoyer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </MiseEnPageClient>
  );
}
