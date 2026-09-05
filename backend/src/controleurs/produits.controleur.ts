import type { Request, Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";

export async function listerProduits(requete: Request, reponse: Response) {
  const recherche = String(requete.query.recherche ?? "").trim();
  const slugCategorie = String(requete.query.categorie ?? "").trim();

  const produits = await baseDeDonnees.produit.findMany({
    where: {
      disponible: true,
      ...(recherche
        ? {
            OR: [
              { nom: { contains: recherche, mode: "insensitive" } },
              { description: { contains: recherche, mode: "insensitive" } },
              { sku: { contains: recherche, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(slugCategorie ? { categorie: { slug: slugCategorie } } : {}),
    },
    include: { categorie: true },
    orderBy: { nom: "asc" },
  });

  reponse.json({
    succes: true,
    produits: produits.map((produit) => ({
      id: produit.id,
      nom: produit.nom,
      description: produit.description,
      prix: Number(produit.prix),
      image: produit.image,
      sku: produit.sku,
      quantiteStock: produit.quantiteStock,
      populaire: produit.populaire,
      nomCategorie: produit.categorie.nom,
      slugCategorie: produit.categorie.slug,
    })),
  });
}

export async function obtenirProduit(requete: Request, reponse: Response) {
  const produit = await baseDeDonnees.produit.findUnique({
    where: { id: requete.params.id },
    include: { categorie: true, lots: true },
  });

  if (!produit) {
    reponse.status(404).json({ succes: false, message: "Produit introuvable." });
    return;
  }

  reponse.json({
    succes: true,
    produit: {
      ...produit,
      prix: Number(produit.prix),
      nomCategorie: produit.categorie.nom,
    },
  });
}

export async function listerCategories(_requete: Request, reponse: Response) {
  const categories = await baseDeDonnees.categorie.findMany({
    orderBy: { ordre: "asc" },
    include: { _count: { select: { produits: true } } },
  });

  reponse.json({
    succes: true,
    categories: categories.map((categorie) => ({
      id: categorie.id,
      nom: categorie.nom,
      slug: categorie.slug,
      icone: categorie.icone,
      description: categorie.description,
      nombreProduits: categorie._count.produits,
    })),
  });
}
