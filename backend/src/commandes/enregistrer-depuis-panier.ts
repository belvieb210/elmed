import { ModePaiement, StatutPaiement } from "@prisma/client";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { emettreTempsReel } from "../temps-reel/diffuseur";

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
    return creee;
  });
}
