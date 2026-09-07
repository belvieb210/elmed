"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarriereCompte } from "@/composants/auth/BarriereCompte";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { BulleMessage } from "@/composants/messagerie/BulleMessage";
import { ComposerMessage } from "@/composants/messagerie/ComposerMessage";
import { appelerApi } from "@/lib/api";
import { lienInscription } from "@/lib/compte";
import { apercuReponse, resumeMessage, type PieceJointeBrouillon } from "@/lib/messagerie";
import { formaterMontant } from "@/lib/formatage";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import { useClient } from "@/store/contexteClient";
import type { FichierConversation, MessageChat, ReponseMessage } from "@/types/modeles";

function FilDiscussion() {
  const params = useSearchParams();
  const produitId = params.get("produit");
  const { chargerTableauDeBord, compteReel } = useClient();
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [fichiers, setFichiers] = useState<FichierConversation[]>([]);
  const [reponse, setReponse] = useState<ReponseMessage | null>(null);
  const [edition, setEdition] = useState<MessageChat | null>(null);
  const [pret, setPret] = useState(false);
  const listeRef = useRef<HTMLDivElement>(null);
  const discussionInvite = Boolean(produitId);
  const peutDiscuter = compteReel || discussionInvite;

  const charger = useCallback(async () => {
    const donnees = await appelerApi<{
      conversation: { messages: MessageChat[]; fichiers?: FichierConversation[] };
    }>("/messagerie");
    setMessages(donnees.conversation.messages);
    setFichiers(donnees.conversation.fichiers ?? []);
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

  async function agir(message: MessageChat, corps: Record<string, unknown>) {
    await appelerApi(`/messagerie/messages/${message.id}`, {
      method: "PATCH",
      body: JSON.stringify(corps),
    });
    await charger();
  }

  async function envoyer(donnees: { contenu: string; fichiers: PieceJointeBrouillon[]; reponseAId?: string }) {
    if (edition) {
      await agir(edition, { contenu: donnees.contenu });
      setEdition(null);
      return;
    }
    await appelerApi("/messagerie", {
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
            ? "Échanges directs avec l'équipe ELMED."
            : "Posez vos questions sur ce produit. Créez un compte pour conserver tout l’historique."
        }
      />

      {!compteReel && (
        <div className="mb-4 rounded-2xl border border-bleu-hero bg-violet-clair px-4 py-3 text-sm leading-6 text-slate-700">
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

      <div className="flex h-[calc(100dvh-11rem)] min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-bleu-hero bg-white sm:h-[68vh]">
        {fichiers.length > 0 && (
          <div className="border-b border-bleu-hero px-4 py-2 text-xs text-slate-500">
            {fichiers.length} fichier{fichiers.length > 1 ? "s" : ""} joint{fichiers.length > 1 ? "s" : ""} dans cette
            discussion
          </div>
        )}
        <div ref={listeRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {!pret && <p className="text-sm text-slate-400">Ouverture de la discussion...</p>}
          {pret &&
            messages.map((message) => (
              <BulleMessage
                key={message.id}
                message={message}
                onRepondre={(cible) => {
                  setEdition(null);
                  setReponse(apercuReponse(cible));
                }}
                onTransferer={(cible) => {
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
