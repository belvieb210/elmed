import type { Prisma } from "@prisma/client";
import { baseDeDonnees } from "../config/baseDeDonnees";

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
    await transaction.produit.update({
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
  }
}

export function numerosVisiteDossier(numeroCommande: string) {
  const suite = numeroCommande.replace(/^CMD-/, "");
  return {
    numeroVisite: `VIS-${suite}`,
    numeroDossier: `DOS-${suite}`,
  };
}
