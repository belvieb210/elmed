import { baseDeDonnees } from "../config/baseDeDonnees";
import type { Prisma } from "@prisma/client";

export const IMAGE_ACCUEIL_DEFAUT = "/medias/hero-accueil-produits.png";
export const LOGO_DEFAUT = "/medias/logo-microscope.png";
export const IMAGES_ACCUEIL_DEFAUT = ["/medias/hero-accueil-produits.png"];
export const MAX_IMAGES_ACCUEIL = 6;

export type InfosEntreprise = {
  nomCommercial: string;
  nom: string;
  activite1: string;
  activite2: string;
  rccm: string;
  idNational: string;
  adresse: string;
  telephone: string;
  ville: string;
  emailContact: string | null;
  siteWeb: string | null;
  merci: string;
  logoUrl: string | null;
  imageAccueilUrl: string | null;
  imagesAccueil: string[];
};

export function normaliserImagesAccueil(valeur: unknown, secours?: string | null): string[] {
  const depuisJson = Array.isArray(valeur)
    ? valeur.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  if (depuisJson.length > 0) return depuisJson.slice(0, MAX_IMAGES_ACCUEIL);
  if (secours?.trim()) return [secours.trim()];
  return [...IMAGES_ACCUEIL_DEFAUT];
}

export const infosElmedDefaut: InfosEntreprise = {
  nomCommercial: "MateMedical",
  nom: "ELMED",
  activite1: "Vente des Matériels Médicaux",
  activite2: "Réactifs de Labo & Produits chimiques",
  rccm: "CD/KNG/RCCM/25-A-00642",
  idNational: "01-Q8601 -N60892Q",
  adresse: "Av. du commerce N°35 Kinshasa-Gombe",
  telephone: "0913553866 - 0813553866",
  ville: "Kin",
  emailContact: null,
  siteWeb: null,
  merci: "Merci de nous avoir choisi",
  logoUrl: LOGO_DEFAUT,
  imageAccueilUrl: IMAGE_ACCUEIL_DEFAUT,
  imagesAccueil: [...IMAGES_ACCUEIL_DEFAUT],
};

/** @deprecated Utiliser obtenirInfosEntreprise() — conservé pour compatibilité */
export const infosElmed = infosElmedDefaut;

export const bleuProforma = "#2B6CB0";
export const bleuFiligrane = "#8FB8DC";

let cache: InfosEntreprise | null = null;
let cacheAt = 0;
const TTL_MS = 15_000;

function formaterLigne(ligne: {
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
  imageAccueilUrl?: string | null;
  imagesAccueil?: unknown;
}): InfosEntreprise {
  const imagesAccueil = normaliserImagesAccueil(ligne.imagesAccueil, ligne.imageAccueilUrl);
  return {
    nomCommercial: ligne.nomCommercial,
    nom: ligne.raisonSociale,
    activite1: ligne.activite1,
    activite2: ligne.activite2,
    rccm: ligne.rccm,
    idNational: ligne.idNational,
    adresse: ligne.adresse,
    telephone: ligne.telephone,
    ville: ligne.ville,
    emailContact: ligne.emailContact,
    siteWeb: ligne.siteWeb,
    merci: ligne.messagePied,
    logoUrl: ligne.logoUrl || LOGO_DEFAUT,
    imageAccueilUrl: imagesAccueil[0] || IMAGE_ACCUEIL_DEFAUT,
    imagesAccueil,
  };
}

export function invaliderCacheInfosEntreprise() {
  cache = null;
  cacheAt = 0;
}

export async function obtenirInfosEntreprise(): Promise<InfosEntreprise> {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;

  try {
    const ligne = await baseDeDonnees.parametreEntreprise.findFirst({
      orderBy: { dateMaj: "desc" },
    });
    cache = ligne ? formaterLigne(ligne) : infosElmedDefaut;
  } catch {
    cache = infosElmedDefaut;
  }
  cacheAt = Date.now();
  return cache;
}

export async function assurerParametresEntreprise() {
  try {
    const existant = await baseDeDonnees.parametreEntreprise.findFirst();
    if (existant) {
      try {
        const images = normaliserImagesAccueil(
          (existant as { imagesAccueil?: unknown }).imagesAccueil,
          existant.imageAccueilUrl,
        );
        const maj: Prisma.ParametreEntrepriseUpdateInput = {};
        if (!existant.logoUrl) maj.logoUrl = LOGO_DEFAUT;
        if (!existant.imageAccueilUrl) maj.imageAccueilUrl = images[0] || IMAGE_ACCUEIL_DEFAUT;
        const imagesActuelles = (existant as { imagesAccueil?: unknown }).imagesAccueil;
        const actuelVide =
          !Array.isArray(imagesActuelles) || (imagesActuelles as unknown[]).length === 0;
        if (actuelVide) {
          maj.imagesAccueil = images as Prisma.InputJsonValue;
        }
        if (Object.keys(maj).length > 0) {
          return await baseDeDonnees.parametreEntreprise.update({
            where: { id: existant.id },
            data: maj,
          });
        }
      } catch {
        // Colonnes images pas encore migrées : on renvoie la ligne telle quelle.
      }
      return existant;
    }
    return await baseDeDonnees.parametreEntreprise.create({
      data: {
        nomCommercial: infosElmedDefaut.nomCommercial,
        raisonSociale: infosElmedDefaut.nom,
        activite1: infosElmedDefaut.activite1,
        activite2: infosElmedDefaut.activite2,
        rccm: infosElmedDefaut.rccm,
        idNational: infosElmedDefaut.idNational,
        adresse: infosElmedDefaut.adresse,
        telephone: infosElmedDefaut.telephone,
        ville: infosElmedDefaut.ville,
        messagePied: infosElmedDefaut.merci,
        logoUrl: LOGO_DEFAUT,
        imageAccueilUrl: IMAGE_ACCUEIL_DEFAUT,
        imagesAccueil: IMAGES_ACCUEIL_DEFAUT,
      },
    });
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    throw new Error(
      `Paramètres entreprise indisponibles. Vérifiez la migration parametres_entreprise. (${message})`,
    );
  }
}
