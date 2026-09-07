import type { Request, Response } from "express";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import {
  assurerParametresEntreprise,
  invaliderCacheInfosEntreprise,
} from "../documents/infos-elmed";
import { adresseIpRequete, enregistrerAudit } from "../audit/enregistrer";

const schemaEntreprise = z.object({
  nomCommercial: z.string().trim().min(1, "Nom commercial requis."),
  raisonSociale: z.string().trim().min(1, "Raison sociale requise."),
  activite1: z.string().trim().min(1),
  activite2: z.string().trim().optional().or(z.literal("")),
  rccm: z.string().trim().min(1, "RCCM requis."),
  idNational: z.string().trim().min(1, "Identifiant national requis."),
  adresse: z.string().trim().min(1),
  telephone: z.string().trim().min(1),
  ville: z.string().trim().min(1),
  emailContact: z.string().trim().email().optional().or(z.literal("")),
  siteWeb: z.string().trim().optional().or(z.literal("")),
  messagePied: z.string().trim().min(1),
  logoUrl: z.string().optional().or(z.literal("")),
});

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
  dateMaj: Date;
}) {
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
    dateMaj: ligne.dateMaj,
  };
}

export async function obtenirEntreprisePublique(_requete: Request, reponse: Response) {
  const ligne = await assurerParametresEntreprise();
  reponse.json({ succes: true, entreprise: formaterEntreprise(ligne) });
}

export async function obtenirEntrepriseAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const ligne = await assurerParametresEntreprise();
  reponse.json({ succes: true, entreprise: formaterEntreprise(ligne) });
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
  const misAJour = await baseDeDonnees.parametreEntreprise.update({
    where: { id: actuel.id },
    data: {
      nomCommercial: donnees.nomCommercial,
      raisonSociale: donnees.raisonSociale,
      activite1: donnees.activite1,
      activite2: donnees.activite2?.trim() || "",
      rccm: donnees.rccm,
      idNational: donnees.idNational,
      adresse: donnees.adresse,
      telephone: donnees.telephone,
      ville: donnees.ville,
      emailContact: donnees.emailContact?.trim() || null,
      siteWeb: donnees.siteWeb?.trim() || null,
      messagePied: donnees.messagePied,
      logoUrl: donnees.logoUrl?.trim() || null,
    },
  });

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
