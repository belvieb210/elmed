import path from "path";
import dotenv from "dotenv";
import { PrismaClient, TypeMediaProduit } from "@prisma/client";
import { detailsCatalogue, mediasDuCatalogue } from "./catalogue-details";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function enrichir() {
  for (const detail of detailsCatalogue) {
    const produit = await prisma.produit.findUnique({ where: { sku: detail.sku } });
    if (!produit) continue;

    await prisma.imageProduit.deleteMany({ where: { produitId: produit.id } });
    await prisma.caracteristiqueProduit.deleteMany({ where: { produitId: produit.id } });

    const medias = mediasDuCatalogue(detail);
    await prisma.imageProduit.createMany({
      data: medias.map((media, ordre) => ({
        produitId: produit.id,
        url: media.url,
        urlCouverture: media.urlCouverture ?? null,
        typeMedia: media.typeMedia === "VIDEO" ? TypeMediaProduit.VIDEO : TypeMediaProduit.IMAGE,
        ordre,
      })),
    });

    await prisma.caracteristiqueProduit.createMany({
      data: detail.caracteristiques.map((caracteristique, ordre) => ({
        produitId: produit.id,
        libelle: caracteristique.libelle,
        valeur: caracteristique.valeur,
        ordre,
      })),
    });

    const premiereImage = detail.images[0];
    if (premiereImage) {
      await prisma.produit.update({
        where: { id: produit.id },
        data: { image: premiereImage },
      });
    }
  }

  console.log("Catalogue enrichi (images, vidéo et caractéristiques).");
}

enrichir()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
