import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { detailsCatalogue } from "./catalogue-details";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function enrichir() {
  for (const detail of detailsCatalogue) {
    const produit = await prisma.produit.findUnique({ where: { sku: detail.sku } });
    if (!produit) continue;

    const nombreImages = await prisma.imageProduit.count({ where: { produitId: produit.id } });
    if (nombreImages === 0) {
      await prisma.imageProduit.createMany({
        data: detail.images.map((url, ordre) => ({
          produitId: produit.id,
          url,
          ordre,
        })),
      });
    }

    const nombreCaracteristiques = await prisma.caracteristiqueProduit.count({
      where: { produitId: produit.id },
    });
    if (nombreCaracteristiques === 0) {
      await prisma.caracteristiqueProduit.createMany({
        data: detail.caracteristiques.map((caracteristique, ordre) => ({
          produitId: produit.id,
          libelle: caracteristique.libelle,
          valeur: caracteristique.valeur,
          ordre,
        })),
      });
    }

    if (!produit.image && detail.images[0]) {
      await prisma.produit.update({
        where: { id: produit.id },
        data: { image: detail.images[0] },
      });
    }
  }

  console.log("Catalogue enrichi (images et caractéristiques).");
}

enrichir()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
