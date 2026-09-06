import type { Response } from "express";
import { TypeMessage } from "@prisma/client";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

type FicheProduitMessage = {
  produitId: string;
  nom: string;
  prix: number;
  image: string | null;
  sku: string;
};

function extraireFicheProduit(contenu: string, typeMessage: TypeMessage): FicheProduitMessage | undefined {
  if (typeMessage !== TypeMessage.PRODUIT) return undefined;
  try {
    const fiche = JSON.parse(contenu) as FicheProduitMessage;
    if (!fiche?.produitId || !fiche.nom) return undefined;
    return fiche;
  } catch {
    return undefined;
  }
}

function formaterMessage(message: {
  id: string;
  contenu: string;
  typeMessage: TypeMessage;
  fichierUrl: string | null;
  lu: boolean;
  dateEnvoi: Date;
  auteurId: string;
  auteur: { prenom: string; nom: string };
}, clientId: string) {
  return {
    id: message.id,
    contenu: message.contenu,
    typeMessage: message.typeMessage,
    fichierUrl: message.fichierUrl,
    lu: message.lu,
    dateEnvoi: message.dateEnvoi,
    estMoi: message.auteurId === clientId,
    nomAuteur: `${message.auteur.prenom} ${message.auteur.nom}`,
    ficheProduit: extraireFicheProduit(message.contenu, message.typeMessage),
  };
}

async function ficheDepuisProduitId(produitId: string): Promise<FicheProduitMessage | null> {
  const produit = await baseDeDonnees.produit.findUnique({
    where: { id: produitId },
    include: { images: { orderBy: { ordre: "asc" } } },
  });
  if (!produit) return null;

  const image =
    produit.images.find((media) => media.typeMedia === "IMAGE")?.url ?? produit.image;

  return {
    produitId: produit.id,
    nom: produit.nom,
    prix: Number(produit.prix),
    image,
    sku: produit.sku,
  };
}

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
      messages: conversation.messages.map((message) => formaterMessage(message, clientId)),
    },
  });
}

export async function envoyerMessage(requete: RequeteAuthentifiee, reponse: Response) {
  const schema = z
    .object({
      contenu: z.string().min(1).optional(),
      typeMessage: z.enum(["TEXTE", "IMAGE", "PDF", "AUDIO", "VIDEO", "DOCUMENT", "PRODUIT"]).optional(),
      produitId: z.string().min(1).optional(),
    })
    .refine((data) => Boolean(data.produitId || data.contenu?.trim()));

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

  let contenu = analyse.data.contenu?.trim() ?? "";
  let typeMessage: TypeMessage = (analyse.data.typeMessage as TypeMessage | undefined) ?? TypeMessage.TEXTE;
  let fichierUrl: string | null = null;

  if (analyse.data.produitId) {
    const fiche = await ficheDepuisProduitId(analyse.data.produitId);
    if (!fiche) {
      reponse.status(404).json({ succes: false, message: "Produit introuvable." });
      return;
    }

    const dernier = await baseDeDonnees.message.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { dateEnvoi: "desc" },
      include: { auteur: true },
    });
    const derniereFiche = dernier ? extraireFicheProduit(dernier.contenu, dernier.typeMessage) : undefined;
    if (dernier && derniereFiche?.produitId === fiche.produitId) {
      reponse.json({
        succes: true,
        message: formaterMessage(dernier, clientId),
      });
      return;
    }

    contenu = JSON.stringify(fiche);
    typeMessage = TypeMessage.PRODUIT;
    fichierUrl = fiche.image;
  }

  const message = await baseDeDonnees.message.create({
    data: {
      conversationId: conversation.id,
      auteurId: clientId,
      contenu,
      typeMessage,
      fichierUrl,
    },
    include: { auteur: true },
  });

  reponse.status(201).json({
    succes: true,
    message: formaterMessage(message, clientId),
  });
}
