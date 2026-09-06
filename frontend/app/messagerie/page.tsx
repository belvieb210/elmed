"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { BarriereCompte } from "@/composants/auth/BarriereCompte";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { appelerApi } from "@/lib/api";
import { lienInscription } from "@/lib/compte";
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

function FilDiscussion() {
  const params = useSearchParams();
  const produitId = params.get("produit");
  const { chargerTableauDeBord, compteReel } = useClient();
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [contenu, setContenu] = useState("");
  const [pret, setPret] = useState(false);
  const listeRef = useRef<HTMLDivElement>(null);
  const discussionInvite = Boolean(produitId);
  const peutDiscuter = compteReel || discussionInvite;

  const charger = useCallback(async () => {
    const donnees = await appelerApi<{ conversation: { messages: MessageChat[] } }>("/messagerie");
    setMessages(donnees.conversation.messages);
    if (compteReel) await chargerTableauDeBord();
  }, [chargerTableauDeBord, compteReel]);

  useEffect(() => {
    if (!peutDiscuter) return;
    let ignore = false;

    async function ouvrir() {
      try {
        if (produitId) {
          await appelerApi("/messagerie", {
            method: "POST",
            body: JSON.stringify({ produitId }),
          });
        }
        if (!ignore) await charger();
      } finally {
        if (!ignore) setPret(true);
      }
    }

    void ouvrir();
    return () => {
      ignore = true;
    };
  }, [peutDiscuter, produitId, charger]);

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

  if (!peutDiscuter) {
    return (
      <BarriereCompte
        titre="Messagerie client"
        description="Pour retrouver toutes vos conversations, connectez-vous ou créez un compte. Vous pouvez déjà discuter d’un produit depuis sa fiche, sans inscription."
      />
    );
  }

  return (
    <>
      <EnTetePage
        titre={compteReel ? "Messagerie" : "Discussion produit"}
        description={
          compteReel
            ? "Échanges directs avec l'équipe MateMedical."
            : "Posez vos questions sur ce produit. Créez un compte pour conserver tout l’historique."
        }
      />

      {!compteReel && (
        <div className="mb-4 rounded-2xl border border-violet-100 bg-violet-clair px-4 py-3 text-sm leading-6 text-slate-700">
          Vous discutez sans compte. Pour revoir tous les messages plus tard,{" "}
          <Link href={lienInscription("/messagerie")} className="font-semibold text-violet-marque hover:underline">
            créez un compte
          </Link>{" "}
          ou{" "}
          <Link href="/connexion?suivant=%2Fmessagerie" className="font-semibold text-violet-marque hover:underline">
            connectez-vous
          </Link>
          . L’échange en cours sera rattaché à votre compte.
        </div>
      )}

      <div className="flex h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white sm:h-[68vh]">
        <div ref={listeRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {!pret && <p className="text-sm text-slate-400">Ouverture de la discussion...</p>}
          {pret &&
            messages.map((message) => {
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
                        {message.estMoi ? "Vous" : message.nomAuteur} · {formaterHeure(message.dateEnvoi)}
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
    </>
  );
}

export default function PageMessagerie() {
  return (
    <MiseEnPageClient>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement...</p>}>
        <FilDiscussion />
      </Suspense>
    </MiseEnPageClient>
  );
}
