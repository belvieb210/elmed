import type { Response } from "express";
import { libelleModePaiement, libelleStatutPaiement } from "./commandes.controleur";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

export async function obtenirTableauDeBord(requete: RequeteAuthentifiee, reponse: Response) {
  const clientId = requete.utilisateurId!;

  const [
    utilisateur,
    nombreCommandes,
    nombreEnAttente,
    nombreValidees,
    nombrePayees,
    categories,
    produitsPopulaires,
    dernieresCommandes,
    nombreArticlesPanier,
    messagesNonLus,
    notificationsNonLues,
  ] = await Promise.all([
    baseDeDonnees.utilisateur.findUnique({ where: { id: clientId } }),
    baseDeDonnees.commande.count({ where: { clientId } }),
    baseDeDonnees.commande.count({ where: { clientId, statut: "EN_ATTENTE" } }),
    baseDeDonnees.commande.count({
      where: { clientId, statut: { in: ["VALIDEE", "EN_PREPARATION", "PRET_RETRAIT", "LIVREE", "CLOTUREE"] } },
    }),
    baseDeDonnees.paiement.count({
      where: { commande: { clientId }, statut: "PAYE" },
    }),
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
    baseDeDonnees.commande.findMany({
      where: { clientId },
      orderBy: { dateCommande: "desc" },
      take: 5,
      include: { paiements: { orderBy: { datePaiement: "desc" }, take: 1 } },
    }),
    baseDeDonnees.lignePanier.aggregate({
      where: { clientId },
      _sum: { quantite: true },
    }),
    baseDeDonnees.message.count({
      where: {
        lu: false,
        conversation: { clientId },
        auteurId: { not: clientId },
      },
    }),
    baseDeDonnees.notification.count({
      where: { utilisateurId: clientId, lue: false },
    }),
  ]);

  reponse.json({
    succes: true,
    tableauDeBord: {
      utilisateur: utilisateur
        ? {
            id: utilisateur.id,
            prenom: utilisateur.prenom,
            nom: utilisateur.nom,
            nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
            role: utilisateur.role,
            photoProfil: utilisateur.photoProfil,
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
