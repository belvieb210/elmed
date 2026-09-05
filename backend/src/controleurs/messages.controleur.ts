import type { Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

export async function obtenirConversation(requete: RequeteAuthentifiee, reponse: Response) {
  const clientId = requete.utilisateurId!;

  let conversation = await baseDeDonnees.conversation.findFirst({
    where: { clientId, commandeId: null },
    include: {
      messages: {
        orderBy: { dateEnvoi: "asc" },
        include: { auteur: true },
      },
    },
  });

  if (!conversation) {
    conversation = await baseDeDonnees.conversation.create({
      data: { clientId },
      include: {
        messages: {
          orderBy: { dateEnvoi: "asc" },
          include: { auteur: true },
        },
      },
    });
  }

  await baseDeDonnees.message.updateMany({
    where: {
      conversationId: conversation.id,
      auteurId: { not: clientId },
      lu: false,
    },
    data: { lu: true },
  });

  reponse.json({
    succes: true,
    conversation: {
      id: conversation.id,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        contenu: message.contenu,
        typeMessage: message.typeMessage,
        fichierUrl: message.fichierUrl,
        lu: message.lu,
        dateEnvoi: message.dateEnvoi,
        estMoi: message.auteurId === clientId,
        nomAuteur: `${message.auteur.prenom} ${message.auteur.nom}`,
      })),
    },
  });
}

export async function envoyerMessage(requete: RequeteAuthentifiee, reponse: Response) {
  const schema = z.object({
    contenu: z.string().min(1),
    typeMessage: z.enum(["TEXTE", "IMAGE", "PDF", "AUDIO", "VIDEO", "DOCUMENT"]).optional(),
  });

  const analyse = schema.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Message vide." });
    return;
  }

  const clientId = requete.utilisateurId!;
  let conversation = await baseDeDonnees.conversation.findFirst({
    where: { clientId, commandeId: null },
  });

  if (!conversation) {
    conversation = await baseDeDonnees.conversation.create({ data: { clientId } });
  }

  const message = await baseDeDonnees.message.create({
    data: {
      conversationId: conversation.id,
      auteurId: clientId,
      contenu: analyse.data.contenu,
      typeMessage: analyse.data.typeMessage ?? "TEXTE",
    },
    include: { auteur: true },
  });

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
