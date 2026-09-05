import type { Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

function formaterLigne(ligne: {
  id: string;
  quantite: number;
  produit: { id: string; nom: string; prix: { toString(): string }; image: string | null; sku: string };
}) {
  const prixUnitaire = Number(ligne.produit.prix);
  return {
    id: ligne.id,
    produitId: ligne.produit.id,
    nomProduit: ligne.produit.nom,
    sku: ligne.produit.sku,
    image: ligne.produit.image,
    quantite: ligne.quantite,
    prixUnitaire,
    sousTotal: prixUnitaire * ligne.quantite,
  };
}

export async function obtenirPanier(requete: RequeteAuthentifiee, reponse: Response) {
  const lignes = await baseDeDonnees.lignePanier.findMany({
    where: { clientId: requete.utilisateurId },
    include: { produit: true },
    orderBy: { id: "asc" },
  });

  const articles = lignes.map(formaterLigne);
  const montantTotal = articles.reduce((somme, article) => somme + article.sousTotal, 0);
  const nombreArticles = articles.reduce((somme, article) => somme + article.quantite, 0);

  reponse.json({ succes: true, panier: { articles, montantTotal, nombreArticles } });
}

export async function ajouterAuPanier(requete: RequeteAuthentifiee, reponse: Response) {
  const schema = z.object({
    produitId: z.string().uuid(),
    quantite: z.number().int().min(1).optional(),
  });

  const analyse = schema.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Produit invalide." });
    return;
  }

  const { produitId, quantite = 1 } = analyse.data;
  const produit = await baseDeDonnees.produit.findUnique({ where: { id: produitId } });

  if (!produit || !produit.disponible) {
    reponse.status(404).json({ succes: false, message: "Produit indisponible." });
    return;
  }

  const ligne = await baseDeDonnees.lignePanier.upsert({
    where: {
      clientId_produitId: {
        clientId: requete.utilisateurId!,
        produitId,
      },
    },
    create: { clientId: requete.utilisateurId!, produitId, quantite },
    update: { quantite: { increment: quantite } },
    include: { produit: true },
  });

  reponse.json({
    succes: true,
    message: "Produit ajouté au panier.",
    article: formaterLigne(ligne),
  });
}

export async function modifierQuantitePanier(requete: RequeteAuthentifiee, reponse: Response) {
  const schema = z.object({ quantite: z.number().int().min(0) });
  const analyse = schema.safeParse(requete.body);

  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Quantité invalide." });
    return;
  }

  if (analyse.data.quantite === 0) {
    await baseDeDonnees.lignePanier.deleteMany({
      where: { id: requete.params.id, clientId: requete.utilisateurId },
    });
    reponse.json({ succes: true, message: "Article retiré du panier." });
    return;
  }

  const ligne = await baseDeDonnees.lignePanier.update({
    where: { id: requete.params.id },
    data: { quantite: analyse.data.quantite },
    include: { produit: true },
  });

  reponse.json({ succes: true, article: formaterLigne(ligne) });
}

export async function retirerDuPanier(requete: RequeteAuthentifiee, reponse: Response) {
  await baseDeDonnees.lignePanier.deleteMany({
    where: { id: requete.params.id, clientId: requete.utilisateurId },
  });
  reponse.json({ succes: true, message: "Article retiré du panier." });
}
