import type { Response } from "express";

export type TypeEvenementTempsReel = "panier" | "message" | "notification" | "commande";

const abonnes = new Map<string, Set<Response>>();

export function abonnerTempsReel(utilisateurId: string, reponse: Response) {
  const groupe = abonnes.get(utilisateurId) ?? new Set<Response>();
  groupe.add(reponse);
  abonnes.set(utilisateurId, groupe);
}

export function retirerTempsReel(utilisateurId: string, reponse: Response) {
  const groupe = abonnes.get(utilisateurId);
  if (!groupe) return;
  groupe.delete(reponse);
  if (groupe.size === 0) abonnes.delete(utilisateurId);
}

export function emettreTempsReel(
  utilisateurId: string | null | undefined,
  type: TypeEvenementTempsReel,
  extra: Record<string, unknown> = {},
) {
  if (!utilisateurId) return;
  const groupe = abonnes.get(utilisateurId);
  if (!groupe || groupe.size === 0) return;

  const charge = `event: ${type}\ndata: ${JSON.stringify({ type, ...extra, date: new Date().toISOString() })}\n\n`;
  for (const reponse of groupe) {
    try {
      reponse.write(charge);
    } catch {
      groupe.delete(reponse);
    }
  }
}

export function emettreTempsReelPlusieurs(
  ids: Array<string | null | undefined>,
  type: TypeEvenementTempsReel,
  extra: Record<string, unknown> = {},
) {
  const uniques = new Set(ids.filter((id): id is string => Boolean(id)));
  for (const id of uniques) {
    emettreTempsReel(id, type, extra);
  }
}
