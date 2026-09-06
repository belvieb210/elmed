import type { Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { genererProformaPdf } from "../documents/generer-proforma";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { emettreTempsReel } from "../temps-reel/diffuseur";
import { identifiantRoute } from "../utils/identifiant";

const inclusionProduit = {
  produit: {
    include: {
      categorie: true,
      lots: { orderBy: { dateExpiration: "asc" as const }, take: 1 },
    },
  },
};

function formaterLigne(ligne: {
  id: string;
  quantite: number;
  produit: {
    id: string;
    nom: string;
    prix: { toString(): string };
    image: string | null;
    sku: string;
    quantiteStock: number;
    categorie?: { nom: string; slug: string };
    lots?: { numeroLot: string }[];
  };
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
    nomCategorie: ligne.produit.categorie?.nom ?? "",
    slugCategorie: ligne.produit.categorie?.slug ?? "",
    quantiteStock: ligne.produit.quantiteStock,
    numeroLot: ligne.produit.lots?.[0]?.numeroLot ?? null,
  };
}

function dateProforma() {
  const texte = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return texte.replace(/^(\d+\s)([a-z])/, (_tout, prefixe: string, lettre: string) => `${prefixe}${lettre.toUpperCase()}`);
}

function numeroProforma() {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  return `PRO-${annee}${mois}${jour}`;
}

export async function telechargerProformaPanier(requete: RequeteAuthentifiee, reponse: Response) {
  const clientId = requete.utilisateurId!;
  const [lignes, client] = await Promise.all([
    baseDeDonnees.lignePanier.findMany({
      where: { clientId },
      include: { produit: true },
      orderBy: { id: "asc" },
    }),
    baseDeDonnees.utilisateur.findUnique({ where: { id: clientId } }),
  ]);

  if (lignes.length === 0) {
    reponse.status(400).json({ succes: false, message: "Votre panier est vide." });
    return;
  }

  const articles = lignes.map(formaterLigne);
  const montantTotal = articles.reduce((somme, article) => somme + article.sousTotal, 0);
  const nomClient = [client?.nomSociete, `${client?.prenom ?? ""} ${client?.nom ?? ""}`.trim()]
    .filter(Boolean)
    .join(" — ");
  const numero = numeroProforma();

  const pdf = await genererProformaPdf({
    numero,
    dateTexte: dateProforma(),
    nomClient: nomClient || "Client",
    lignes: articles.map((article) => ({
      quantite: article.quantite,
      designation: article.nomProduit,
      prixUnitaire: article.prixUnitaire,
      prixTotal: article.sousTotal,
    })),
    montantTotal,
  });

  reponse.setHeader("Content-Type", "application/pdf");
  reponse.setHeader("Content-Disposition", `inline; filename="proforma-ELMED-${numero}.pdf"`);
  reponse.send(pdf);
}

export async function obtenirPanier(requete: RequeteAuthentifiee, reponse: Response) {
  const lignes = await baseDeDonnees.lignePanier.findMany({
    where: { clientId: requete.utilisateurId },
    include: inclusionProduit,
    orderBy: { id: "asc" },
  });

  const articles = lignes.map(formaterLigne);
  const montantTotal = articles.reduce((somme, article) => somme + article.sousTotal, 0);
  const nombreArticles = articles.reduce((somme, article) => somme + article.quantite, 0);
  const entrepot = await baseDeDonnees.entrepot.findFirst({ orderBy: { nom: "asc" } });

  reponse.json({
    succes: true,
    panier: {
      articles,
      montantTotal,
      nombreArticles,
      entrepot: entrepot
        ? {
            nom: entrepot.nom,
            adresse: entrepot.adresse,
            ville: entrepot.ville,
            telephone: entrepot.telephone,
            latitude: entrepot.latitude,
            longitude: entrepot.longitude,
            heures: entrepot.heures,
          }
        : null,
    },
  });
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

  emettreTempsReel(requete.utilisateurId, "panier");
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
      where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
    });
    emettreTempsReel(requete.utilisateurId, "panier");
    reponse.json({ succes: true, message: "Article retiré du panier." });
    return;
  }

  const ligne = await baseDeDonnees.lignePanier.update({
    where: { id: identifiantRoute(requete.params.id) },
    data: { quantite: analyse.data.quantite },
    include: inclusionProduit,
  });

  emettreTempsReel(requete.utilisateurId, "panier");
  reponse.json({ succes: true, article: formaterLigne(ligne) });
}

export async function viderPanier(requete: RequeteAuthentifiee, reponse: Response) {
  await baseDeDonnees.lignePanier.deleteMany({
    where: { clientId: requete.utilisateurId },
  });
  emettreTempsReel(requete.utilisateurId, "panier");
  reponse.json({ succes: true, message: "Panier vidé." });
}

export async function retirerDuPanier(requete: RequeteAuthentifiee, reponse: Response) {
  await baseDeDonnees.lignePanier.deleteMany({
    where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
  });
  emettreTempsReel(requete.utilisateurId, "panier");
  reponse.json({ succes: true, message: "Article retiré du panier." });
}
