export interface Utilisateur {
  id: string;
  prenom: string;
  nom: string;
  nomComplet: string;
  email?: string;
  telephone?: string | null;
  role: string;
  photoProfil: string | null;
  nomSociete?: string | null;
  adresse?: string | null;
  ville?: string | null;
  estInvite?: boolean;
}

export interface BadgesNavigation {
  nombreArticlesPanier: number;
  messagesNonLus: number;
  notificationsNonLues: number;
}

export interface Categorie {
  id: string;
  nom: string;
  slug: string;
  icone: string;
  description?: string | null;
  nombreProduits: number;
}

export interface Produit {
  id: string;
  nom: string;
  description?: string | null;
  prix: number;
  image: string | null;
  images?: string[];
  sku: string;
  quantiteStock?: number;
  populaire?: boolean;
  nomCategorie?: string;
  slugCategorie?: string;
}

export interface MediaProduit {
  type: "IMAGE" | "VIDEO";
  url: string;
  urlCouverture?: string;
}

export interface CaracteristiqueProduit {
  libelle: string;
  valeur: string;
}

export interface DetailProduit extends Produit {
  images: string[];
  medias?: MediaProduit[];
  caracteristiques: CaracteristiqueProduit[];
  produitsSimilaires: Produit[];
}

export interface PaiementResume {
  mode: string;
  libelleMode: string;
  statut: string;
  libelleStatut: string;
  montant?: number;
  datePaiement?: string | null;
  reference?: string | null;
  libelleLivraison?: string;
}

export interface LigneCommande {
  id: string;
  nomProduit: string;
  image: string | null;
  sku?: string;
  numeroLot?: string | null;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface DetailCommande extends CommandeResume {
  dateMaj?: string;
  notes?: string | null;
  client?: {
    nomComplet: string;
    prenom: string;
    nom: string;
    email?: string;
    telephone?: string | null;
    photoProfil?: string | null;
    nomSociete?: string | null;
  };
  entrepot?: EntrepotResume | null;
  lignes: LigneCommande[];
}

export interface CommandeResume {
  id: string;
  numeroCommande: string;
  montantTotal: number;
  statut: string;
  libelleStatut?: string;
  dateCommande: string;
  nombreArticles?: number;
  nombreProduits?: number;
  image?: string | null;
  paiement?: PaiementResume;
}

export interface EntrepotResume {
  nom: string;
  adresse: string;
  ville: string;
  telephone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  heures?: string | null;
}

export interface ArticlePanier {
  id: string;
  produitId: string;
  nomProduit: string;
  sku: string;
  image: string | null;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  nomCategorie?: string;
  slugCategorie?: string;
  quantiteStock?: number;
  numeroLot?: string | null;
}

export interface Panier {
  articles: ArticlePanier[];
  montantTotal: number;
  nombreArticles: number;
  entrepot?: EntrepotResume | null;
}

export interface FicheProduitMessage {
  produitId: string;
  nom: string;
  prix: number;
  image: string | null;
  sku: string;
}

export interface ReponseMessage {
  id: string;
  contenu: string;
  nomAuteur: string;
}

export interface FichierConversation {
  id: string;
  url: string | null;
  nom: string;
  taille: number;
  typeMessage: string;
  epingle: boolean;
  dateEnvoi: string;
}

export interface CommandeDiscussion {
  id: string;
  numeroCommande: string;
  montantTotal: number;
  dateCommande: string;
  statut: string;
  lignes: Array<{
    nom: string;
    image: string | null;
    sku: string;
    prix: number;
    quantite: number;
  }>;
}

export interface MessageChat {
  id: string;
  contenu: string;
  typeMessage: string;
  fichierUrl?: string | null;
  fichierNom?: string | null;
  fichierTaille?: number | null;
  lu?: boolean;
  epingle?: boolean;
  supprime?: boolean;
  reponseA?: ReponseMessage | null;
  dateEnvoi: string;
  dateModification?: string | null;
  estMoi: boolean;
  nomAuteur: string;
  roleAuteur?: string;
  initialsAuteur?: string;
  ficheProduit?: FicheProduitMessage;
}

export interface ClientDiscussion {
  id: string;
  nomComplet: string;
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string | null;
  ville?: string | null;
  nomSociete?: string | null;
  photoProfil?: string | null;
  initials?: string;
  numeroClient?: string | null;
  role?: string;
}

export interface NotificationClient {
  id: string;
  titre: string;
  contenu: string;
  typeNotif: string;
  lue: boolean;
  lien: string | null;
  dateCreation: string;
}

export interface TableauDeBord {
  utilisateur: Utilisateur | null;
  statistiques: {
    nombreCommandes: number;
    nombreEnAttente: number;
    nombreValidees: number;
    nombrePayees?: number;
  };
  categories: Categorie[];
  produitsPopulaires: Produit[];
  dernieresCommandes: CommandeResume[];
  badges: BadgesNavigation;
}

export interface CommandeAdmin {
  id: string;
  clientId?: string;
  numeroCommande: string;
  montantTotal: number;
  statut: string;
  libelleStatut: string;
  dateCommande: string;
  nomClient: string;
  numeroClient?: string | null;
  nombreArticles?: number;
  image?: string | null;
  montantPaye?: number;
  resteAPayer?: number;
  datePaiement?: string;
  paiement?: {
    mode: string;
    libelleMode: string;
    statut: string;
    libelleStatut: string;
  } | null;
}

export interface TableauAdmin {
  statistiques: {
    commandesAujourdhui: number;
    clientsTotal: number;
    messagesNonLus: number;
    chiffreAffaires: number;
  };
  commandesRecentes: CommandeAdmin[];
  messages: Array<{
    conversationId: string;
    nomClient: string;
    photoProfil: string | null;
    extrait: string;
    date: string;
    nonLus: number;
  }>;
  ventes: Array<{ date: string; libelle: string; montant: number }>;
  activites: Array<{ id: string; type: string; titre: string; detail: string; date: string }>;
  repartition: { total: number; enAttente: number; validees: number; annulees: number };
  badges: { commandesAujourdhui: number; messagesNonLus: number; facturesEnAttente?: number };
}

export interface ConversationAdmin {
  id: string;
  clientId: string;
  nomClient: string;
  photoProfil: string | null;
  numeroCommande: string | null;
  extrait: string;
  date: string;
  nonLus: number;
}

export interface ClientAdmin {
  id: string;
  prenom?: string;
  nom?: string;
  nomComplet: string;
  email: string;
  telephone: string | null;
  nomSociete: string | null;
  adresse?: string | null;
  ville: string | null;
  photoProfil: string | null;
  dateCreation: string;
  nombreCommandes?: number;
  nombreConversations?: number;
  initials?: string;
  numeroDossier?: string;
  numeroClient?: string | null;
  fiche?: Record<string, unknown> | null;
  statutFacture?: "A_FACTURER" | "AVANCE" | "SOLDEE";
  montantPaye?: number;
  resteAPayer?: number;
}

export interface FactureAvanceAdmin {
  id: string;
  numeroCommande: string;
  montantTotal: number;
  montantPaye: number;
  resteAPayer: number;
  statutPaiement: string;
  modeFacture: string;
}

export interface FacturationAdmin {
  id: string;
  clientId: string;
  numeroCommande: string;
  numeroRecu?: string | null;
  nomClient: string;
  numeroClient?: string | null;
  nombreArticles: number;
  montantTotal: number;
  montantPaye: number;
  resteAPayer: number;
  modeFacture: string;
  statutPaiement: string;
  libelleStatut: string;
  dateCommande: string;
}

export interface FactureAttenteAdmin {
  id: string;
  clientId: string;
  numeroCommande: string;
  nomClient: string;
  provenance: string;
  nombreArticles: number;
  montantTotal: number;
  montantPaye: number;
  resteAPayer: number;
  statutPaiement: string;
  libelleStatut: string;
  modeFacture?: string;
  dateCommande: string;
}

export interface ProduitAdmin {
  id: string;
  nom: string;
  sku: string;
  prix: number;
  image: string | null;
  quantiteStock: number;
  disponible: boolean;
  nomCategorie: string;
}
