import type { Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { genererProformaPdf } from "../documents/generer-proforma";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { identifiantRoute } from "../utils/identifiant";

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
      where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
    });
    reponse.json({ succes: true, message: "Article retiré du panier." });
    return;
  }

  const ligne = await baseDeDonnees.lignePanier.update({
    where: { id: identifiantRoute(requete.params.id) },
    data: { quantite: analyse.data.quantite },
    include: { produit: true },
  });

  reponse.json({ succes: true, article: formaterLigne(ligne) });
}

export async function retirerDuPanier(requete: RequeteAuthentifiee, reponse: Response) {
  await baseDeDonnees.lignePanier.deleteMany({
    where: { id: identifiantRoute(requete.params.id), clientId: requete.utilisateurId },
  });
  reponse.json({ succes: true, message: "Article retiré du panier." });
}
