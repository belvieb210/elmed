import type { Response } from "express";
import { TypeMessage } from "@prisma/client";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { identifiantRoute } from "../utils/identifiant";
import { appliquerActionMessage, creerMessagesConversation, schemaEnvoi } from "../messages/actions";
import {
  extraireFicheProduit,
  extraireFichiersConversation,
  formaterMessageChat,
  notifierConversation,
} from "../messages/formatage";

async function ficheDepuisProduitId(produitId: string) {
  const produit = await baseDeDonnees.produit.findUnique({
    where: { id: produitId },
    include: { images: { orderBy: { ordre: "asc" } } },
  });
  if (!produit) return null;
  const image = produit.images.find((media) => media.typeMedia === "IMAGE")?.url ?? produit.image;
  return {
    produitId: produit.id,
    nom: produit.nom,
    prix: Number(produit.prix),
    image,
    sku: produit.sku,
  };
}

async function conversationClient(clientId: string) {
  let conversation = await baseDeDonnees.conversation.findFirst({
    where: { clientId, commandeId: null },
  });
  if (!conversation) {
    conversation = await baseDeDonnees.conversation.create({ data: { clientId } });
  }
  return conversation;
}

export async function obtenirConversation(requete: RequeteAuthentifiee, reponse: Response) {
  const clientId = requete.utilisateurId!;
  const conversation = await conversationClient(clientId);
  const complete = await baseDeDonnees.conversation.findUnique({
    where: { id: conversation.id },
    include: {
      messages: {
        orderBy: { dateEnvoi: "asc" },
        include: { auteur: true, reponseA: { include: { auteur: true } } },
      },
    },
  });

  await baseDeDonnees.message.updateMany({
    where: { conversationId: conversation.id, auteurId: { not: clientId }, lu: false },
    data: { lu: true },
  });

  reponse.json({
    succes: true,
    conversation: {
      id: conversation.id,
      messages: (complete?.messages ?? []).map((message) => formaterMessageChat(message, clientId)),
      fichiers: extraireFichiersConversation(complete?.messages ?? []),
    },
  });
}

export async function envoyerMessage(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaEnvoi.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Message vide." });
    return;
  }

  const clientId = requete.utilisateurId!;
  const conversation = await conversationClient(clientId);

  if (analyse.data.produitId) {
    const fiche = await ficheDepuisProduitId(analyse.data.produitId);
    if (!fiche) {
      reponse.status(404).json({ succes: false, message: "Produit introuvable." });
      return;
    }
    const dernier = await baseDeDonnees.message.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { dateEnvoi: "desc" },
      include: { auteur: true, reponseA: { include: { auteur: true } } },
    });
    const derniereFiche = dernier ? extraireFicheProduit(dernier.contenu, dernier.typeMessage) : undefined;
    if (dernier && derniereFiche?.produitId === fiche.produitId) {
      reponse.json({ succes: true, message: formaterMessageChat(dernier, clientId) });
      return;
    }
    const message = await baseDeDonnees.message.create({
      data: {
        conversationId: conversation.id,
        auteurId: clientId,
        contenu: JSON.stringify(fiche),
        typeMessage: TypeMessage.PRODUIT,
        fichierUrl: fiche.image,
      },
      include: { auteur: true, reponseA: { include: { auteur: true } } },
    });
    await baseDeDonnees.conversation.update({ where: { id: conversation.id }, data: { dateMaj: new Date() } });
    await notifierConversation(conversation.id, conversation.clientId);
    reponse.status(201).json({ succes: true, message: formaterMessageChat(message, clientId) });
    return;
  }

  const crees = await creerMessagesConversation({
    conversationId: conversation.id,
    auteurId: clientId,
    contenu: analyse.data.contenu,
    reponseAId: analyse.data.reponseAId,
    fichiers: analyse.data.fichiers,
  });
  await notifierConversation(conversation.id, conversation.clientId);
  reponse.status(201).json({
    succes: true,
    messages: crees.map((message) => formaterMessageChat(message, clientId)),
  });
}

export async function agirSurMessageClient(requete: RequeteAuthentifiee, reponse: Response) {
  await appliquerActionMessage(requete, reponse, identifiantRoute(requete.params.id));
}
