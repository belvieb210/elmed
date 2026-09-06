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

export interface MessageChat {
  id: string;
  contenu: string;
  typeMessage: string;
  fichierUrl?: string | null;
  lu?: boolean;
  dateEnvoi: string;
  estMoi: boolean;
  nomAuteur: string;
  ficheProduit?: FicheProduitMessage;
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
