import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

export const limiteGenerale = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (requete) => requete.path.includes("/temps-reel"),
  message: { succes: false, message: "Trop de requêtes. Réessayez plus tard." },
});

export const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { succes: false, message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
});

export function refuserMethodesInconnues(requete: Request, reponse: Response, suivant: NextFunction) {
  const methodes = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
  if (!methodes.includes(requete.method)) {
    reponse.status(405).json({ succes: false, message: "Méthode HTTP non autorisée." });
    return;
  }
  suivant();
}
