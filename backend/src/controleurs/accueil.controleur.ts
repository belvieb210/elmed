import type { Response } from "express";
import { libelleModePaiement, libelleStatutPaiement } from "./commandes.controleur";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

export async function obtenirTableauDeBord(requete: RequeteAuthentifiee, reponse: Response) {
  const clientId = requete.utilisateurId;
  const compteReel = Boolean(clientId && !requete.estInvite);

  const [utilisateur, categories, produitsPopulaires] = await Promise.all([
    clientId ? baseDeDonnees.utilisateur.findUnique({ where: { id: clientId } }) : Promise.resolve(null),
    baseDeDonnees.categorie.findMany({
      orderBy: { ordre: "asc" },
      include: { _count: { select: { produits: true } } },
    }),
    baseDeDonnees.produit.findMany({
      where: { populaire: true, disponible: true },
      orderBy: { nom: "asc" },
      take: 8,
      include: { categorie: true },
    }),
  ]);

  const [
    nombreCommandes,
    nombreEnAttente,
    nombreValidees,
    nombrePayees,
    dernieresCommandes,
    nombreArticlesPanier,
    messagesNonLus,
    notificationsNonLues,
  ] = await Promise.all([
    compteReel ? baseDeDonnees.commande.count({ where: { clientId } }) : Promise.resolve(0),
    compteReel ? baseDeDonnees.commande.count({ where: { clientId, statut: "EN_ATTENTE" } }) : Promise.resolve(0),
    compteReel
      ? baseDeDonnees.commande.count({
          where: {
            clientId,
            statut: { in: ["VALIDEE", "EN_PREPARATION", "PRET_RETRAIT", "LIVREE", "CLOTUREE"] },
          },
        })
      : Promise.resolve(0),
    compteReel
      ? baseDeDonnees.paiement.count({
          where: { commande: { clientId }, statut: "PAYE" },
        })
      : Promise.resolve(0),
    compteReel
      ? baseDeDonnees.commande.findMany({
          where: { clientId },
          orderBy: { dateCommande: "desc" },
          take: 5,
          include: { paiements: { orderBy: { datePaiement: "desc" }, take: 1 } },
        })
      : Promise.resolve([]),
    clientId
      ? baseDeDonnees.lignePanier.aggregate({
          where: { clientId },
          _sum: { quantite: true },
        })
      : Promise.resolve({ _sum: { quantite: 0 } }),
    compteReel
      ? baseDeDonnees.message.count({
          where: {
            lu: false,
            conversation: { clientId },
            auteurId: { not: clientId },
          },
        })
      : Promise.resolve(0),
    compteReel
      ? baseDeDonnees.notification.count({
          where: { utilisateurId: clientId, lue: false },
        })
      : Promise.resolve(0),
  ]);

  reponse.json({
    succes: true,
    tableauDeBord: {
      utilisateur:
        utilisateur && !utilisateur.estInvite
          ? {
              id: utilisateur.id,
              prenom: utilisateur.prenom,
              nom: utilisateur.nom,
              nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
              email: utilisateur.email,
              role: utilisateur.role,
              photoProfil: utilisateur.photoProfil,
              estInvite: false,
            }
          : null,
      statistiques: {
        nombreCommandes,
        nombreEnAttente,
        nombreValidees,
        nombrePayees,
      },
      categories: categories.map((categorie) => ({
        id: categorie.id,
        nom: categorie.nom,
        slug: categorie.slug,
        icone: categorie.icone,
        nombreProduits: categorie._count.produits,
      })),
      produitsPopulaires: produitsPopulaires.map((produit) => ({
        id: produit.id,
        nom: produit.nom,
        prix: Number(produit.prix),
        image: produit.image,
        sku: produit.sku,
        nomCategorie: produit.categorie.nom,
      })),
      dernieresCommandes: dernieresCommandes.map((commande) => {
        const paiement = commande.paiements[0];
        return {
          id: commande.id,
          numeroCommande: commande.numeroCommande,
          montantTotal: Number(commande.montantTotal),
          statut: commande.statut,
          dateCommande: commande.dateCommande,
          paiement: paiement
            ? {
                mode: paiement.modePaiement,
                libelleMode: libelleModePaiement(paiement.modePaiement),
                statut: paiement.statut,
                libelleStatut: libelleStatutPaiement(paiement.statut),
              }
            : {
                mode: "PAIEMENT_LIVRAISON",
                libelleMode: "Paiement à la commande",
                statut: "EN_ATTENTE",
                libelleStatut: "En attente",
              },
        };
      }),
      badges: {
        nombreArticlesPanier: nombreArticlesPanier._sum.quantite ?? 0,
        messagesNonLus,
        notificationsNonLues,
      },
    },
  });
}
