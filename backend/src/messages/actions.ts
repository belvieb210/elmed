import { TypeMessage } from "@prisma/client";
import type { Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { formaterMessageChat, notifierConversation, typeDepuisMime } from "./formatage";

export const schemaFichier = z.object({
  dataUrl: z.string().startsWith("data:").max(14_000_000),
  nom: z.string().trim().min(1).max(180),
  taille: z.number().int().positive().max(10 * 1024 * 1024),
  typeMime: z.string().trim().min(1).max(80),
});

export const schemaEnvoi = z
  .object({
    contenu: z.string().optional(),
    reponseAId: z.string().uuid().optional(),
    fichiers: z.array(schemaFichier).max(10).optional(),
    produitId: z.string().min(1).optional(),
    typeMessage: z.enum(["TEXTE", "IMAGE", "PDF", "AUDIO", "VIDEO", "DOCUMENT", "PRODUIT"]).optional(),
  })
  .refine((data) => Boolean(data.produitId || data.contenu?.trim() || (data.fichiers && data.fichiers.length > 0)));

export const schemaActionMessage = z
  .object({
    contenu: z.string().trim().min(1).max(4000).optional(),
    epingle: z.boolean().optional(),
    supprime: z.literal(true).optional(),
  })
  .refine((data) => data.contenu !== undefined || data.epingle !== undefined || data.supprime === true);

const includeMessage = {
  auteur: true,
  reponseA: { include: { auteur: true } },
} as const;

export async function creerMessagesConversation(params: {
  conversationId: string;
  auteurId: string;
  contenu?: string;
  reponseAId?: string;
  fichiers?: z.infer<typeof schemaFichier>[];
}) {
  const crees = [];
  if (params.contenu?.trim()) {
    crees.push(
      await baseDeDonnees.message.create({
        data: {
          conversationId: params.conversationId,
          auteurId: params.auteurId,
          contenu: params.contenu.trim(),
          typeMessage: TypeMessage.TEXTE,
          reponseAId: params.reponseAId,
        },
        include: includeMessage,
      }),
    );
  }
  for (const fichier of params.fichiers ?? []) {
    crees.push(
      await baseDeDonnees.message.create({
        data: {
          conversationId: params.conversationId,
          auteurId: params.auteurId,
          contenu: fichier.nom,
          typeMessage: typeDepuisMime(fichier.typeMime),
          fichierUrl: fichier.dataUrl,
          fichierNom: fichier.nom,
          fichierTaille: fichier.taille,
          reponseAId: params.contenu?.trim() ? undefined : params.reponseAId,
        },
        include: includeMessage,
      }),
    );
  }
  await baseDeDonnees.conversation.update({
    where: { id: params.conversationId },
    data: { dateMaj: new Date() },
  });
  return crees;
}

export async function appliquerActionMessage(requete: RequeteAuthentifiee, reponse: Response, messageId: string) {
  const analyse = schemaActionMessage.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Action invalide." });
    return;
  }

  const message = await baseDeDonnees.message.findUnique({
    where: { id: messageId },
    include: { conversation: true, auteur: true },
  });
  if (!message) {
    reponse.status(404).json({ succes: false, message: "Message introuvable." });
    return;
  }

  const personnel = requete.roleUtilisateur !== "CLIENT";
  const auteur = message.auteurId === requete.utilisateurId;
  if (analyse.data.supprime && !auteur && !personnel) {
    reponse.status(403).json({ succes: false, message: "Suppression non autorisée." });
    return;
  }
  if (analyse.data.contenu && !auteur) {
    reponse.status(403).json({ succes: false, message: "Modification non autorisée." });
    return;
  }

  const misAJour = await baseDeDonnees.message.update({
    where: { id: message.id },
    data: {
      ...(analyse.data.supprime
        ? { supprime: true, contenu: "", fichierUrl: null, fichierNom: null, fichierTaille: null, epingle: false }
        : {}),
      ...(analyse.data.contenu && !message.supprime && message.typeMessage === "TEXTE"
        ? { contenu: analyse.data.contenu, dateModification: new Date() }
        : {}),
      ...(analyse.data.epingle !== undefined && !message.supprime ? { epingle: analyse.data.epingle } : {}),
    },
    include: includeMessage,
  });

  await notifierConversation(message.conversationId, message.conversation.clientId);
  reponse.json({
    succes: true,
    message: formaterMessageChat(misAJour, requete.utilisateurId!, { staffEstMoi: personnel }),
  });
}
