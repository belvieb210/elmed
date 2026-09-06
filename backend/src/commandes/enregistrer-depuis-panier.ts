import { ModePaiement, StatutPaiement } from "@prisma/client";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { emettreTempsReel, emettreTempsReelEquipe } from "../temps-reel/diffuseur";

async function genererNumeroCommande() {
  const annee = new Date().getFullYear();
  const total = await baseDeDonnees.commande.count();
  return `CMD-${annee}-${String(total + 1).padStart(5, "0")}`;
}

export async function enregistrerCommandeDepuisPanier(params: {
  clientId: string;
  modePaiement: ModePaiement;
  statutPaiement?: StatutPaiement;
  notes?: string | null;
  reference?: string | null;
}) {
  const lignesPanier = await baseDeDonnees.lignePanier.findMany({
    where: { clientId: params.clientId },
    include: { produit: true },
  });

  if (lignesPanier.length === 0) {
    throw new Error("Votre panier est vide.");
  }

  const montantTotal = lignesPanier.reduce(
    (somme, ligne) => somme + Number(ligne.produit.prix) * ligne.quantite,
    0,
  );
  const statutPaiement = params.statutPaiement ?? StatutPaiement.EN_ATTENTE;

  return baseDeDonnees.$transaction(async (transaction) => {
    const creee = await transaction.commande.create({
      data: {
        numeroCommande: await genererNumeroCommande(),
        clientId: params.clientId,
        statut: statutPaiement === StatutPaiement.PAYE ? "VALIDEE" : "EN_ATTENTE",
        montantTotal,
        notes: params.notes ?? null,
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
        modePaiement: params.modePaiement,
        statut: statutPaiement,
        reference: params.reference ?? null,
      },
    });

    await transaction.lignePanier.deleteMany({ where: { clientId: params.clientId } });

    await transaction.notification.create({
      data: {
        utilisateurId: params.clientId,
        titre: statutPaiement === StatutPaiement.PAYE ? "Paiement confirmé" : "Commande envoyée",
        contenu:
          statutPaiement === StatutPaiement.PAYE
            ? `Le paiement de la commande ${creee.numeroCommande} a été confirmé.`
            : `Votre commande ${creee.numeroCommande} a été transmise à MateMedical.`,
        typeNotif: "COMMANDE",
        lien: `/commandes/${creee.id}`,
      },
    });

    emettreTempsReel(params.clientId, "commande", { commandeId: creee.id });
    emettreTempsReel(params.clientId, "notification");
    emettreTempsReel(params.clientId, "panier");
    emettreTempsReelEquipe("commande", { commandeId: creee.id, clientId: params.clientId });
    return creee;
  });
}

export async function encaisserCommandeExistante(params: {
  clientId: string;
  commandeId: string;
  modePaiement: ModePaiement;
  statutPaiement: StatutPaiement;
  reference?: string | null;
  notes?: string | null;
}) {
  const commande = await baseDeDonnees.commande.findFirst({
    where: { id: params.commandeId, clientId: params.clientId },
    include: { paiements: { orderBy: { datePaiement: "desc" } } },
  });

  if (!commande) {
    throw new Error("Commande introuvable.");
  }
  if (["ANNULEE", "REFUSEE"].includes(commande.statut)) {
    throw new Error("Cette commande ne peut plus être payée.");
  }
  if (commande.paiements[0]?.statut === StatutPaiement.PAYE) {
    throw new Error("Cette commande est déjà payée.");
  }

  const paiement = commande.paiements[0];
  const notes = [commande.notes, params.notes].filter(Boolean).join(" · ") || null;

  const miseAJour = await baseDeDonnees.$transaction(async (transaction) => {
    if (paiement) {
      await transaction.paiement.update({
        where: { id: paiement.id },
        data: {
          modePaiement: params.modePaiement,
          statut: params.statutPaiement,
          reference: params.reference ?? paiement.reference,
          datePaiement: new Date(),
        },
      });
    } else {
      await transaction.paiement.create({
        data: {
          commandeId: commande.id,
          montant: commande.montantTotal,
          modePaiement: params.modePaiement,
          statut: params.statutPaiement,
          reference: params.reference ?? null,
        },
      });
    }

    const commandeMaj = await transaction.commande.update({
      where: { id: commande.id },
      data: {
        notes,
        statut:
          params.statutPaiement === StatutPaiement.PAYE && commande.statut === "EN_ATTENTE"
            ? "VALIDEE"
            : commande.statut,
      },
    });

    await transaction.notification.create({
      data: {
        utilisateurId: params.clientId,
        titre: params.statutPaiement === StatutPaiement.PAYE ? "Paiement confirmé" : "Paiement enregistré",
        contenu:
          params.statutPaiement === StatutPaiement.PAYE
            ? `Le paiement de la commande ${commande.numeroCommande} a été confirmé.`
            : `Un paiement a été enregistré pour la commande ${commande.numeroCommande}.`,
        typeNotif: "COMMANDE",
        lien: `/commandes/${commande.id}`,
      },
    });

    return commandeMaj;
  });

  emettreTempsReel(params.clientId, "commande", { commandeId: commande.id });
  emettreTempsReel(params.clientId, "notification");
  emettreTempsReelEquipe("commande", { commandeId: commande.id, clientId: params.clientId });
  return miseAJour;
}
