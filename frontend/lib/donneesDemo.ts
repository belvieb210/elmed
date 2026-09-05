import type { TableauDeBord } from "@/types/modeles";

export const tableauDeBordDemo: TableauDeBord = {
  utilisateur: {
    id: "demo-client",
    prenom: "Jean",
    nom: "Victor",
    nomComplet: "Jean Victor",
    role: "CLIENT",
    photoProfil:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80",
  },
  statistiques: {
    nombreCommandes: 8,
    nombreEnAttente: 3,
    nombreValidees: 5,
  },
  categories: [
    { id: "1", nom: "Réactifs de labo", slug: "reactifs-de-labo", icone: "flask", nombreProduits: 125 },
    { id: "2", nom: "Equipements", slug: "equipements", icone: "microscope", nombreProduits: 88 },
    { id: "3", nom: "Consommables", slug: "consommables", icone: "package", nombreProduits: 74 },
    { id: "4", nom: "Médicaments", slug: "medicaments", icone: "pill", nombreProduits: 64 },
    { id: "5", nom: "Sécurité", slug: "securite", icone: "shield", nombreProduits: 42 },
    { id: "6", nom: "Autres", slug: "autres", icone: "layers", nombreProduits: 36 },
  ],
  produitsPopulaires: [
    {
      id: "p1",
      nom: "Réactif PCR COVID-19",
      prix: 150000,
      image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
      sku: "REA-PCR-COVID-01",
    },
    {
      id: "p2",
      nom: "Microscope optique",
      prix: 450000,
      image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80",
      sku: "EQP-MICRO-OPT-01",
    },
    {
      id: "p3",
      nom: "Gants en nitrile (Boîte de 100)",
      prix: 8000,
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
      sku: "CON-GANT-NIT-100",
    },
    {
      id: "p4",
      nom: "Seringue stérile (5ml / Boîte de 100)",
      prix: 4500,
      image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80",
      sku: "CON-SER-5ML-100",
    },
  ],
  dernieresCommandes: [
    {
      id: "c1",
      numeroCommande: "CMD-125",
      montantTotal: 172500,
      statut: "EN_ATTENTE",
      dateCommande: "2024-05-18T09:00:00.000Z",
    },
    {
      id: "c2",
      numeroCommande: "CMD-118",
      montantTotal: 450000,
      statut: "VALIDEE",
      dateCommande: "2024-05-12T10:30:00.000Z",
    },
    {
      id: "c3",
      numeroCommande: "CMD-110",
      montantTotal: 24500,
      statut: "EN_ATTENTE",
      dateCommande: "2024-05-08T14:15:00.000Z",
    },
    {
      id: "c4",
      numeroCommande: "CMD-098",
      montantTotal: 35000,
      statut: "VALIDEE",
      dateCommande: "2024-04-28T08:40:00.000Z",
    },
  ],
  badges: {
    nombreArticlesPanier: 3,
    messagesNonLus: 2,
    notificationsNonLues: 4,
  },
};
