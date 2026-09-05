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
  sku: string;
  quantiteStock?: number;
  populaire?: boolean;
  nomCategorie?: string;
  slugCategorie?: string;
}

export interface CommandeResume {
  id: string;
  numeroCommande: string;
  montantTotal: number;
  statut: string;
  libelleStatut?: string;
  dateCommande: string;
  nombreArticles?: number;
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
}

export interface Panier {
  articles: ArticlePanier[];
  montantTotal: number;
  nombreArticles: number;
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
  };
  categories: Categorie[];
  produitsPopulaires: Produit[];
  dernieresCommandes: CommandeResume[];
  badges: BadgesNavigation;
}
