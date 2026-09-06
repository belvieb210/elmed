import { Router } from "express";
import { assurerClientOuInvite } from "../authentification/invite";
import { middlewareAuthentificationSouple, middlewareCompteReel } from "../middlewares/authentification";
import {
  changerMotDePasse,
  connecterClient,
  deconnecterClient,
  inscrireClient,
  mettreAJourProfil,
  obtenirProfil,
} from "../controleurs/authentification.controleur";
import { limiteConnexion, limitePaiement } from "../middlewares/securite";
import { obtenirTableauDeBord } from "../controleurs/accueil.controleur";
import { listerCategories, listerProduits, obtenirProduit } from "../controleurs/produits.controleur";
import {
  ajouterAuPanier,
  modifierQuantitePanier,
  obtenirPanier,
  retirerDuPanier,
  telechargerProformaPanier,
  viderPanier,
} from "../controleurs/panier.controleur";
import {
  creerCommandeDepuisPanier,
  listerCommandes,
  obtenirCommande,
  telechargerFactureCommande,
} from "../controleurs/commandes.controleur";
import { confirmerPaiementEnLigne, obtenirConfigurationPaiement } from "../controleurs/paiements.controleur";
import { envoyerMessage, obtenirConversation } from "../controleurs/messages.controleur";
import {
  listerNotifications,
  marquerNotificationLue,
  marquerToutesLues,
} from "../controleurs/notifications.controleur";

export const routeurPrincipal = Router();

const sessionInvite = [middlewareAuthentificationSouple, assurerClientOuInvite];
const compteClient = [middlewareAuthentificationSouple, middlewareCompteReel];

routeurPrincipal.get("/sante", (_requete, reponse) => {
  reponse.json({ succes: true, service: "MateMedical API", statut: "ok" });
});

routeurPrincipal.post("/connexion", limiteConnexion, connecterClient);
routeurPrincipal.post("/inscription", limiteConnexion, inscrireClient);
routeurPrincipal.post("/deconnexion", deconnecterClient);
routeurPrincipal.get("/produits", listerProduits);
routeurPrincipal.get("/produits/:id", obtenirProduit);
routeurPrincipal.get("/categories", listerCategories);
routeurPrincipal.get("/accueil", middlewareAuthentificationSouple, obtenirTableauDeBord);

routeurPrincipal.get("/panier", ...sessionInvite, obtenirPanier);
routeurPrincipal.get("/panier/proforma", ...sessionInvite, telechargerProformaPanier);
routeurPrincipal.post("/panier", ...sessionInvite, ajouterAuPanier);
routeurPrincipal.patch("/panier/:id", ...sessionInvite, modifierQuantitePanier);
routeurPrincipal.delete("/panier", ...sessionInvite, viderPanier);
routeurPrincipal.delete("/panier/:id", ...sessionInvite, retirerDuPanier);

routeurPrincipal.get("/commandes", ...compteClient, listerCommandes);
routeurPrincipal.get("/commandes/:id/facture", ...sessionInvite, telechargerFactureCommande);
routeurPrincipal.get("/commandes/:id", ...sessionInvite, obtenirCommande);
routeurPrincipal.post("/commandes", ...sessionInvite, creerCommandeDepuisPanier);

routeurPrincipal.get("/paiements/configuration", ...sessionInvite, obtenirConfigurationPaiement);
routeurPrincipal.post("/paiements/confirmer", ...sessionInvite, limitePaiement, confirmerPaiementEnLigne);

routeurPrincipal.get("/profil", ...compteClient, obtenirProfil);
routeurPrincipal.put("/profil", ...compteClient, mettreAJourProfil);
routeurPrincipal.put("/profil/mot-de-passe", ...compteClient, changerMotDePasse);

routeurPrincipal.get("/messagerie", ...sessionInvite, obtenirConversation);
routeurPrincipal.post("/messagerie", ...sessionInvite, envoyerMessage);

routeurPrincipal.get("/notifications", ...compteClient, listerNotifications);
routeurPrincipal.patch("/notifications/toutes", ...compteClient, marquerToutesLues);
routeurPrincipal.patch("/notifications/:id", ...compteClient, marquerNotificationLue);
