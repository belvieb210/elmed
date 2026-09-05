import type { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { environnement } from "../config/environnement";
import { baseDeDonnees } from "../config/baseDeDonnees";

export interface RequeteAuthentifiee extends Request {
  utilisateurId?: string;
  roleUtilisateur?: string;
}

interface ChargeUtileJwt {
  utilisateurId: string;
  roleUtilisateur: string;
}

export async function middlewareAuthentification(
  requete: RequeteAuthentifiee,
  reponse: Response,
  suivant: NextFunction,
) {
  const enTete = requete.headers.authorization;
  const jetonBearer = enTete?.startsWith("Bearer ") ? enTete.slice(7) : undefined;
  const jetonCookie = requete.cookies?.mm_jeton as string | undefined;
  const jeton = jetonBearer || jetonCookie;

  if (!jeton) {
    reponse.status(401).json({ succes: false, message: "Authentification requise." });
    return;
  }

  try {
    const charge = jwt.verify(jeton, environnement.jwtSecret) as ChargeUtileJwt;
    const utilisateur = await baseDeDonnees.utilisateur.findUnique({
      where: { id: charge.utilisateurId },
    });

    if (!utilisateur || !utilisateur.actif) {
      reponse.status(401).json({ succes: false, message: "Compte introuvable ou inactif." });
      return;
    }

    requete.utilisateurId = utilisateur.id;
    requete.roleUtilisateur = utilisateur.role;
    suivant();
  } catch {
    reponse.status(401).json({ succes: false, message: "Jeton invalide ou expiré." });
  }
}

export function creerJeton(utilisateurId: string, roleUtilisateur: string) {
  return jwt.sign({ utilisateurId, roleUtilisateur }, environnement.jwtSecret, {
    expiresIn: environnement.jwtExpiration as SignOptions["expiresIn"],
  });
}
