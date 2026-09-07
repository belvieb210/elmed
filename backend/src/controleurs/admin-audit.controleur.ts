import type { Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

export async function listerJournalAudit(requete: RequeteAuthentifiee, reponse: Response) {
  const limite = Math.min(200, Math.max(1, Number(requete.query.limite) || 80));
  const page = Math.max(1, Number(requete.query.page) || 1);
  const action = String(requete.query.action ?? "").trim();
  const recherche = String(requete.query.recherche ?? "").trim();

  const where = {
    ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
    ...(recherche
      ? {
          OR: [
            { details: { contains: recherche, mode: "insensitive" as const } },
            { action: { contains: recherche, mode: "insensitive" as const } },
            { tableCible: { contains: recherche, mode: "insensitive" as const } },
            {
              utilisateur: {
                OR: [
                  { prenom: { contains: recherche, mode: "insensitive" as const } },
                  { nom: { contains: recherche, mode: "insensitive" as const } },
                  { email: { contains: recherche, mode: "insensitive" as const } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [total, entrees] = await Promise.all([
    baseDeDonnees.journalAudit.count({ where }),
    baseDeDonnees.journalAudit.findMany({
      where,
      include: {
        utilisateur: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            email: true,
            role: true,
            photoProfil: true,
          },
        },
      },
      orderBy: { dateAction: "desc" },
      skip: (page - 1) * limite,
      take: limite,
    }),
  ]);

  reponse.json({
    succes: true,
    total,
    page,
    limite,
    pages: Math.max(1, Math.ceil(total / limite)),
    entrees: entrees.map((entree) => ({
      id: entree.id,
      action: entree.action,
      tableCible: entree.tableCible,
      details: entree.details,
      adresseIp: entree.adresseIp,
      dateAction: entree.dateAction,
      auteur: entree.utilisateur
        ? {
            id: entree.utilisateur.id,
            nomComplet: `${entree.utilisateur.prenom} ${entree.utilisateur.nom}`,
            email: entree.utilisateur.email,
            role: entree.utilisateur.role,
            photoProfil: entree.utilisateur.photoProfil,
          }
        : null,
    })),
  });
}
