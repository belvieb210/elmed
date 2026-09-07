import type { Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { emettreTempsReelEquipe } from "../temps-reel/diffuseur";
import { identifiantRoute } from "../utils/identifiant";
import { adresseIpRequete, enregistrerAudit } from "../audit/enregistrer";

const schemaMedia = z.object({
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().trim().min(1, "URL média requise."),
  urlCouverture: z.string().trim().optional().or(z.literal("")),
  ordre: z.number().int().nonnegative().optional(),
});

const schemaCaracteristique = z.object({
  libelle: z.string().trim().min(1, "Libellé de caractéristique requis."),
  valeur: z.string().trim().min(1, "Valeur de caractéristique requise."),
});

const schemaProduit = z.object({
  nom: z.string().trim().min(2, "Le nom du produit est requis."),
  sku: z.string().trim().min(2, "Le SKU est requis."),
  description: z.string().trim().optional().or(z.literal("")),
  prix: z.number().nonnegative("Le prix doit être positif."),
  quantiteStock: z.number().int().nonnegative("Le stock doit être positif."),
  categorieId: z.string().uuid("Catégorie invalide."),
  disponible: z.boolean().optional(),
  populaire: z.boolean().optional(),
  medias: z.array(schemaMedia).max(5, "Maximum 4 images et 1 vidéo.").optional(),
  caracteristiques: z.array(schemaCaracteristique).max(24).optional(),
});

type MediaEntree = z.infer<typeof schemaMedia>;

function normaliserMedias(medias: MediaEntree[] | undefined) {
  const liste = medias ?? [];
  const images = liste.filter((media) => media.type === "IMAGE").slice(0, 4);
  const videos = liste.filter((media) => media.type === "VIDEO").slice(0, 1);
  return [...images, ...videos].map((media, ordre) => ({
    url: media.url,
    urlCouverture: media.urlCouverture?.trim() || null,
    typeMedia: media.type,
    ordre,
  }));
}

function formaterProduitAdmin(produit: {
  id: string;
  nom: string;
  sku: string;
  description: string | null;
  prix: { toString(): string };
  image: string | null;
  quantiteStock: number;
  disponible: boolean;
  populaire: boolean;
  categorieId: string;
  categorie: { nom: string; slug: string };
  images?: Array<{
    url: string;
    urlCouverture: string | null;
    typeMedia: "IMAGE" | "VIDEO";
    ordre: number;
  }>;
  caracteristiques?: Array<{ libelle: string; valeur: string; ordre: number }>;
}) {
  const medias = (produit.images ?? [])
    .slice()
    .sort((a, b) => a.ordre - b.ordre)
    .map((media) => ({
      type: media.typeMedia,
      url: media.url,
      urlCouverture: media.urlCouverture ?? undefined,
    }));
  const images = medias.filter((media) => media.type === "IMAGE").map((media) => media.url);

  return {
    id: produit.id,
    nom: produit.nom,
    sku: produit.sku,
    description: produit.description,
    prix: Number(produit.prix),
    image: images[0] ?? produit.image,
    images,
    medias,
    quantiteStock: produit.quantiteStock,
    disponible: produit.disponible,
    populaire: produit.populaire,
    categorieId: produit.categorieId,
    nomCategorie: produit.categorie.nom,
    slugCategorie: produit.categorie.slug,
    caracteristiques: (produit.caracteristiques ?? [])
      .slice()
      .sort((a, b) => a.ordre - b.ordre)
      .map((caracteristique) => ({
        libelle: caracteristique.libelle,
        valeur: caracteristique.valeur,
      })),
  };
}

const includeProduit = {
  categorie: true,
  images: { orderBy: { ordre: "asc" as const } },
  caracteristiques: { orderBy: { ordre: "asc" as const } },
};

export async function listerProduitsAdminComplet(_requete: RequeteAuthentifiee, reponse: Response) {
  const produits = await baseDeDonnees.produit.findMany({
    include: includeProduit,
    orderBy: { nom: "asc" },
  });

  reponse.json({
    succes: true,
    produits: produits.map(formaterProduitAdmin),
  });
}

export async function obtenirProduitAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const produit = await baseDeDonnees.produit.findUnique({
    where: { id: identifiantRoute(requete.params.id) },
    include: includeProduit,
  });

  if (!produit) {
    reponse.status(404).json({ succes: false, message: "Produit introuvable." });
    return;
  }

  reponse.json({ succes: true, produit: formaterProduitAdmin(produit) });
}

export async function creerProduitAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaProduit.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données produit invalides.",
    });
    return;
  }

  const donnees = analyse.data;
  const sku = donnees.sku.toUpperCase();
  const existant = await baseDeDonnees.produit.findUnique({ where: { sku } });
  if (existant) {
    reponse.status(409).json({ succes: false, message: "Un produit existe déjà avec ce SKU." });
    return;
  }

  const categorie = await baseDeDonnees.categorie.findUnique({ where: { id: donnees.categorieId } });
  if (!categorie) {
    reponse.status(400).json({ succes: false, message: "Catégorie introuvable." });
    return;
  }

  const medias = normaliserMedias(donnees.medias);
  const imagePrincipale = medias.find((media) => media.typeMedia === "IMAGE")?.url ?? null;

  const produit = await baseDeDonnees.produit.create({
    data: {
      nom: donnees.nom,
      sku,
      description: donnees.description?.trim() || null,
      prix: donnees.prix,
      quantiteStock: donnees.quantiteStock,
      categorieId: donnees.categorieId,
      disponible: donnees.disponible ?? true,
      populaire: donnees.populaire ?? false,
      image: imagePrincipale,
      images: {
        create: medias,
      },
      caracteristiques: {
        create: (donnees.caracteristiques ?? []).map((caracteristique, ordre) => ({
          libelle: caracteristique.libelle,
          valeur: caracteristique.valeur,
          ordre,
        })),
      },
    },
    include: includeProduit,
  });

  emettreTempsReelEquipe("commande", { produitId: produit.id });

  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: "CREATION_PRODUIT",
    tableCible: "produits",
    details: `Produit créé : ${produit.nom} (${produit.sku})`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.status(201).json({
    succes: true,
    produit: formaterProduitAdmin(produit),
  });
}

export async function mettreAJourProduitAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaProduit.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données produit invalides.",
    });
    return;
  }

  const identifiant = identifiantRoute(requete.params.id);
  const produit = await baseDeDonnees.produit.findUnique({ where: { id: identifiant } });
  if (!produit) {
    reponse.status(404).json({ succes: false, message: "Produit introuvable." });
    return;
  }

  const donnees = analyse.data;
  const sku = donnees.sku.toUpperCase();
  const conflit = await baseDeDonnees.produit.findFirst({
    where: { sku, id: { not: identifiant } },
  });
  if (conflit) {
    reponse.status(409).json({ succes: false, message: "Un autre produit utilise déjà ce SKU." });
    return;
  }

  const categorie = await baseDeDonnees.categorie.findUnique({ where: { id: donnees.categorieId } });
  if (!categorie) {
    reponse.status(400).json({ succes: false, message: "Catégorie introuvable." });
    return;
  }

  const medias = normaliserMedias(donnees.medias);
  const imagePrincipale = medias.find((media) => media.typeMedia === "IMAGE")?.url ?? null;

  const misAJour = await baseDeDonnees.$transaction(async (tx) => {
    await tx.imageProduit.deleteMany({ where: { produitId: identifiant } });
    await tx.caracteristiqueProduit.deleteMany({ where: { produitId: identifiant } });

    return tx.produit.update({
      where: { id: identifiant },
      data: {
        nom: donnees.nom,
        sku,
        description: donnees.description?.trim() || null,
        prix: donnees.prix,
        quantiteStock: donnees.quantiteStock,
        categorieId: donnees.categorieId,
        disponible: donnees.disponible ?? true,
        populaire: donnees.populaire ?? false,
        image: imagePrincipale,
        images: { create: medias },
        caracteristiques: {
          create: (donnees.caracteristiques ?? []).map((caracteristique, ordre) => ({
            libelle: caracteristique.libelle,
            valeur: caracteristique.valeur,
            ordre,
          })),
        },
      },
      include: includeProduit,
    });
  });

  emettreTempsReelEquipe("commande", { produitId: misAJour.id });

  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: "MODIFICATION_PRODUIT",
    tableCible: "produits",
    details: `Produit modifié : ${misAJour.nom} (${misAJour.sku}) — stock ${misAJour.quantiteStock}`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.json({
    succes: true,
    produit: formaterProduitAdmin(misAJour),
  });
}

export async function supprimerProduitAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const identifiant = identifiantRoute(requete.params.id);
  const produit = await baseDeDonnees.produit.findUnique({
    where: { id: identifiant },
    include: {
      _count: { select: { lignesCommande: true, lignesPanier: true } },
    },
  });

  if (!produit) {
    reponse.status(404).json({ succes: false, message: "Produit introuvable." });
    return;
  }

  if (produit._count.lignesCommande > 0) {
    await baseDeDonnees.produit.update({
      where: { id: identifiant },
      data: { disponible: false },
    });
    emettreTempsReelEquipe("commande", { produitId: identifiant });
    void enregistrerAudit({
      utilisateurId: requete.utilisateurId,
      action: "DESACTIVATION_PRODUIT",
      tableCible: "produits",
      details: `Produit masqué (historique commandes) : ${produit.nom} (${produit.sku})`,
      adresseIp: adresseIpRequete(requete),
    });
    reponse.json({
      succes: true,
      message: "Produit retiré du catalogue (conservé pour l’historique des commandes).",
      desactive: true,
    });
    return;
  }

  if (produit._count.lignesPanier > 0) {
    await baseDeDonnees.lignePanier.deleteMany({ where: { produitId: identifiant } });
  }

  await baseDeDonnees.produit.delete({ where: { id: identifiant } });
  emettreTempsReelEquipe("commande", { produitId: identifiant });
  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: "SUPPRESSION_PRODUIT",
    tableCible: "produits",
    details: `Produit supprimé : ${produit.nom} (${produit.sku})`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.json({ succes: true, message: "Produit supprimé.", desactive: false });
}
