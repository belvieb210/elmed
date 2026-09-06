import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import { environnement } from "../config/environnement";

export const limiteGenerale = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { succes: false, message: "Trop de requêtes. Réessayez plus tard." },
});

export const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { succes: false, message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
});

export const limitePaiement = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { succes: false, message: "Trop de tentatives de paiement. Réessayez plus tard." },
});

export function refuserMethodesInconnues(requete: Request, reponse: Response, suivant: NextFunction) {
  const methodes = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
  if (!methodes.includes(requete.method)) {
    reponse.status(405).json({ succes: false, message: "Méthode HTTP non autorisée." });
    return;
  }
  suivant();
}

export function verifierOrigine(requete: Request, reponse: Response, suivant: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(requete.method)) {
    suivant();
    return;
  }

  const origine = requete.headers.origin;
  if (!origine) {
    suivant();
    return;
  }

  if (origine === environnement.urlFrontend) {
    suivant();
    return;
  }

  reponse.status(403).json({ succes: false, message: "Origine non autorisée." });
}
