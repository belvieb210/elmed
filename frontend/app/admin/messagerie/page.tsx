"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { appelerApi } from "@/lib/api";
import { formaterHeure, formaterMontant, formaterRelatif } from "@/lib/formatage";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import type { ConversationAdmin, FicheProduitMessage, MessageChat } from "@/types/modeles";

function MessagerieAdmin() {
  const params = useSearchParams();
  const [conversations, setConversations] = useState<ConversationAdmin[]>([]);
  const [active, setActive] = useState<string | null>(params.get("conversation"));
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [nomClient, setNomClient] = useState("Conversation");
  const [contenu, setContenu] = useState("");
  const listeRef = useRef<HTMLDivElement>(null);

  const chargerListe = useCallback(async () => {
    const donnees = await appelerApi<{ conversations: ConversationAdmin[] }>("/admin/conversations");
    setConversations(donnees.conversations);
    setActive((actuel) => actuel ?? donnees.conversations[0]?.id ?? null);
  }, []);

  const chargerFil = useCallback(async (id: string) => {
    const donnees = await appelerApi<{
      conversation: { nomClient: string; messages: MessageChat[] };
    }>(`/admin/conversations/${id}`);
    setNomClient(donnees.conversation.nomClient);
    setMessages(donnees.conversation.messages);
  }, []);

  useEffect(() => {
    void chargerListe();
  }, [chargerListe]);

  useEffect(() => {
    if (!active) return;
    void chargerFil(active);
  }, [active, chargerFil]);

  useEvenementTempsReel("message", () => {
    void chargerListe();
    if (active) void chargerFil(active);
  });

  useEffect(() => {
    listeRef.current?.scrollTo({ top: listeRef.current.scrollHeight });
  }, [messages.length]);

  async function envoyer(evenement: FormEvent) {
    evenement.preventDefault();
    if (!active || !contenu.trim()) return;
    await appelerApi(`/admin/conversations/${active}`, {
      method: "POST",
      body: JSON.stringify({ contenu }),
    });
    setContenu("");
    await chargerFil(active);
    await chargerListe();
  }

  return (
    <MiseEnPageAdmin titre="Messagerie" sousTitre="Toutes les conversations clients">
      <div className="grid h-[calc(100dvh-10rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-100 lg:border-b-0 lg:border-r">
          <div className="max-h-48 overflow-y-auto lg:max-h-none lg:h-full">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActive(conversation.id)}
                className={`flex w-full items-start gap-3 px-3 py-3 text-left ${
                  active === conversation.id ? "bg-violet-clair" : "hover:bg-slate-50"
                }`}
              >
                <img
                  src={conversation.photoProfil ?? "https://i.pravatar.cc/80?img=15"}
                  alt={conversation.nomClient}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-800">{conversation.nomClient}</span>
                    <span className="text-[10px] text-slate-400">{formaterRelatif(conversation.date)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{conversation.extrait}</span>
                </span>
                {conversation.nonLus > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                    {conversation.nonLus}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">{nomClient}</p>
          </div>
          <div ref={listeRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => {
              const fiche = message.ficheProduit as FicheProduitMessage | undefined;
              return (
                <div key={message.id} className={`flex ${message.estMoi ? "justify-end" : "justify-start"}`}>
                  {fiche ? (
                    <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                      <p className="font-semibold">{fiche.nom}</p>
                      <p className="text-slate-500">{formaterMontant(fiche.prix)}</p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
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
              placeholder="Répondre au client..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <button type="submit" className="grid h-11 w-11 place-items-center rounded-xl bg-violet-marque text-white">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </MiseEnPageAdmin>
  );
}

export default function PageMessagerieAdmin() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Chargement...</p>}>
      <MessagerieAdmin />
    </Suspense>
  );
}
