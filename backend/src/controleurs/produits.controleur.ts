import type { Request, Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { identifiantRoute } from "../utils/identifiant";

function formaterProduitListe(produit: {
  id: string;
  nom: string;
  description: string | null;
  prix: { toString(): string };
  image: string | null;
  sku: string;
  quantiteStock: number;
  populaire: boolean;
  categorie: { nom: string; slug: string };
  images?: { url: string; ordre: number }[];
}) {
  const images = (produit.images ?? []).sort((a, b) => a.ordre - b.ordre).map((image) => image.url);
  return {
    id: produit.id,
    nom: produit.nom,
    description: produit.description,
    prix: Number(produit.prix),
    image: images[0] ?? produit.image,
    images,
    sku: produit.sku,
    quantiteStock: produit.quantiteStock,
    populaire: produit.populaire,
    nomCategorie: produit.categorie.nom,
    slugCategorie: produit.categorie.slug,
  };
}

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
    include: { categorie: true, images: { orderBy: { ordre: "asc" } } },
    orderBy: { nom: "asc" },
  });

  reponse.json({
    succes: true,
    produits: produits.map(formaterProduitListe),
  });
}

export async function obtenirProduit(requete: Request, reponse: Response) {
  const identifiant = identifiantRoute(requete.params.id);
  const produit = await baseDeDonnees.produit.findUnique({
    where: { id: identifiant },
    include: {
      categorie: true,
      images: { orderBy: { ordre: "asc" } },
      caracteristiques: { orderBy: { ordre: "asc" } },
    },
  });

  if (!produit) {
    reponse.status(404).json({ succes: false, message: "Produit introuvable." });
    return;
  }

  const produitsSimilaires = await baseDeDonnees.produit.findMany({
    where: {
      disponible: true,
      categorieId: produit.categorieId,
      id: { not: produit.id },
    },
    include: { categorie: true, images: { orderBy: { ordre: "asc" } } },
    take: 8,
    orderBy: { nom: "asc" },
  });

  const images = produit.images.map((image) => image.url);
  if (produit.image && !images.includes(produit.image)) {
    images.unshift(produit.image);
  }

  reponse.json({
    succes: true,
    produit: {
      id: produit.id,
      nom: produit.nom,
      description: produit.description,
      prix: Number(produit.prix),
      image: images[0] ?? produit.image,
      images,
      sku: produit.sku,
      quantiteStock: produit.quantiteStock,
      populaire: produit.populaire,
      nomCategorie: produit.categorie.nom,
      slugCategorie: produit.categorie.slug,
      caracteristiques: produit.caracteristiques.map((caracteristique) => ({
        libelle: caracteristique.libelle,
        valeur: caracteristique.valeur,
      })),
      produitsSimilaires: produitsSimilaires.map(formaterProduitListe),
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
