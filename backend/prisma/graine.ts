import path from "path";
import dotenv from "dotenv";
import { PrismaClient, RoleUtilisateur, StatutCommande, TypeMediaProduit, TypeNotification } from "@prisma/client";
import bcrypt from "bcryptjs";
import { detailsCatalogue, mediasDuCatalogue } from "./catalogue-details";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function remplir() {
  const motDePasseClientBrut = process.env.MOT_DE_PASSE_COMPTE_CLIENT;
  const motDePasseAdminBrut = process.env.MOT_DE_PASSE_COMPTE_ADMIN;
  if (!motDePasseClientBrut || !motDePasseAdminBrut) {
    throw new Error("MOT_DE_PASSE_COMPTE_CLIENT et MOT_DE_PASSE_COMPTE_ADMIN sont requis dans backend/.env");
  }
  const motDePasseClient = await bcrypt.hash(motDePasseClientBrut, 12);
  const motDePasseAdmin = await bcrypt.hash(motDePasseAdminBrut, 12);

  await prisma.lignePanier.deleteMany();
  await prisma.ligneCommande.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.paiement.deleteMany();
  await prisma.commande.deleteMany();
  await prisma.lotProduit.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.entrepot.deleteMany();
  await prisma.journalAudit.deleteMany();
  await prisma.utilisateur.deleteMany();

  const client = await prisma.utilisateur.create({
    data: {
      prenom: "Jean",
      nom: "Victor",
      email: "jean.victor@matemedical.cd",
      telephone: "+243 810 000 001",
      motDePasse: motDePasseClient,
      role: RoleUtilisateur.CLIENT,
      photoProfil:
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80",
      nomSociete: "Clinique Saint-Luc Kinshasa",
      adresse: "Avenue de la Justice",
      ville: "Kinshasa",
    },
  });

  const support = await prisma.utilisateur.create({
    data: {
      prenom: "Grace",
      nom: "Mbala",
      email: "support@matemedical.cd",
      telephone: "+243 890 000 100",
      motDePasse: motDePasseAdmin,
      role: RoleUtilisateur.SUPPORT,
      photoProfil: "/avatars/support.jpg",
    },
  });

  await prisma.utilisateur.create({
    data: {
      prenom: "Patrick",
      nom: "Kalala",
      email: "admin@matemedical.cd",
      telephone: "+243 890 000 200",
      motDePasse: motDePasseAdmin,
      role: RoleUtilisateur.SUPER_ADMIN,
    },
  });

  const categories = await Promise.all([
    prisma.categorie.create({
      data: {
        nom: "Réactifs de labo",
        slug: "reactifs-de-labo",
        icone: "flask",
        description: "Tests, réactifs PCR et diagnostics",
        ordre: 1,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: "Equipements",
        slug: "equipements",
        icone: "microscope",
        description: "Matériel de laboratoire et hôpital",
        ordre: 2,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: "Consommables",
        slug: "consommables",
        icone: "package",
        description: "Gants, seringues, consommables stériles",
        ordre: 3,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: "Médicaments",
        slug: "medicaments",
        icone: "pill",
        description: "Produits pharmaceutiques",
        ordre: 4,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: "Sécurité",
        slug: "securite",
        icone: "shield",
        description: "Protection du personnel soignant",
        ordre: 5,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: "Autres",
        slug: "autres",
        icone: "layers",
        description: "Autres fournitures médicales",
        ordre: 6,
      },
    }),
  ]);

  const [reactifs, equipements, consommables, medicaments, securite, autres] = categories;

  const produits = await Promise.all([
    prisma.produit.create({
      data: {
        sku: "REA-PCR-COVID-01",
        nom: "Réactif PCR COVID-19",
        description: "Kit de détection PCR SARS-CoV-2 pour laboratoire.",
        prix: 150000,
        image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80",
        populaire: true,
        quantiteStock: 40,
        categorieId: reactifs.id,
      },
    }),
    prisma.produit.create({
      data: {
        sku: "EQP-MICRO-OPT-01",
        nom: "Microscope optique",
        description: "Microscope binoculaire pour analyses de routine.",
        prix: 450000,
        image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80",
        populaire: true,
        quantiteStock: 12,
        categorieId: equipements.id,
      },
    }),
    prisma.produit.create({
      data: {
        sku: "CON-GANT-NIT-100",
        nom: "Gants en nitrile (Boîte de 100)",
        description: "Gants nitrile non poudrés, taille M.",
        prix: 8000,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
        populaire: true,
        quantiteStock: 220,
        categorieId: consommables.id,
      },
    }),
    prisma.produit.create({
      data: {
        sku: "CON-SER-5ML-100",
        nom: "Seringue stérile (5ml / Boîte de 100)",
        description: "Seringues stériles 5 ml avec aiguille.",
        prix: 4500,
        image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80",
        populaire: true,
        quantiteStock: 300,
        categorieId: consommables.id,
      },
    }),
    prisma.produit.create({
      data: {
        sku: "REA-PALU-AG-01",
        nom: "Test paludisme Ag",
        description: "Test rapide paludisme antigène.",
        prix: 35000,
        image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80",
        populaire: false,
        quantiteStock: 80,
        categorieId: reactifs.id,
      },
    }),
    prisma.produit.create({
      data: {
        sku: "MED-PARA-500",
        nom: "Paracétamol 500mg (Boîte)",
        description: "Antalgique et antipyrétique.",
        prix: 6500,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
        populaire: false,
        quantiteStock: 150,
        categorieId: medicaments.id,
      },
    }),
    prisma.produit.create({
      data: {
        sku: "SEC-MASQ-N95",
        nom: "Masque N95 (Boîte de 20)",
        description: "Protection respiratoire FFP2 / N95.",
        prix: 18000,
        image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=600&q=80",
        populaire: false,
        quantiteStock: 90,
        categorieId: securite.id,
      },
    }),
    prisma.produit.create({
      data: {
        sku: "AUT-THER-DIG",
        nom: "Thermomètre digital",
        description: "Thermomètre médical digital.",
        prix: 12000,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
        populaire: false,
        quantiteStock: 60,
        categorieId: autres.id,
      },
    }),
  ]);

  const [pcr, microscope, gants, seringues] = produits;

  await prisma.entrepot.create({
    data: {
      nom: "Entrepôt Central Kinshasa",
      adresse: "Avenue des Poids Lourds",
      ville: "Kinshasa",
      telephone: "+243 890 111 000",
      latitude: -4.3276,
      longitude: 15.3136,
      heures: "08h00 - 17h00",
    },
  });

  const commandesGraine = [
    {
      numeroCommande: "CMD-125",
      montantTotal: 172500,
      statut: StatutCommande.EN_ATTENTE,
      dateCommande: new Date("2024-05-18T09:00:00.000Z"),
      lignes: [
        { produitId: pcr.id, quantite: 1, prixUnitaire: 150000 },
        { produitId: gants.id, quantite: 1, prixUnitaire: 8000 },
        { produitId: seringues.id, quantite: 1, prixUnitaire: 4500 },
        { produitId: produits[6].id, quantite: 1, prixUnitaire: 18000 },
      ],
    },
    {
      numeroCommande: "CMD-118",
      montantTotal: 450000,
      statut: StatutCommande.VALIDEE,
      dateCommande: new Date("2024-05-12T10:30:00.000Z"),
      lignes: [{ produitId: microscope.id, quantite: 1, prixUnitaire: 450000 }],
    },
    {
      numeroCommande: "CMD-110",
      montantTotal: 24500,
      statut: StatutCommande.EN_ATTENTE,
      dateCommande: new Date("2024-05-08T14:15:00.000Z"),
      lignes: [
        { produitId: gants.id, quantite: 2, prixUnitaire: 8000 },
        { produitId: seringues.id, quantite: 1, prixUnitaire: 4500 },
        { produitId: produits[7].id, quantite: 1, prixUnitaire: 12000 },
      ],
    },
    {
      numeroCommande: "CMD-098",
      montantTotal: 35000,
      statut: StatutCommande.VALIDEE,
      dateCommande: new Date("2024-04-28T08:40:00.000Z"),
      lignes: [{ produitId: produits[4].id, quantite: 1, prixUnitaire: 35000 }],
    },
    {
      numeroCommande: "CMD-090",
      montantTotal: 8000,
      statut: StatutCommande.EN_ATTENTE,
      dateCommande: new Date("2024-04-20T16:00:00.000Z"),
      lignes: [{ produitId: gants.id, quantite: 1, prixUnitaire: 8000 }],
    },
    {
      numeroCommande: "CMD-084",
      montantTotal: 18000,
      statut: StatutCommande.VALIDEE,
      dateCommande: new Date("2024-04-11T11:20:00.000Z"),
      lignes: [{ produitId: produits[6].id, quantite: 1, prixUnitaire: 18000 }],
    },
    {
      numeroCommande: "CMD-076",
      montantTotal: 6500,
      statut: StatutCommande.VALIDEE,
      dateCommande: new Date("2024-04-02T09:50:00.000Z"),
      lignes: [{ produitId: produits[5].id, quantite: 1, prixUnitaire: 6500 }],
    },
    {
      numeroCommande: "CMD-061",
      montantTotal: 150000,
      statut: StatutCommande.VALIDEE,
      dateCommande: new Date("2024-03-18T13:10:00.000Z"),
      lignes: [{ produitId: pcr.id, quantite: 1, prixUnitaire: 150000 }],
    },
  ];

  for (const commande of commandesGraine) {
    await prisma.commande.create({
      data: {
        numeroCommande: commande.numeroCommande,
        clientId: client.id,
        statut: commande.statut,
        montantTotal: commande.montantTotal,
        dateCommande: commande.dateCommande,
        lignes: { create: commande.lignes },
      },
    });
  }

  await prisma.lignePanier.createMany({
    data: [
      { clientId: client.id, produitId: gants.id, quantite: 1 },
      { clientId: client.id, produitId: seringues.id, quantite: 1 },
      { clientId: client.id, produitId: pcr.id, quantite: 1 },
    ],
  });

  const conversation = await prisma.conversation.create({
    data: { clientId: client.id },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        auteurId: support.id,
        contenu: "Bonjour Jean Victor, votre commande CMD-118 a été validée.",
        lu: false,
      },
      {
        conversationId: conversation.id,
        auteurId: support.id,
        contenu: "Le microscope optique est prêt. Souhaitez-vous un retrait à Kinshasa ?",
        lu: false,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        utilisateurId: client.id,
        titre: "Commande validée",
        contenu: "Votre commande CMD-118 a été validée.",
        typeNotif: TypeNotification.COMMANDE,
        lue: false,
        lien: "/commandes",
      },
      {
        utilisateurId: client.id,
        titre: "Nouveau message",
        contenu: "MateMedical vous a envoyé un message.",
        typeNotif: TypeNotification.MESSAGE,
        lue: false,
        lien: "/messagerie",
      },
      {
        utilisateurId: client.id,
        titre: "Facture disponible",
        contenu: "La facture de CMD-098 est disponible.",
        typeNotif: TypeNotification.FACTURE,
        lue: false,
        lien: "/commandes",
      },
      {
        utilisateurId: client.id,
        titre: "Produit de nouveau en stock",
        contenu: "Le réactif PCR COVID-19 est de nouveau disponible.",
        typeNotif: TypeNotification.STOCK,
        lue: false,
        lien: "/produits",
      },
    ],
  });

  for (const detail of detailsCatalogue) {
    const produit = produits.find((item) => item.sku === detail.sku);
    if (!produit) continue;
    await prisma.imageProduit.createMany({
      data: mediasDuCatalogue(detail).map((media, ordre) => ({
        produitId: produit.id,
        url: media.url,
        urlCouverture: media.urlCouverture ?? null,
        typeMedia: media.typeMedia === "VIDEO" ? TypeMediaProduit.VIDEO : TypeMediaProduit.IMAGE,
        ordre,
      })),
    });
    await prisma.caracteristiqueProduit.createMany({
      data: detail.caracteristiques.map((caracteristique, ordre) => ({
        produitId: produit.id,
        libelle: caracteristique.libelle,
        valeur: caracteristique.valeur,
        ordre,
      })),
    });
  }

  console.log("Base MateMedical remplie.");
  console.log("Comptes créés : jean.victor@matemedical.cd et admin@matemedical.cd");
}

remplir()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
