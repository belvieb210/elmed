import { Router } from "express";
import { middlewareAuthentification } from "../middlewares/authentification";
import {
  changerMotDePasse,
  connecterClient,
  deconnecterClient,
  mettreAJourProfil,
  obtenirProfil,
} from "../controleurs/authentification.controleur";
import { limiteConnexion } from "../middlewares/securite";
import { obtenirTableauDeBord } from "../controleurs/accueil.controleur";
import { listerCategories, listerProduits, obtenirProduit } from "../controleurs/produits.controleur";
import {
  ajouterAuPanier,
  modifierQuantitePanier,
  obtenirPanier,
  retirerDuPanier,
} from "../controleurs/panier.controleur";
import {
  creerCommandeDepuisPanier,
  listerCommandes,
  obtenirCommande,
} from "../controleurs/commandes.controleur";
import { envoyerMessage, obtenirConversation } from "../controleurs/messages.controleur";
import {
  listerNotifications,
  marquerNotificationLue,
  marquerToutesLues,
} from "../controleurs/notifications.controleur";

export const routeurPrincipal = Router();

routeurPrincipal.get("/sante", (_requete, reponse) => {
  reponse.json({ succes: true, service: "MateMedical API", statut: "ok" });
});

routeurPrincipal.post("/connexion", limiteConnexion, connecterClient);
routeurPrincipal.post("/deconnexion", deconnecterClient);
routeurPrincipal.get("/produits", listerProduits);
routeurPrincipal.get("/produits/:id", obtenirProduit);
routeurPrincipal.get("/categories", listerCategories);

routeurPrincipal.use(middlewareAuthentification);

routeurPrincipal.get("/profil", obtenirProfil);
routeurPrincipal.put("/profil", mettreAJourProfil);
routeurPrincipal.put("/profil/mot-de-passe", changerMotDePasse);
routeurPrincipal.get("/accueil", obtenirTableauDeBord);

routeurPrincipal.get("/panier", obtenirPanier);
routeurPrincipal.post("/panier", ajouterAuPanier);
routeurPrincipal.patch("/panier/:id", modifierQuantitePanier);
routeurPrincipal.delete("/panier/:id", retirerDuPanier);

routeurPrincipal.get("/commandes", listerCommandes);
routeurPrincipal.get("/commandes/:id", obtenirCommande);
routeurPrincipal.post("/commandes", creerCommandeDepuisPanier);

routeurPrincipal.get("/messagerie", obtenirConversation);
routeurPrincipal.post("/messagerie", envoyerMessage);

routeurPrincipal.get("/notifications", listerNotifications);
routeurPrincipal.patch("/notifications/toutes", marquerToutesLues);
routeurPrincipal.patch("/notifications/:id", marquerNotificationLue);
