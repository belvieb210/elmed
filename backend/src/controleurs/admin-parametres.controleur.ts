import type { Request, Response } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import {
  assurerParametresEntreprise,
  invaliderCacheInfosEntreprise,
  MAX_IMAGES_ACCUEIL,
  normaliserImagesAccueil,
} from "../documents/infos-elmed";
import { adresseIpRequete, enregistrerAudit } from "../audit/enregistrer";

const schemaEntreprise = z.object({
  nomCommercial: z.string().trim().optional().or(z.literal("")),
  raisonSociale: z.string().trim().optional().or(z.literal("")),
  activite1: z.string().trim().optional().or(z.literal("")),
  activite2: z.string().trim().optional().or(z.literal("")),
  rccm: z.string().trim().optional().or(z.literal("")),
  idNational: z.string().trim().optional().or(z.literal("")),
  adresse: z.string().trim().optional().or(z.literal("")),
  telephone: z.string().trim().optional().or(z.literal("")),
  ville: z.string().trim().optional().or(z.literal("")),
  emailContact: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((valeur) => !valeur || z.string().email().safeParse(valeur).success, {
      message: "Email contact invalide.",
    }),
  siteWeb: z.string().trim().optional().or(z.literal("")),
  messagePied: z.string().trim().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  imageAccueilUrl: z.string().optional().or(z.literal("")),
  imagesAccueil: z.array(z.string()).max(MAX_IMAGES_ACCUEIL).optional(),
});

function valeurOuExistante(nouvelle: string | undefined, actuelle: string) {
  const texte = nouvelle?.trim();
  return texte ? texte : actuelle;
}

function formaterEntreprise(ligne: {
  id: string;
  nomCommercial: string;
  raisonSociale: string;
  activite1: string;
  activite2: string;
  rccm: string;
  idNational: string;
  adresse: string;
  telephone: string;
  ville: string;
  emailContact: string | null;
  siteWeb: string | null;
  messagePied: string;
  logoUrl: string | null;
  imageAccueilUrl: string | null;
  imagesAccueil?: unknown;
  dateMaj: Date;
}) {
  const imagesAccueil = normaliserImagesAccueil(ligne.imagesAccueil, ligne.imageAccueilUrl);
  return {
    id: ligne.id,
    nomCommercial: ligne.nomCommercial,
    raisonSociale: ligne.raisonSociale,
    activite1: ligne.activite1,
    activite2: ligne.activite2,
    rccm: ligne.rccm,
    idNational: ligne.idNational,
    adresse: ligne.adresse,
    telephone: ligne.telephone,
    ville: ligne.ville,
    emailContact: ligne.emailContact,
    siteWeb: ligne.siteWeb,
    messagePied: ligne.messagePied,
    logoUrl: ligne.logoUrl,
    imageAccueilUrl: imagesAccueil[0] || ligne.imageAccueilUrl,
    imagesAccueil,
    dateMaj: ligne.dateMaj,
  };
}

export async function obtenirEntreprisePublique(_requete: Request, reponse: Response) {
  try {
    const ligne = await assurerParametresEntreprise();
    reponse.json({ succes: true, entreprise: formaterEntreprise(ligne) });
  } catch (erreur) {
    reponse.status(500).json({
      succes: false,
      message: erreur instanceof Error ? erreur.message : "Impossible de charger l’entreprise.",
    });
  }
}

export async function obtenirEntrepriseAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  try {
    const ligne = await assurerParametresEntreprise();
    reponse.json({ succes: true, entreprise: formaterEntreprise(ligne) });
  } catch (erreur) {
    reponse.status(500).json({
      succes: false,
      message: erreur instanceof Error ? erreur.message : "Impossible de charger l’entreprise.",
    });
  }
}

export async function mettreAJourEntrepriseAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaEntreprise.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données entreprise invalides.",
    });
    return;
  }

  const actuel = await assurerParametresEntreprise();
  const donnees = analyse.data;

  const imagesAccueil =
    donnees.imagesAccueil !== undefined
      ? normaliserImagesAccueil(donnees.imagesAccueil)
      : normaliserImagesAccueil(actuel.imagesAccueil, actuel.imageAccueilUrl);

  const donneesCommunes = {
    nomCommercial: valeurOuExistante(donnees.nomCommercial, actuel.nomCommercial),
    raisonSociale: valeurOuExistante(donnees.raisonSociale, actuel.raisonSociale),
    activite1: valeurOuExistante(donnees.activite1, actuel.activite1),
    activite2:
      donnees.activite2 === undefined
        ? actuel.activite2
        : donnees.activite2.trim() || actuel.activite2,
    rccm: valeurOuExistante(donnees.rccm, actuel.rccm),
    idNational: valeurOuExistante(donnees.idNational, actuel.idNational),
    adresse: valeurOuExistante(donnees.adresse, actuel.adresse),
    telephone: valeurOuExistante(donnees.telephone, actuel.telephone),
    ville: valeurOuExistante(donnees.ville, actuel.ville),
    emailContact:
      donnees.emailContact === undefined
        ? actuel.emailContact
        : donnees.emailContact.trim() || null,
    siteWeb: donnees.siteWeb === undefined ? actuel.siteWeb : donnees.siteWeb.trim() || null,
    messagePied: valeurOuExistante(donnees.messagePied, actuel.messagePied),
    logoUrl:
      donnees.logoUrl === undefined ? actuel.logoUrl : donnees.logoUrl.trim() || null,
    imageAccueilUrl: imagesAccueil[0] || null,
  };

  let misAJour;
  try {
    misAJour = await baseDeDonnees.parametreEntreprise.update({
      where: { id: actuel.id },
      data: {
        ...donneesCommunes,
        imagesAccueil: imagesAccueil as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Migration images_accueil pas encore appliquée
    misAJour = await baseDeDonnees.parametreEntreprise.update({
      where: { id: actuel.id },
      data: donneesCommunes,
    });
  }

  invaliderCacheInfosEntreprise();

  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: "MAJ_ENTREPRISE",
    tableCible: "parametres_entreprise",
    details: `Paramètres entreprise mis à jour : ${misAJour.raisonSociale} / ${misAJour.nomCommercial}`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.json({
    succes: true,
    entreprise: formaterEntreprise(misAJour),
    message: "Paramètres entreprise enregistrés. Factures, proformas et interface utilisent ces valeurs.",
  });
}
