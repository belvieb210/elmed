import type { Request } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";

export function adresseIpRequete(requete?: Request | null) {
  if (!requete) return null;
  const transmis = requete.headers["x-forwarded-for"];
  if (typeof transmis === "string" && transmis.length > 0) {
    return transmis.split(",")[0]?.trim() || null;
  }
  return requete.ip || null;
}

export async function enregistrerAudit(params: {
  utilisateurId?: string | null;
  action: string;
  tableCible: string;
  details?: string;
  adresseIp?: string | null;
}) {
  try {
    await baseDeDonnees.journalAudit.create({
      data: {
        utilisateurId: params.utilisateurId || null,
        action: params.action,
        tableCible: params.tableCible,
        details: params.details?.slice(0, 2000) || null,
        adresseIp: params.adresseIp || null,
      },
    });
  } catch {
    // L’audit ne doit jamais bloquer le flux métier.
  }
}
