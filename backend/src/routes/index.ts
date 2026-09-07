import { Router } from "express";
import { assurerClientOuInvite } from "../authentification/invite";
import {
  middlewareAuthentificationSouple,
  middlewareCompteReel,
  middlewarePersonnel,
  middlewareSuperAdmin,
  middlewareAdminOuSuper,
} from "../middlewares/authentification";
import {
  listerClientsAdmin,
  listerCommandesAdmin,
  listerDocumentsAdmin,
  mettreAJourStatutCommande,
  obtenirBadgesAdmin,
  obtenirCommandeAdmin,
  obtenirTableauAdmin,
} from "../controleurs/admin.controleur";
import {
  creerClientAdmin,
  enregistrerFactureAdmin,
  mettreAJourClientAdmin,
  listerFacturationsAdmin,
  listerFacturesEnAttente,
  obtenirClientAdmin,
  obtenirFactureAdmin,
  telechargerFactureAdmin,
  telechargerFacturesGroupeesAdmin,
} from "../controleurs/admin-factures.controleur";
import {
  creerProduitAdmin,
  listerProduitsAdminComplet,
  mettreAJourProduitAdmin,
  obtenirProduitAdmin,
  supprimerProduitAdmin,
} from "../controleurs/admin-produits.controleur";
import {
  creerPersonnelAdmin,
  desactiverPersonnelAdmin,
  listerPersonnelAdmin,
  mettreAJourPersonnelAdmin,
  reinitialiserMotDePassePersonnel,
} from "../controleurs/admin-utilisateurs.controleur";
import {
  obtenirEntrepriseAdmin,
  obtenirEntreprisePublique,
  mettreAJourEntrepriseAdmin,
} from "../controleurs/admin-parametres.controleur";
import {
  agirSurMessageAdmin,
  listerConversationsAdmin,
  obtenirConversationAdmin,
  repondreConversationAdmin,
} from "../controleurs/admin-messagerie.controleur";
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
import { agirSurMessageClient, envoyerMessage, obtenirConversation } from "../controleurs/messages.controleur";
import {
  listerNotifications,
  marquerNotificationLue,
  marquerToutesLues,
} from "../controleurs/notifications.controleur";

export const routeurPrincipal = Router();

const sessionInvite = [middlewareAuthentificationSouple, assurerClientOuInvite];
const compteClient = [middlewareAuthentificationSouple, middlewareCompteReel];
const espaceAdmin = [middlewareAuthentificationSouple, middlewarePersonnel];
const espaceSuperAdmin = [...espaceAdmin, middlewareSuperAdmin];
const espaceAdminOuSuper = [...espaceAdmin, middlewareAdminOuSuper];

routeurPrincipal.get("/sante", (_requete, reponse) => {
  reponse.json({ succes: true, service: "MateMedical API", statut: "ok" });
});

routeurPrincipal.post("/connexion", limiteConnexion, connecterClient);
routeurPrincipal.post("/inscription", limiteConnexion, inscrireClient);
routeurPrincipal.post("/deconnexion", deconnecterClient);
routeurPrincipal.get("/produits", listerProduits);
routeurPrincipal.get("/produits/:id", obtenirProduit);
routeurPrincipal.get("/categories", listerCategories);
routeurPrincipal.get("/entreprise", obtenirEntreprisePublique);
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
routeurPrincipal.patch("/messagerie/messages/:id", ...sessionInvite, agirSurMessageClient);

routeurPrincipal.get("/notifications", ...compteClient, listerNotifications);
routeurPrincipal.patch("/notifications/toutes", ...compteClient, marquerToutesLues);
routeurPrincipal.patch("/notifications/:id", ...compteClient, marquerNotificationLue);

routeurPrincipal.get("/admin/badges", ...espaceAdmin, obtenirBadgesAdmin);
routeurPrincipal.get("/admin/tableau", ...espaceAdmin, obtenirTableauAdmin);
routeurPrincipal.get("/admin/commandes", ...espaceAdmin, listerCommandesAdmin);
routeurPrincipal.get("/admin/commandes/:id", ...espaceAdmin, obtenirCommandeAdmin);
routeurPrincipal.patch("/admin/commandes/:id", ...espaceAdmin, mettreAJourStatutCommande);
routeurPrincipal.get("/admin/clients", ...espaceAdmin, listerClientsAdmin);
routeurPrincipal.post("/admin/clients", ...espaceAdmin, creerClientAdmin);
routeurPrincipal.put("/admin/clients/:id", ...espaceAdmin, mettreAJourClientAdmin);
routeurPrincipal.get("/admin/clients/:id", ...espaceAdmin, obtenirClientAdmin);
routeurPrincipal.get("/admin/factures/attente", ...espaceAdmin, listerFacturesEnAttente);
routeurPrincipal.get("/admin/factures/groupees/pdf", ...espaceAdmin, telechargerFacturesGroupeesAdmin);
routeurPrincipal.get("/admin/facturations", ...espaceAdmin, listerFacturationsAdmin);
routeurPrincipal.get("/admin/factures/:id", ...espaceAdmin, obtenirFactureAdmin);
routeurPrincipal.get("/admin/factures/:id/pdf", ...espaceAdmin, telechargerFactureAdmin);
routeurPrincipal.post("/admin/factures", ...espaceAdmin, enregistrerFactureAdmin);
routeurPrincipal.get("/admin/conversations", ...espaceAdmin, listerConversationsAdmin);
routeurPrincipal.patch("/admin/conversations/:id/messages/:messageId", ...espaceAdmin, agirSurMessageAdmin);
routeurPrincipal.get("/admin/conversations/:id", ...espaceAdmin, obtenirConversationAdmin);
routeurPrincipal.post("/admin/conversations/:id", ...espaceAdmin, repondreConversationAdmin);
routeurPrincipal.get("/admin/documents", ...espaceAdmin, listerDocumentsAdmin);
routeurPrincipal.get("/admin/utilisateurs", ...espaceAdmin, listerPersonnelAdmin);
routeurPrincipal.post("/admin/utilisateurs", ...espaceAdminOuSuper, creerPersonnelAdmin);
routeurPrincipal.put("/admin/utilisateurs/:id", ...espaceAdminOuSuper, mettreAJourPersonnelAdmin);
routeurPrincipal.post(
  "/admin/utilisateurs/:id/mot-de-passe",
  ...espaceAdminOuSuper,
  reinitialiserMotDePassePersonnel,
);
routeurPrincipal.patch("/admin/utilisateurs/:id/actif", ...espaceAdminOuSuper, desactiverPersonnelAdmin);
routeurPrincipal.get("/admin/parametres/entreprise", ...espaceAdmin, obtenirEntrepriseAdmin);
routeurPrincipal.put("/admin/parametres/entreprise", ...espaceAdminOuSuper, mettreAJourEntrepriseAdmin);
routeurPrincipal.get("/admin/produits", ...espaceAdmin, listerProduitsAdminComplet);
routeurPrincipal.post("/admin/produits", ...espaceAdmin, creerProduitAdmin);
routeurPrincipal.get("/admin/produits/:id", ...espaceAdmin, obtenirProduitAdmin);
routeurPrincipal.put("/admin/produits/:id", ...espaceSuperAdmin, mettreAJourProduitAdmin);
routeurPrincipal.delete("/admin/produits/:id", ...espaceSuperAdmin, supprimerProduitAdmin);
