"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BulleMessage } from "@/composants/messagerie/BulleMessage";
import { ComposerMessage } from "@/composants/messagerie/ComposerMessage";
import { PanneauFicheClient } from "@/composants/messagerie/PanneauFicheClient";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { appelerApi } from "@/lib/api";
import { formaterMontant, formaterRelatif } from "@/lib/formatage";
import { apercuReponse, resumeMessage, type PieceJointeBrouillon } from "@/lib/messagerie";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import type {
  ClientDiscussion,
  CommandeDiscussion,
  ConversationAdmin,
  FichierConversation,
  MessageChat,
  ReponseMessage,
} from "@/types/modeles";

function MessagerieAdmin() {
  const params = useSearchParams();
  const [conversations, setConversations] = useState<ConversationAdmin[]>([]);
  const [active, setActive] = useState<string | null>(params.get("conversation"));
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [nomClient, setNomClient] = useState("Conversation");
  const [client, setClient] = useState<ClientDiscussion | null>(null);
  const [fichiers, setFichiers] = useState<FichierConversation[]>([]);
  const [commandes, setCommandes] = useState<CommandeDiscussion[]>([]);
  const [reponse, setReponse] = useState<ReponseMessage | null>(null);
  const [edition, setEdition] = useState<MessageChat | null>(null);
  const [vueMobile, setVueMobile] = useState<"liste" | "fil" | "fiche">("liste");
  const listeRef = useRef<HTMLDivElement>(null);

  const chargerListe = useCallback(async () => {
    const donnees = await appelerApi<{ conversations: ConversationAdmin[] }>("/admin/conversations");
    setConversations(donnees.conversations);
    setActive((actuel) => actuel ?? donnees.conversations[0]?.id ?? null);
  }, []);

  const chargerFil = useCallback(async (id: string) => {
    const donnees = await appelerApi<{
      conversation: {
        nomClient: string;
        messages: MessageChat[];
        client: ClientDiscussion;
        fichiers: FichierConversation[];
        commandes: CommandeDiscussion[];
      };
    }>(`/admin/conversations/${id}`);
    setNomClient(donnees.conversation.nomClient);
    setMessages(donnees.conversation.messages);
    setClient(donnees.conversation.client);
    setFichiers(donnees.conversation.fichiers);
    setCommandes(donnees.conversation.commandes);
  }, []);

  useEffect(() => {
    void chargerListe();
    if (params.get("conversation")) setVueMobile("fil");
  }, [chargerListe, params]);

  useEffect(() => {
    if (!active) return;
    void chargerFil(active);
  }, [active, chargerFil]);

  useEvenementTempsReel("message", (detail) => {
    void chargerListe();
    if (!active) return;
    if (detail?.conversationId && detail.conversationId !== active) return;
    void chargerFil(active);
  });

  useEffect(() => {
    listeRef.current?.scrollTo({ top: listeRef.current.scrollHeight });
  }, [messages.length]);

  async function agir(message: MessageChat, corps: Record<string, unknown>) {
    if (!active) return;
    await appelerApi(`/admin/conversations/${active}/messages/${message.id}`, {
      method: "PATCH",
      body: JSON.stringify(corps),
    });
    await chargerFil(active);
    await chargerListe();
  }

  async function envoyer(donnees: { contenu: string; fichiers: PieceJointeBrouillon[]; reponseAId?: string }) {
    if (!active) return;
    if (edition) {
      await agir(edition, { contenu: donnees.contenu });
      setEdition(null);
      return;
    }
    await appelerApi(`/admin/conversations/${active}`, {
      method: "POST",
      body: JSON.stringify({
        contenu: donnees.contenu || undefined,
        reponseAId: donnees.reponseAId,
        fichiers: donnees.fichiers.map((fichier) => ({
          dataUrl: fichier.dataUrl,
          nom: fichier.nom,
          taille: fichier.taille,
          typeMime: fichier.typeMime,
        })),
      }),
    });
    await chargerFil(active);
    await chargerListe();
  }

  return (
    <MiseEnPageAdmin titre="Messagerie" sousTitre="Échanges avec les clients — sans groupes">
      <div className="grid h-[calc(100dvh-var(--hauteur-en-tete)-2rem)] min-h-0 overflow-hidden rounded-2xl border border-bleu-hero bg-white lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className={`min-h-0 overflow-hidden border-bleu-hero lg:block lg:border-b-0 lg:border-r ${vueMobile === "liste" ? "block" : "hidden"}`}>
          <div className="h-full max-h-[36vh] overflow-y-auto lg:max-h-none">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setActive(conversation.id);
                  setVueMobile("fil");
                }}
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

        <section className={`h-full min-h-0 flex-col overflow-hidden ${vueMobile === "fil" ? "flex" : "hidden"} lg:flex`}>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-bleu-hero px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setVueMobile("liste")}
                className="mb-1 text-xs font-medium text-violet-marque lg:hidden"
              >
                ← Conversations
              </button>
              <p className="truncate text-sm font-semibold text-slate-800">{nomClient}</p>
              <p className="text-xs text-slate-400">Discussion client</p>
            </div>
            {client && (
              <button
                type="button"
                onClick={() => setVueMobile("fiche")}
                className="shrink-0 rounded-lg border border-bleu-hero px-2 py-1 text-xs font-medium text-slate-600 xl:hidden"
              >
                Fiche
              </button>
            )}
          </div>
          <div ref={listeRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
            {messages.map((message) => (
              <BulleMessage
                key={message.id}
                message={message}
                lienProduit
                onRepondre={(cible) => {
                  setEdition(null);
                  setReponse(apercuReponse(cible));
                }}
                onTransferer={(cible) => {
                  setEdition(null);
                  setReponse(null);
                  const fiche = cible.ficheProduit;
                  void envoyer({
                    contenu: fiche
                      ? `Transféré : ${fiche.nom} — ${formaterMontant(fiche.prix)}`
                      : `Transféré : ${resumeMessage(cible)}`,
                    fichiers: [],
                  });
                }}
                onEpingler={(cible) => void agir(cible, { epingle: !cible.epingle })}
                onModifier={(cible) => {
                  setReponse(null);
                  setEdition(cible);
                }}
                onSupprimer={(cible) => void agir(cible, { supprime: true })}
              />
            ))}
          </div>
          <div className="shrink-0 bg-white">
            <ComposerMessage
              key={`${edition?.id ?? "nouveau"}-${reponse?.id ?? ""}`}
              placeholder="Écrire un message..."
              reponse={reponse}
              texteInitial={edition?.contenu ?? ""}
              onAnnulerReponse={() => {
                setReponse(null);
                setEdition(null);
              }}
              onEnvoyer={envoyer}
            />
          </div>
        </section>

        {client ? (
          <div className={`min-h-0 overflow-hidden ${vueMobile === "fiche" ? "flex flex-col" : "hidden"} xl:flex`}>
            <button
              type="button"
              onClick={() => setVueMobile("fil")}
              className="border-b border-bleu-hero px-4 py-2 text-left text-xs font-medium text-violet-marque xl:hidden"
            >
              ← Retour au fil
            </button>
            <PanneauFicheClient client={client} fichiers={fichiers} commandes={commandes} />
          </div>
        ) : (
          <aside className="hidden place-items-center border-l border-bleu-hero text-sm text-slate-400 xl:grid">
            Sélectionnez une conversation
          </aside>
        )}
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
