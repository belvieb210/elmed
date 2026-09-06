import type { Response } from "express";
import { StatutCommande } from "@prisma/client";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { libelleModePaiement, libelleStatutPaiement } from "./commandes.controleur";
import { identifiantRoute } from "../utils/identifiant";

function debutJour(date = new Date()) {
  const copie = new Date(date);
  copie.setHours(0, 0, 0, 0);
  return copie;
}

function libelleStatut(statut: string) {
  const libelles: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    EN_ATTENTE: "En attente",
    VALIDEE: "Validée",
    REFUSEE: "Refusée",
    ANNULEE: "Annulée",
    EN_PREPARATION: "En préparation",
    PRET_RETRAIT: "Prête au retrait",
    EXPEDIEE: "Expédiée",
    EN_ROUTE: "En route",
    LIVREE: "Livrée",
    CLOTUREE: "Clôturée",
  };
  return libelles[statut] ?? statut;
}

function nomClient(utilisateur: {
  prenom: string;
  nom: string;
  nomSociete: string | null;
  estInvite?: boolean;
}) {
  if (utilisateur.estInvite) return "Client invité";
  return utilisateur.nomSociete || `${utilisateur.prenom} ${utilisateur.nom}`.trim();
}

function formaterCommandeResume(commande: {
  id: string;
  numeroCommande: string;
  montantTotal: { toString(): string };
  statut: string;
  dateCommande: Date;
  client: { prenom: string; nom: string; nomSociete: string | null; estInvite: boolean };
  paiements: Array<{ modePaiement: string; statut: string }>;
}) {
  const paiement = commande.paiements[0];
  return {
    id: commande.id,
    numeroCommande: commande.numeroCommande,
    montantTotal: Number(commande.montantTotal),
    statut: commande.statut,
    libelleStatut: libelleStatut(commande.statut),
    dateCommande: commande.dateCommande,
    nomClient: nomClient(commande.client),
    paiement: paiement
      ? {
          mode: paiement.modePaiement,
          libelleMode: libelleModePaiement(paiement.modePaiement),
          statut: paiement.statut,
          libelleStatut: libelleStatutPaiement(paiement.statut),
        }
      : null,
  };
}

export async function obtenirBadgesAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const aujourdHui = debutJour();
  const [commandesAujourdhui, messagesNonLus] = await Promise.all([
    baseDeDonnees.commande.count({ where: { dateCommande: { gte: aujourdHui } } }),
    baseDeDonnees.message.count({
      where: { lu: false, auteur: { role: "CLIENT" } },
    }),
  ]);

  reponse.json({
    succes: true,
    badges: { commandesAujourdhui, messagesNonLus },
  });
}

export async function obtenirTableauAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const aujourdHui = debutJour();
  const debutMois = new Date(aujourdHui.getFullYear(), aujourdHui.getMonth(), 1);
  const ilYa7Jours = debutJour(new Date(aujourdHui.getTime() - 6 * 24 * 60 * 60 * 1000));

  const includeCommande = {
    client: true,
    paiements: { orderBy: { datePaiement: "desc" as const }, take: 1 },
  };

  const [
    commandesAujourdhui,
    clientsTotal,
    messagesNonLus,
    chiffreAffaires,
    commandesRecentes,
    conversations,
    commandesMois,
    paiementsSemaine,
    commandesRecentActivite,
    messagesRecents,
  ] = await Promise.all([
    baseDeDonnees.commande.count({ where: { dateCommande: { gte: aujourdHui } } }),
    baseDeDonnees.utilisateur.count({ where: { role: "CLIENT", estInvite: false } }),
    baseDeDonnees.message.count({ where: { lu: false, auteur: { role: "CLIENT" } } }),
    baseDeDonnees.paiement.aggregate({
      where: { statut: "PAYE", datePaiement: { gte: debutMois } },
      _sum: { montant: true },
    }),
    baseDeDonnees.commande.findMany({
      include: includeCommande,
      orderBy: { dateCommande: "desc" },
      take: 6,
    }),
    baseDeDonnees.conversation.findMany({
      include: {
        client: true,
        messages: { orderBy: { dateEnvoi: "desc" }, take: 1, include: { auteur: true } },
        _count: { select: { messages: { where: { lu: false, auteur: { role: "CLIENT" } } } } },
      },
      orderBy: { dateMaj: "desc" },
      take: 8,
    }),
    baseDeDonnees.commande.groupBy({
      by: ["statut"],
      _count: { statut: true },
    }),
    baseDeDonnees.paiement.findMany({
      where: { statut: "PAYE", datePaiement: { gte: ilYa7Jours } },
      select: { montant: true, datePaiement: true },
    }),
    baseDeDonnees.commande.findMany({
      include: { client: true },
      orderBy: { dateMaj: "desc" },
      take: 5,
    }),
    baseDeDonnees.message.findMany({
      include: { auteur: true, conversation: { include: { client: true } } },
      orderBy: { dateEnvoi: "desc" },
      take: 5,
    }),
  ]);

  const ventesParJour = Array.from({ length: 7 }, (_item, index) => {
    const jour = debutJour(new Date(ilYa7Jours.getTime() + index * 24 * 60 * 60 * 1000));
    const lendemain = new Date(jour.getTime() + 24 * 60 * 60 * 1000);
    const total = paiementsSemaine
      .filter((paiement) => paiement.datePaiement >= jour && paiement.datePaiement < lendemain)
      .reduce((somme, paiement) => somme + Number(paiement.montant), 0);
    return {
      date: jour.toISOString(),
      libelle: jour.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      montant: total,
    };
  });

  let enAttente = 0;
  let validees = 0;
  let annulees = 0;
  for (const groupe of commandesMois) {
    if (groupe.statut === "ANNULEE" || groupe.statut === "REFUSEE") annulees += groupe._count.statut;
    else if (groupe.statut === "EN_ATTENTE" || groupe.statut === "ENVOYEE" || groupe.statut === "BROUILLON") {
      enAttente += groupe._count.statut;
    } else validees += groupe._count.statut;
  }

  const activites = [
    ...commandesRecentActivite.map((commande) => ({
      id: `cmd-${commande.id}`,
      type: "COMMANDE",
      titre: `Commande ${commande.numeroCommande}`,
      detail: nomClient(commande.client),
      date: commande.dateMaj,
    })),
    ...messagesRecents.map((message) => ({
      id: `msg-${message.id}`,
      type: "MESSAGE",
      titre: message.auteur.role === "CLIENT" ? "Nouveau message client" : "Réponse de l'équipe",
      detail: nomClient(message.conversation.client),
      date: message.dateEnvoi,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  reponse.json({
    succes: true,
    tableau: {
      statistiques: {
        commandesAujourdhui,
        clientsTotal,
        messagesNonLus,
        chiffreAffaires: Number(chiffreAffaires._sum.montant ?? 0),
      },
      commandesRecentes: commandesRecentes.map(formaterCommandeResume),
      messages: conversations
        .filter((conversation) => conversation.messages[0])
        .map((conversation) => {
          const dernier = conversation.messages[0];
          return {
            conversationId: conversation.id,
            nomClient: nomClient(conversation.client),
            photoProfil: conversation.client.estInvite ? null : conversation.client.photoProfil,
            extrait:
              dernier.typeMessage === "PRODUIT" ? "Fiche produit" : dernier.contenu.slice(0, 80),
            date: dernier.dateEnvoi,
            nonLus: conversation._count.messages,
          };
        }),
      ventes: ventesParJour,
      activites,
      repartition: {
        total: enAttente + validees + annulees,
        enAttente,
        validees,
        annulees,
      },
      badges: { commandesAujourdhui, messagesNonLus },
    },
  });
}

export async function listerCommandesAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const commandes = await baseDeDonnees.commande.findMany({
    include: {
      client: true,
      lignes: { include: { produit: true }, orderBy: { id: "asc" } },
      paiements: { orderBy: { datePaiement: "desc" } },
    },
    orderBy: { dateCommande: "desc" },
  });

  reponse.json({
    succes: true,
    commandes: commandes.map((commande) => ({
      ...formaterCommandeResume(commande),
      nombreArticles: commande.lignes.reduce((somme, ligne) => somme + ligne.quantite, 0),
      image: commande.lignes[0]?.produit.image ?? null,
    })),
  });
}

export async function obtenirCommandeAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const commande = await baseDeDonnees.commande.findUnique({
    where: { id: identifiantRoute(requete.params.id) },
    include: {
      client: true,
      lignes: { include: { produit: true }, orderBy: { id: "asc" } },
      paiements: { orderBy: { datePaiement: "desc" } },
    },
  });

  if (!commande) {
    reponse.status(404).json({ succes: false, message: "Commande introuvable." });
    return;
  }

  reponse.json({
    succes: true,
    commande: {
      ...formaterCommandeResume(commande),
      notes: commande.notes,
      client: {
        id: commande.client.id,
        nomComplet: `${commande.client.prenom} ${commande.client.nom}`.trim(),
        email: commande.client.estInvite ? null : commande.client.email,
        telephone: commande.client.telephone,
        nomSociete: commande.client.nomSociete,
        ville: commande.client.ville,
      },
      lignes: commande.lignes.map((ligne) => ({
        id: ligne.id,
        nomProduit: ligne.produit.nom,
        image: ligne.produit.image,
        sku: ligne.produit.sku,
        quantite: ligne.quantite,
        prixUnitaire: Number(ligne.prixUnitaire),
        sousTotal: Number(ligne.prixUnitaire) * ligne.quantite,
      })),
    },
  });
}

export async function mettreAJourStatutCommande(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = z.object({ statut: z.nativeEnum(StatutCommande) }).safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Statut invalide." });
    return;
  }

  const commande = await baseDeDonnees.commande.update({
    where: { id: identifiantRoute(requete.params.id) },
    data: { statut: analyse.data.statut },
    include: { client: true, paiements: { orderBy: { datePaiement: "desc" }, take: 1 } },
  });

  reponse.json({ succes: true, commande: formaterCommandeResume(commande) });
}

function montantPayeCommandes(
  paiements: Array<{ montant: { toString(): string }; statut: string }>,
) {
  return paiements
    .filter((paiement) => paiement.statut === "PAYE" || paiement.statut === "PARTIEL")
    .reduce((somme, paiement) => somme + Number(paiement.montant), 0);
}

function statutFactureClient(
  commandes: Array<{
    montantTotal: { toString(): string };
    modeFacture: string;
    paiements: Array<{ montant: { toString(): string }; statut: string }>;
  }>,
) {
  if (commandes.length === 0) {
    return { statutFacture: "A_FACTURER" as const, montantPaye: 0, resteAPayer: 0 };
  }

  let montantPaye = 0;
  let resteAPayer = 0;
  let aUneAvance = false;

  for (const commande of commandes) {
    const paye = Math.round(montantPayeCommandes(commande.paiements) * 100) / 100;
    const reste = Math.round(Math.max(0, Number(commande.montantTotal) - paye) * 100) / 100;
    montantPaye += paye;
    resteAPayer += reste;
    if (reste > 0 && (commande.modeFacture === "AVANCE" || commande.paiements.some((paiement) => paiement.statut === "PARTIEL"))) {
      aUneAvance = true;
    }
  }

  if (aUneAvance) {
    return { statutFacture: "AVANCE" as const, montantPaye, resteAPayer };
  }

  return { statutFacture: "SOLDEE" as const, montantPaye, resteAPayer: 0 };
}

export async function listerClientsAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const clients = await baseDeDonnees.utilisateur.findMany({
    where: { role: "CLIENT", estInvite: false },
    include: {
      commandes: {
        where: { statut: { notIn: ["ANNULEE", "REFUSEE"] } },
        include: { paiements: true },
      },
      _count: { select: { conversations: true } },
    },
    orderBy: { dateCreation: "desc" },
  });

  reponse.json({
    succes: true,
    clients: clients.map((client) => {
      const facture = statutFactureClient(client.commandes);
      return {
        id: client.id,
        prenom: client.prenom,
        nom: client.nom,
        nomComplet: `${client.prenom} ${client.nom}`,
        email: client.email,
        telephone: client.telephone,
        nomSociete: client.nomSociete,
        ville: client.ville,
        photoProfil: client.photoProfil,
        dateCreation: client.dateCreation,
        numeroClient: client.numeroClient,
        adresse: client.adresse,
        fiche: client.ficheClient,
        nombreCommandes: client.commandes.length,
        nombreConversations: client._count.conversations,
        statutFacture: facture.statutFacture,
        montantPaye: facture.montantPaye,
        resteAPayer: facture.resteAPayer,
      };
    }),
  });
}

export async function listerDocumentsAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const documents = await baseDeDonnees.document.findMany({
    include: { commande: { include: { client: true } } },
    orderBy: { dateCreation: "desc" },
    take: 80,
  });

  reponse.json({
    succes: true,
    documents: documents.map((document) => ({
      id: document.id,
      typeDocument: document.typeDocument,
      numeroDocument: document.numeroDocument,
      dateCreation: document.dateCreation,
      commandeId: document.commandeId,
      numeroCommande: document.commande?.numeroCommande ?? null,
      nomClient: document.commande ? nomClient(document.commande.client) : "—",
    })),
  });
}

export async function listerUtilisateursAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const utilisateurs = await baseDeDonnees.utilisateur.findMany({
    where: { estInvite: false },
    orderBy: [{ role: "asc" }, { nom: "asc" }],
  });

  reponse.json({
    succes: true,
    utilisateurs: utilisateurs.map((utilisateur) => ({
      id: utilisateur.id,
      nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      role: utilisateur.role,
      photoProfil: utilisateur.photoProfil,
      actif: utilisateur.actif,
    })),
  });
}

export async function listerProduitsAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const produits = await baseDeDonnees.produit.findMany({
    include: { categorie: true },
    orderBy: { nom: "asc" },
  });

  reponse.json({
    succes: true,
    produits: produits.map((produit) => ({
      id: produit.id,
      nom: produit.nom,
      sku: produit.sku,
      prix: Number(produit.prix),
      image: produit.image,
      quantiteStock: produit.quantiteStock,
      disponible: produit.disponible,
      nomCategorie: produit.categorie.nom,
    })),
  });
}
