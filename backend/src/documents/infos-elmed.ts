import { baseDeDonnees } from "../config/baseDeDonnees";

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
};

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
  logoUrl: null,
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
}): InfosEntreprise {
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
    logoUrl: ligne.logoUrl,
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
  const existant = await baseDeDonnees.parametreEntreprise.findFirst();
  if (existant) return existant;
  return baseDeDonnees.parametreEntreprise.create({
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
    },
  });
}
