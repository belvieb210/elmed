import type { Prisma } from "@prisma/client";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { emettreTempsReelEquipe } from "../temps-reel/diffuseur";

export const SEUIL_STOCK_FAIBLE = 10;

async function alerterStockFaible(
  transaction: Prisma.TransactionClient,
  produit: { id: string; nom: string; sku: string; quantiteStock: number },
  stockAvant: number,
) {
  const apres = produit.quantiteStock;
  const vientDePasserSousSeuil = stockAvant > SEUIL_STOCK_FAIBLE && apres <= SEUIL_STOCK_FAIBLE;
  const vientEnRupture = stockAvant > 0 && apres <= 0;
  if (!vientDePasserSousSeuil && !vientEnRupture) return;

  const destinataires = await transaction.utilisateur.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "MAGASINIER", "DIRECTEUR"] },
      actif: true,
      estInvite: false,
    },
    select: { id: true },
  });

  const rupture = apres <= 0;
  const titre = rupture ? `Rupture de stock — ${produit.nom}` : `Stock faible — ${produit.nom}`;
  const contenu = rupture
    ? `« ${produit.nom} » (${produit.sku}) est en rupture (0). Le Super Admin doit réapprovisionner via Admin → Produits → Modifier, puis augmenter le stock.`
    : `« ${produit.nom} » (${produit.sku}) n’a plus que ${apres} unité(s). Réapprovisionnez rapidement (Admin → Produits → Modifier le stock) pour éviter une rupture.`;

  for (const destinataire of destinataires) {
    await transaction.notification.create({
      data: {
        utilisateurId: destinataire.id,
        titre,
        contenu,
        typeNotif: "STOCK",
        lien: "/admin/produits",
      },
    });
  }

  emettreTempsReelEquipe("notification", { produitId: produit.id, stock: apres });
}

export async function verifierStockDisponible(lignes: Array<{ produitId: string; quantite: number }>) {
  for (const ligne of lignes) {
    const produit = await baseDeDonnees.produit.findUnique({ where: { id: ligne.produitId } });
    if (!produit) {
      throw new Error("Un produit de la vente est introuvable.");
    }
    if (produit.quantiteStock < ligne.quantite) {
      throw new Error(`Stock insuffisant pour « ${produit.nom} » (${produit.quantiteStock} restant).`);
    }
  }
}

export async function debiterStockVente(
  transaction: Prisma.TransactionClient,
  lignes: Array<{ produitId: string; quantite: number }>,
) {
  for (const ligne of lignes) {
    const produit = await transaction.produit.findUnique({ where: { id: ligne.produitId } });
    if (!produit) {
      throw new Error("Un produit de la vente est introuvable.");
    }
    if (produit.quantiteStock < ligne.quantite) {
      throw new Error(`Stock insuffisant pour « ${produit.nom} » (${produit.quantiteStock} restant).`);
    }
    const stockAvant = produit.quantiteStock;
    const misAJour = await transaction.produit.update({
      where: { id: produit.id },
      data: { quantiteStock: { decrement: ligne.quantite } },
    });

    let reste = ligne.quantite;
    const stocks = await transaction.stock.findMany({
      where: { produitId: produit.id, quantite: { gt: 0 } },
      orderBy: { quantite: "desc" },
    });
    for (const stock of stocks) {
      if (reste <= 0) break;
      const prise = Math.min(stock.quantite, reste);
      await transaction.stock.update({
        where: { id: stock.id },
        data: { quantite: { decrement: prise } },
      });
      reste -= prise;
    }

    await alerterStockFaible(
      transaction,
      {
        id: misAJour.id,
        nom: misAJour.nom,
        sku: misAJour.sku,
        quantiteStock: misAJour.quantiteStock,
      },
      stockAvant,
    );
  }
}

export function numerosVisiteDossier(numeroCommande: string) {
  const suite = numeroCommande.replace(/^CMD-/, "");
  return {
    numeroVisite: `VIS-${suite}`,
    numeroDossier: `DOS-${suite}`,
  };
}
