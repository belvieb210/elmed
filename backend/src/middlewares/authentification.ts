import type { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { environnement } from "../config/environnement";
import { baseDeDonnees } from "../config/baseDeDonnees";

export interface RequeteAuthentifiee extends Request {
  utilisateurId?: string;
  roleUtilisateur?: string;
  estInvite?: boolean;
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
    requete.estInvite = utilisateur.estInvite;
    suivant();
  } catch {
    reponse.status(401).json({ succes: false, message: "Jeton invalide ou expiré." });
  }
}

export async function middlewareAuthentificationSouple(
  requete: RequeteAuthentifiee,
  _reponse: Response,
  suivant: NextFunction,
) {
  const enTete = requete.headers.authorization;
  const jetonBearer = enTete?.startsWith("Bearer ") ? enTete.slice(7) : undefined;
  const jetonCookie = requete.cookies?.mm_jeton as string | undefined;
  const jeton = jetonBearer || jetonCookie;
  if (!jeton) {
    suivant();
    return;
  }

  try {
    const charge = jwt.verify(jeton, environnement.jwtSecret) as ChargeUtileJwt;
    const utilisateur = await baseDeDonnees.utilisateur.findUnique({
      where: { id: charge.utilisateurId },
    });
    if (utilisateur?.actif) {
      requete.utilisateurId = utilisateur.id;
      requete.roleUtilisateur = utilisateur.role;
      requete.estInvite = utilisateur.estInvite;
    }
  } catch {
    /* visiteur sans session */
  }
  suivant();
}

const rolesPersonnel = new Set([
  "SUPER_ADMIN",
  "DIRECTEUR",
  "COMMERCIAL",
  "COMPTABLE",
  "MAGASINIER",
  "SUPPORT",
  "LIVREUR",
]);

export function estRolePersonnel(role?: string) {
  return Boolean(role && rolesPersonnel.has(role));
}

export function middlewareCompteReel(
  requete: RequeteAuthentifiee,
  reponse: Response,
  suivant: NextFunction,
) {
  if (!requete.utilisateurId || requete.estInvite) {
    reponse.status(403).json({
      succes: false,
      message: "Un compte client est requis pour accéder à cet espace.",
    });
    return;
  }
  suivant();
}

export function middlewarePersonnel(
  requete: RequeteAuthentifiee,
  reponse: Response,
  suivant: NextFunction,
) {
  if (!requete.utilisateurId || requete.estInvite || !estRolePersonnel(requete.roleUtilisateur)) {
    reponse.status(403).json({
      succes: false,
      message: "Accès réservé à l'équipe MateMedical.",
    });
    return;
  }
  suivant();
}

export function creerJeton(utilisateurId: string, roleUtilisateur: string) {
  return jwt.sign({ utilisateurId, roleUtilisateur }, environnement.jwtSecret, {
    expiresIn: environnement.jwtExpiration as SignOptions["expiresIn"],
  });
}
