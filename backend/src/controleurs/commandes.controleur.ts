import type { Response } from "express";
import { ModePaiement } from "@prisma/client";
import { enregistrerCommandeDepuisPanier } from "../commandes/enregistrer-depuis-panier";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { genererProformaPdf } from "../documents/generer-proforma";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { identifiantRoute } from "../utils/identifiant";

export function libelleModePaiement(mode: string) {
  const libelles: Record<string, string> = {
    MOBILE_MONEY_MPESA: "Mobile Money - M-Pesa",
    MOBILE_MONEY_AIRTEL: "Mobile Money - Airtel Money",
    MOBILE_MONEY_ORANGE: "Mobile Money - Orange Money",
    MOBILE_MONEY_AFRIMONEY: "Mobile Money - AfriMoney",
    CARTE_BANCAIRE: "Paiement en ligne",
    VIREMENT: "Virement",
    PAIEMENT_RETRAIT: "Paiement au retrait",
    PAIEMENT_LIVRAISON: "Paiement à la livraison",
    ESPECES: "Espèces",
    ASSURANCE: "Assurance",
  };
  return libelles[mode] ?? "Paiement";
}

function libelleLivraison(mode?: string) {
  if (mode === "PAIEMENT_LIVRAISON") return "Livraison à domicile";
  return "Retrait en entrepôt";
}

export function libelleStatutPaiement(statut: string) {
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
  const [commande, entrepot] = await Promise.all([
    baseDeDonnees.commande.findFirst({
      where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
      include: {
        client: true,
        lignes: {
          include: {
            produit: {
              include: { lots: { orderBy: { dateExpiration: "asc" }, take: 1 } },
            },
          },
          orderBy: { id: "asc" },
        },
        paiements: { orderBy: { datePaiement: "desc" } },
      },
    }),
    baseDeDonnees.entrepot.findFirst({ orderBy: { nom: "asc" } }),
  ]);

  if (!commande) {
    reponse.status(404).json({ succes: false, message: "Commande introuvable." });
    return;
  }

  const paiement = commande.paiements[0];
  const nombreArticles = commande.lignes.reduce((somme, ligne) => somme + ligne.quantite, 0);

  reponse.json({
    succes: true,
    commande: {
      id: commande.id,
      numeroCommande: commande.numeroCommande,
      montantTotal: Number(commande.montantTotal),
      statut: commande.statut,
      libelleStatut: libelleStatut(commande.statut),
      dateCommande: commande.dateCommande,
      dateMaj: commande.dateMaj,
      notes: commande.notes,
      nombreProduits: commande.lignes.length,
      nombreArticles,
      client: {
        nomComplet: commande.client.estInvite
          ? "Client"
          : `${commande.client.prenom} ${commande.client.nom}`.trim(),
        prenom: commande.client.estInvite ? "Client" : commande.client.prenom,
        nom: commande.client.estInvite ? "" : commande.client.nom,
        email: commande.client.estInvite ? undefined : commande.client.email,
        telephone: commande.client.telephone,
        photoProfil: commande.client.estInvite ? null : commande.client.photoProfil,
        nomSociete: commande.client.nomSociete,
      },
      paiement: paiement
        ? {
            mode: paiement.modePaiement,
            libelleMode: libelleModePaiement(paiement.modePaiement),
            statut: paiement.statut,
            libelleStatut: libelleStatutPaiement(paiement.statut),
            montant: Number(paiement.montant),
            datePaiement: paiement.datePaiement,
            reference: paiement.reference,
            libelleLivraison: libelleLivraison(paiement.modePaiement),
          }
        : {
            mode: "PAIEMENT_RETRAIT",
            libelleMode: "Paiement à la commande",
            statut: "EN_ATTENTE",
            libelleStatut: "En attente",
            montant: Number(commande.montantTotal),
            datePaiement: null,
            libelleLivraison: "Retrait en entrepôt",
          },
      entrepot: entrepot
        ? {
            nom: entrepot.nom,
            adresse: entrepot.adresse,
            ville: entrepot.ville,
            telephone: entrepot.telephone,
            latitude: entrepot.latitude,
            longitude: entrepot.longitude,
            heures: entrepot.heures,
          }
        : null,
      lignes: commande.lignes.map((ligne) => ({
        id: ligne.id,
        nomProduit: ligne.produit.nom,
        image: ligne.produit.image,
        sku: ligne.produit.sku,
        numeroLot: ligne.produit.lots[0]?.numeroLot ?? null,
        quantite: ligne.quantite,
        prixUnitaire: Number(ligne.prixUnitaire),
        sousTotal: Number(ligne.prixUnitaire) * ligne.quantite,
      })),
    },
  });
}

export async function creerCommandeDepuisPanier(requete: RequeteAuthentifiee, reponse: Response) {
  const modesValides = new Set<string>(Object.values(ModePaiement));
  const modeDemande = typeof requete.body?.modePaiement === "string" ? requete.body.modePaiement : "";
  const modePaiement = modesValides.has(modeDemande) ? (modeDemande as ModePaiement) : ModePaiement.PAIEMENT_LIVRAISON;

  try {
    const commande = await enregistrerCommandeDepuisPanier({
      clientId: requete.utilisateurId!,
      modePaiement,
      notes: typeof requete.body?.notes === "string" ? requete.body.notes : null,
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
  } catch (erreur) {
    reponse.status(400).json({
      succes: false,
      message: erreur instanceof Error ? erreur.message : "Commande impossible.",
    });
  }
}

export async function telechargerFactureCommande(requete: RequeteAuthentifiee, reponse: Response) {
  const commande = await baseDeDonnees.commande.findFirst({
    where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
    include: {
      lignes: { include: { produit: true } },
      client: true,
      paiements: { orderBy: { datePaiement: "desc" } },
    },
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

  const paiement = commande.paiements[0];
  const pdf = await genererProformaPdf({
    numero: commande.numeroCommande,
    dateTexte,
    nomClient: nomClient || "Client",
    titreDocument: "FACTURE",
    statutPaiement: paiement?.statut,
    libellePaiement: paiement ? libelleStatutPaiement(paiement.statut) : "En attente",
    libelleModePaiement: paiement ? libelleModePaiement(paiement.modePaiement) : undefined,
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
