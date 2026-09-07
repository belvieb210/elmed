import type { Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { identifiantRoute } from "../utils/identifiant";
import { appliquerActionMessage, creerMessagesConversation, schemaEnvoi } from "../messages/actions";
import {
  extraireFichiersConversation,
  formaterMessageChat,
  libelleRolePersonnel,
  notifierConversation,
} from "../messages/formatage";

function nomClient(utilisateur: {
  prenom: string;
  nom: string;
  nomSociete: string | null;
  estInvite: boolean;
}) {
  if (utilisateur.estInvite) return "Client invité";
  return utilisateur.nomSociete || `${utilisateur.prenom} ${utilisateur.nom}`.trim();
}

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
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
          ? dernier.supprime
            ? "Message supprimé"
            : dernier.typeMessage === "PRODUIT"
              ? "Fiche produit"
              : dernier.fichierUrl
                ? dernier.fichierNom || "Fichier joint"
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
      messages: {
        orderBy: { dateEnvoi: "asc" },
        include: { auteur: true, reponseA: { include: { auteur: true } } },
      },
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

  const commandes = await baseDeDonnees.commande.findMany({
    where: { clientId: conversation.clientId, statut: { notIn: ["ANNULEE", "REFUSEE"] } },
    include: { lignes: { include: { produit: true } } },
    orderBy: { dateCommande: "desc" },
    take: 8,
  });

  reponse.json({
    succes: true,
    conversation: {
      id: conversation.id,
      clientId: conversation.clientId,
      nomClient: nomClient(conversation.client),
      photoProfil: conversation.client.estInvite ? null : conversation.client.photoProfil,
      client: {
        id: conversation.client.id,
        nomComplet: nomClient(conversation.client),
        prenom: conversation.client.prenom,
        nom: conversation.client.nom,
        email: conversation.client.email,
        telephone: conversation.client.telephone,
        ville: conversation.client.ville,
        nomSociete: conversation.client.nomSociete,
        photoProfil: conversation.client.estInvite ? null : conversation.client.photoProfil,
        initials: initials(conversation.client.prenom, conversation.client.nom),
        numeroClient: conversation.client.numeroClient,
        role: libelleRolePersonnel("CLIENT"),
      },
      messages: conversation.messages.map((message) =>
        formaterMessageChat(message, requete.utilisateurId!, { staffEstMoi: true }),
      ),
      fichiers: extraireFichiersConversation(conversation.messages),
      commandes: commandes.map((commande) => ({
        id: commande.id,
        numeroCommande: commande.numeroCommande,
        montantTotal: Number(commande.montantTotal),
        dateCommande: commande.dateCommande,
        statut: commande.statut,
        lignes: commande.lignes.slice(0, 3).map((ligne) => ({
          nom: ligne.produit.nom,
          image: ligne.produit.image,
          sku: ligne.produit.sku,
          prix: Number(ligne.prixUnitaire),
          quantite: ligne.quantite,
        })),
      })),
    },
  });
}

export async function repondreConversationAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaEnvoi.safeParse(requete.body);
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

  const crees = await creerMessagesConversation({
    conversationId: conversation.id,
    auteurId: requete.utilisateurId!,
    contenu: analyse.data.contenu,
    reponseAId: analyse.data.reponseAId,
    fichiers: analyse.data.fichiers,
  });
  await notifierConversation(conversation.id, conversation.clientId);
  reponse.status(201).json({
    succes: true,
    messages: crees.map((message) => formaterMessageChat(message, requete.utilisateurId!, { staffEstMoi: true })),
  });
}

export async function agirSurMessageAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  await appliquerActionMessage(requete, reponse, identifiantRoute(requete.params.messageId));
}
