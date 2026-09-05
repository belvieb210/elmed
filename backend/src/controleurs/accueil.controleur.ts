import type { Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

export async function obtenirTableauDeBord(requete: RequeteAuthentifiee, reponse: Response) {
  const clientId = requete.utilisateurId!;

  const [
    utilisateur,
    nombreCommandes,
    nombreEnAttente,
    nombreValidees,
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
      dernieresCommandes: dernieresCommandes.map((commande) => ({
        id: commande.id,
        numeroCommande: commande.numeroCommande,
        montantTotal: Number(commande.montantTotal),
        statut: commande.statut,
        dateCommande: commande.dateCommande,
      })),
      badges: {
        nombreArticlesPanier: nombreArticlesPanier._sum.quantite ?? 0,
        messagesNonLus,
        notificationsNonLues,
      },
    },
  });
}
