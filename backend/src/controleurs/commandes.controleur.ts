import type { Response } from "express";
import { ModePaiement } from "@prisma/client";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { genererProformaPdf } from "../documents/generer-proforma";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { identifiantRoute } from "../utils/identifiant";

function libelleModePaiement(mode: string) {
  if (mode.startsWith("MOBILE_MONEY")) return "Mobile Money";
  const libelles: Record<string, string> = {
    CARTE_BANCAIRE: "Carte bancaire",
    VIREMENT: "Virement",
    PAIEMENT_RETRAIT: "Paiement au retrait",
    PAIEMENT_LIVRAISON: "Paiement à la livraison",
  };
  return libelles[mode] ?? "Paiement";
}

function libelleStatutPaiement(statut: string) {
  const libelles: Record<string, string> = {
    EN_ATTENTE: "En attente",
    PARTIEL: "Partiel",
    PAYE: "Payé",
    ECHEC: "Échec",
    REMBOURSE: "Remboursé",
  };
  return libelles[statut] ?? statut;
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

async function genererNumeroCommande() {
  const annee = new Date().getFullYear();
  const total = await baseDeDonnees.commande.count();
  return `CMD-${annee}-${String(total + 1).padStart(5, "0")}`;
}

export async function listerCommandes(requete: RequeteAuthentifiee, reponse: Response) {
  const commandes = await baseDeDonnees.commande.findMany({
    where: { clientId: requete.utilisateurId },
    include: {
      lignes: { include: { produit: true }, orderBy: { id: "asc" } },
      paiements: { orderBy: { datePaiement: "desc" } },
    },
    orderBy: { dateCommande: "desc" },
  });

  reponse.json({
    succes: true,
    commandes: commandes.map((commande) => {
      const paiement = commande.paiements[0];
      return {
        id: commande.id,
        numeroCommande: commande.numeroCommande,
        montantTotal: Number(commande.montantTotal),
        statut: commande.statut,
        libelleStatut: libelleStatut(commande.statut),
        dateCommande: commande.dateCommande,
        nombreProduits: commande.lignes.length,
        nombreArticles: commande.lignes.reduce((somme, ligne) => somme + ligne.quantite, 0),
        image: commande.lignes[0]?.produit.image ?? null,
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
  });
}

export async function obtenirCommande(requete: RequeteAuthentifiee, reponse: Response) {
  const commande = await baseDeDonnees.commande.findFirst({
    where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
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
  const modesValides = new Set<string>(Object.values(ModePaiement));
  const modeDemande = typeof requete.body?.modePaiement === "string" ? requete.body.modePaiement : "";
  const modePaiement = modesValides.has(modeDemande) ? (modeDemande as ModePaiement) : ModePaiement.PAIEMENT_LIVRAISON;

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

    await transaction.paiement.create({
      data: {
        commandeId: creee.id,
        montant: montantTotal,
        modePaiement,
        statut: "EN_ATTENTE",
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

export async function telechargerFactureCommande(requete: RequeteAuthentifiee, reponse: Response) {
  const commande = await baseDeDonnees.commande.findFirst({
    where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
    include: { lignes: { include: { produit: true } }, client: true },
  });

  if (!commande) {
    reponse.status(404).json({ succes: false, message: "Commande introuvable." });
    return;
  }

  const dateTexte = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(commande.dateCommande)
    .replace(/^(\d+\s)([a-z])/, (_tout, prefixe: string, lettre: string) => `${prefixe}${lettre.toUpperCase()}`);

  const nomClient = [commande.client.nomSociete, `${commande.client.prenom} ${commande.client.nom}`.trim()]
    .filter(Boolean)
    .join(" — ");

  const pdf = await genererProformaPdf({
    numero: commande.numeroCommande,
    dateTexte,
    nomClient: nomClient || "Client",
    titreDocument: "FACTURE",
    lignes: commande.lignes.map((ligne) => ({
      quantite: ligne.quantite,
      designation: ligne.produit.nom,
      prixUnitaire: Number(ligne.prixUnitaire),
      prixTotal: Number(ligne.prixUnitaire) * ligne.quantite,
    })),
    montantTotal: Number(commande.montantTotal),
  });

  reponse.setHeader("Content-Type", "application/pdf");
  reponse.setHeader("Content-Disposition", `inline; filename="facture-ELMED-${commande.numeroCommande}.pdf"`);
  reponse.send(pdf);
}
