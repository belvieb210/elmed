"use client";

import { FormEvent, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { appelerApi } from "@/lib/api";
import { formaterHeure } from "@/lib/formatage";
import { useClient } from "@/store/contexteClient";
import type { MessageChat } from "@/types/modeles";

export default function PageMessagerie() {
  const { chargerTableauDeBord } = useClient();
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [contenu, setContenu] = useState("");

  async function charger() {
    const donnees = await appelerApi<{ conversation: { messages: MessageChat[] } }>("/messagerie");
    setMessages(donnees.conversation.messages);
    await chargerTableauDeBord();
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="flex h-[68vh] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.estMoi ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.estMoi ? "bg-violet-marque text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                <p>{message.contenu}</p>
                <p className={`mt-1 text-[10px] ${message.estMoi ? "text-white/70" : "text-slate-400"}`}>
                  {formaterHeure(message.dateEnvoi)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={envoyer} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Écrire un message..."
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
