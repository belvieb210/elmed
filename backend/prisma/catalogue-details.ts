export interface MediaCatalogue {
  url: string;
  typeMedia: "IMAGE" | "VIDEO";
  urlCouverture?: string;
}

export interface DetailCatalogue {
  sku: string;
  images: string[];
  video?: { url: string; urlCouverture: string };
  caracteristiques: { libelle: string; valeur: string }[];
}

export const detailsCatalogue: DetailCatalogue[] = [
  {
    sku: "REA-PCR-COVID-01",
    images: [
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1581093458791-9f3c3250a8b4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "Type", valeur: "Kit PCR SARS-CoV-2" },
      { libelle: "Application", valeur: "Diagnostic laboratoire" },
      { libelle: "Certification", valeur: "CE / IVDR" },
      { libelle: "Conservation", valeur: "2 à 8 °C" },
      { libelle: "Durée de conservation", valeur: "18 mois" },
      { libelle: "Emballage", valeur: "Kit 96 tests" },
      { libelle: "Origine", valeur: "Europe" },
      { libelle: "Unité de vente", valeur: "Boîte" },
    ],
  },
  {
    sku: "EQP-MICRO-OPT-01",
    images: [
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1581093458791-9d42e3c7e933?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "Classification", valeur: "Classe I" },
      { libelle: "Type", valeur: "Microscope binoculaire" },
      { libelle: "Grossissement", valeur: "40x à 1000x" },
      { libelle: "Alimentation", valeur: "LED / 220V" },
      { libelle: "Garantie", valeur: "24 mois" },
      { libelle: "Marque", valeur: "MateMedical Lab" },
      { libelle: "Emballage", valeur: "1 unité / carton" },
      { libelle: "Poids brut", valeur: "4,8 kg" },
    ],
  },
  {
    sku: "CON-GANT-NIT-100",
    images: [
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1615461066845-74c71866c387?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=1200&q=80",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "Matière", valeur: "Nitrile non poudré" },
      { libelle: "Taille", valeur: "M" },
      { libelle: "Certification", valeur: "CE / EN 455" },
      { libelle: "Usage", valeur: "Examen médical" },
      { libelle: "Emballage", valeur: "100 pièces / boîte" },
      { libelle: "Couleur", valeur: "Bleu" },
      { libelle: "Stockage", valeur: "Température ambiante" },
      { libelle: "MOQ", valeur: "1 boîte" },
    ],
  },
  {
    sku: "CON-SER-5ML-100",
    images: [
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1581594693701-94186056480c?auto=format&fit=crop&w=1200&q=80",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "Volume", valeur: "5 ml" },
      { libelle: "Type", valeur: "Seringue stérile à usage unique" },
      { libelle: "Certification", valeur: "CE / ISO 7886" },
      { libelle: "Emballage", valeur: "100 pièces / boîte" },
      { libelle: "Aiguille", valeur: "Incluse" },
      { libelle: "Matériau", valeur: "Polypropylène médical" },
      { libelle: "Stockage", valeur: "Température ambiante" },
      { libelle: "MOQ", valeur: "1 boîte" },
    ],
  },
  {
    sku: "REA-PALU-AG-01",
    images: [
      "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "Type", valeur: "TDR paludisme antigène" },
      { libelle: "Application", valeur: "Diagnostic rapide" },
      { libelle: "Certification", valeur: "CE / OMS" },
      { libelle: "Résultat", valeur: "15 à 20 minutes" },
      { libelle: "Conservation", valeur: "2 à 30 °C" },
      { libelle: "Emballage", valeur: "25 tests / kit" },
      { libelle: "Durée de conservation", valeur: "24 mois" },
      { libelle: "MOQ", valeur: "1 kit" },
    ],
  },
  {
    sku: "MED-PARA-500",
    images: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=70",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "DCI", valeur: "Paracétamol 500 mg" },
      { libelle: "Forme", valeur: "Comprimé" },
      { libelle: "Application", valeur: "Antalgique / antipyrétique" },
      { libelle: "Emballage", valeur: "20 comprimés / boîte" },
      { libelle: "Conservation", valeur: "Température ambiante" },
      { libelle: "Durée de conservation", valeur: "36 mois" },
      { libelle: "Origine", valeur: "Laboratoire partenaire" },
      { libelle: "MOQ", valeur: "1 boîte" },
    ],
  },
  {
    sku: "SEC-MASQ-N95",
    images: [
      "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584039730049-101c810a3570?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=1200&q=80",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "Norme", valeur: "N95 / FFP2" },
      { libelle: "Certification", valeur: "CE / NIOSH" },
      { libelle: "Usage", valeur: "Protection respiratoire" },
      { libelle: "Emballage", valeur: "20 masques / boîte" },
      { libelle: "Filtration", valeur: "≥ 95 %" },
      { libelle: "Public", valeur: "Personnel soignant" },
      { libelle: "Stockage", valeur: "Sec, à l'abri du soleil" },
      { libelle: "MOQ", valeur: "1 boîte" },
    ],
  },
  {
    sku: "AUT-THER-DIG",
    images: [
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1559757175-5700ddebf490?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
    ],
    video: {
      url: "/medias/presentation-produit.mp4",
      urlCouverture: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    },
    caracteristiques: [
      { libelle: "Type", valeur: "Thermomètre digital" },
      { libelle: "Mesure", valeur: "Orale / axillaire" },
      { libelle: "Alimentation", valeur: "Pile bouton" },
      { libelle: "Précision", valeur: "± 0,1 °C" },
      { libelle: "Certification", valeur: "CE" },
      { libelle: "Emballage", valeur: "1 unité / blister" },
      { libelle: "Garantie", valeur: "12 mois" },
      { libelle: "MOQ", valeur: "1 pièce" },
    ],
  },
];

export function mediasDuCatalogue(detail: DetailCatalogue): MediaCatalogue[] {
  const images: MediaCatalogue[] = detail.images.map((url) => ({
    url,
    typeMedia: "IMAGE",
  }));
  if (!detail.video) return images;
  return [
    {
      url: detail.video.url,
      typeMedia: "VIDEO",
      urlCouverture: detail.video.urlCouverture,
    },
    ...images,
  ];
}
