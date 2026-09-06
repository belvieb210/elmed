import type { Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { emettreTempsReelPlusieurs } from "../temps-reel/diffuseur";
import { identifiantRoute } from "../utils/identifiant";

function nomClient(utilisateur: {
  prenom: string;
  nom: string;
  nomSociete: string | null;
  estInvite: boolean;
}) {
  if (utilisateur.estInvite) return "Client invité";
  return utilisateur.nomSociete || `${utilisateur.prenom} ${utilisateur.nom}`.trim();
}

export async function listerConversationsAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const conversations = await baseDeDonnees.conversation.findMany({
    include: {
      client: true,
      commande: true,
      messages: { orderBy: { dateEnvoi: "desc" }, take: 1 },
      _count: { select: { messages: { where: { lu: false, auteur: { role: "CLIENT" } } } } },
    },
    orderBy: { dateMaj: "desc" },
  });

  reponse.json({
    succes: true,
    conversations: conversations.map((conversation) => {
      const dernier = conversation.messages[0];
      return {
        id: conversation.id,
        clientId: conversation.clientId,
        nomClient: nomClient(conversation.client),
        photoProfil: conversation.client.estInvite ? null : conversation.client.photoProfil,
        numeroCommande: conversation.commande?.numeroCommande ?? null,
        extrait: dernier
          ? dernier.typeMessage === "PRODUIT"
            ? "Fiche produit"
            : dernier.contenu.slice(0, 90)
          : "Aucun message",
        date: dernier?.dateEnvoi ?? conversation.dateMaj,
        nonLus: conversation._count.messages,
      };
    }),
  });
}

export async function obtenirConversationAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const id = identifiantRoute(requete.params.id);
  const conversation = await baseDeDonnees.conversation.findUnique({
    where: { id },
    include: {
      client: true,
      messages: { orderBy: { dateEnvoi: "asc" }, include: { auteur: true } },
    },
  });

  if (!conversation) {
    reponse.status(404).json({ succes: false, message: "Conversation introuvable." });
    return;
  }

  await baseDeDonnees.message.updateMany({
    where: { conversationId: id, auteur: { role: "CLIENT" }, lu: false },
    data: { lu: true },
  });

  reponse.json({
    succes: true,
    conversation: {
      id: conversation.id,
      nomClient: nomClient(conversation.client),
      photoProfil: conversation.client.estInvite ? null : conversation.client.photoProfil,
      clientId: conversation.clientId,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        contenu: message.contenu,
        typeMessage: message.typeMessage,
        fichierUrl: message.fichierUrl,
        dateEnvoi: message.dateEnvoi,
        estMoi: message.auteur.role !== "CLIENT",
        nomAuteur: `${message.auteur.prenom} ${message.auteur.nom}`,
        ficheProduit:
          message.typeMessage === "PRODUIT"
            ? (() => {
                try {
                  return JSON.parse(message.contenu);
                } catch {
                  return undefined;
                }
              })()
            : undefined,
      })),
    },
  });
}

export async function repondreConversationAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = z.object({ contenu: z.string().trim().min(1) }).safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Message vide." });
    return;
  }

  const conversation = await baseDeDonnees.conversation.findUnique({
    where: { id: identifiantRoute(requete.params.id) },
  });
  if (!conversation) {
    reponse.status(404).json({ succes: false, message: "Conversation introuvable." });
    return;
  }

  const message = await baseDeDonnees.message.create({
    data: {
      conversationId: conversation.id,
      auteurId: requete.utilisateurId!,
      contenu: analyse.data.contenu,
    },
    include: { auteur: true },
  });

  await baseDeDonnees.conversation.update({
    where: { id: conversation.id },
    data: { dateMaj: new Date() },
  });

  const equipe = await baseDeDonnees.utilisateur.findMany({
    where: { role: { not: "CLIENT" } },
    select: { id: true },
  });
  emettreTempsReelPlusieurs(
    [conversation.clientId, ...equipe.map((membre) => membre.id)],
    "message",
    { conversationId: conversation.id },
  );

  reponse.status(201).json({
    succes: true,
    message: {
      id: message.id,
      contenu: message.contenu,
      typeMessage: message.typeMessage,
      dateEnvoi: message.dateEnvoi,
      estMoi: true,
      nomAuteur: `${message.auteur.prenom} ${message.auteur.nom}`,
    },
  });
}
