import type { Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

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

async function genererNumeroCommande() {
  const annee = new Date().getFullYear();
  const total = await baseDeDonnees.commande.count();
  return `CMD-${annee}-${String(total + 1).padStart(5, "0")}`;
}

export async function listerCommandes(requete: RequeteAuthentifiee, reponse: Response) {
  const commandes = await baseDeDonnees.commande.findMany({
    where: { clientId: requete.utilisateurId },
    include: { lignes: { include: { produit: true } } },
    orderBy: { dateCommande: "desc" },
  });

  reponse.json({
    succes: true,
    commandes: commandes.map((commande) => ({
      id: commande.id,
      numeroCommande: commande.numeroCommande,
      montantTotal: Number(commande.montantTotal),
      statut: commande.statut,
      libelleStatut: libelleStatut(commande.statut),
      dateCommande: commande.dateCommande,
      nombreArticles: commande.lignes.reduce((somme, ligne) => somme + ligne.quantite, 0),
    })),
  });
}

export async function obtenirCommande(requete: RequeteAuthentifiee, reponse: Response) {
  const commande = await baseDeDonnees.commande.findFirst({
    where: { id: requete.params.id, clientId: requete.utilisateurId },
    include: { lignes: { include: { produit: true } }, documents: true, paiements: true },
  });

  if (!commande) {
    reponse.status(404).json({ succes: false, message: "Commande introuvable." });
    return;
  }

  reponse.json({
    succes: true,
    commande: {
      ...commande,
      montantTotal: Number(commande.montantTotal),
      libelleStatut: libelleStatut(commande.statut),
      lignes: commande.lignes.map((ligne) => ({
        id: ligne.id,
        nomProduit: ligne.produit.nom,
        image: ligne.produit.image,
        quantite: ligne.quantite,
        prixUnitaire: Number(ligne.prixUnitaire),
        sousTotal: Number(ligne.prixUnitaire) * ligne.quantite,
      })),
    },
  });
}

export async function creerCommandeDepuisPanier(requete: RequeteAuthentifiee, reponse: Response) {
  const clientId = requete.utilisateurId!;
  const lignesPanier = await baseDeDonnees.lignePanier.findMany({
    where: { clientId },
    include: { produit: true },
  });

  if (lignesPanier.length === 0) {
    reponse.status(400).json({ succes: false, message: "Votre panier est vide." });
    return;
  }

  const montantTotal = lignesPanier.reduce(
    (somme, ligne) => somme + Number(ligne.produit.prix) * ligne.quantite,
    0,
  );

  const commande = await baseDeDonnees.$transaction(async (transaction) => {
    const creee = await transaction.commande.create({
      data: {
        numeroCommande: await genererNumeroCommande(),
        clientId,
        statut: "EN_ATTENTE",
        montantTotal,
        notes: typeof requete.body?.notes === "string" ? requete.body.notes : null,
        lignes: {
          create: lignesPanier.map((ligne) => ({
            produitId: ligne.produitId,
            quantite: ligne.quantite,
            prixUnitaire: ligne.produit.prix,
          })),
        },
      },
    });

    await transaction.lignePanier.deleteMany({ where: { clientId } });

    await transaction.notification.create({
      data: {
        utilisateurId: clientId,
        titre: "Commande envoyée",
        contenu: `Votre commande ${creee.numeroCommande} a été transmise à MateMedical.`,
        typeNotif: "COMMANDE",
        lien: `/commandes/${creee.id}`,
      },
    });

    return creee;
  });

  reponse.status(201).json({
    succes: true,
    message: "Commande envoyée. Notre équipe va la traiter.",
    commande: {
      id: commande.id,
      numeroCommande: commande.numeroCommande,
      montantTotal: Number(commande.montantTotal),
      statut: commande.statut,
    },
  });
}
