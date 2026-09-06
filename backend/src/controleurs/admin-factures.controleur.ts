import type { Response } from "express";
import { ModeFacture, ModePaiement, Prisma, StatutPaiement, TypeDocument, TypeFacture } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { genererProformaPdf } from "../documents/generer-proforma";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { emettreTempsReel } from "../temps-reel/diffuseur";
import { identifiantRoute } from "../utils/identifiant";
import { libelleModePaiement, libelleStatutPaiement } from "./commandes.controleur";

const modesFacture = [
  "CASH",
  "AVANCE",
  "SOLDE",
  "PRISE_EN_CHARGE",
  "ABONNE",
  "CONVENTIONNE",
] as const;

const schemaClient = z.object({
  prenom: z.string().trim().min(1, "Le prénom est requis."),
  nom: z.string().trim().min(1, "Le nom est requis."),
  email: z.string().trim().email("Email invalide.").optional().or(z.literal("")),
  telephone: z.string().trim().optional(),
  nomSociete: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  ville: z.string().trim().optional(),
  fiche: z.record(z.string(), z.unknown()).optional(),
  photoProfil: z.string().optional(),
});

const schemaFacture = z.object({
  clientId: z.string().uuid(),
  commandeId: z.string().uuid().optional(),
  lignes: z
    .array(
      z.object({
        produitId: z.string().uuid(),
        quantite: z.number().int().positive(),
        prixUnitaire: z.number().nonnegative().optional(),
      }),
    )
    .min(1, "Ajoutez au moins un produit."),
  modeFacture: z.enum(modesFacture),
  typeFacture: z.enum(["STANDARD", "GROS"]),
  modePaiement: z.nativeEnum(ModePaiement),
  remise: z.number().min(0).default(0),
  fraisDivers: z.number().min(0).default(0),
  montantPaye: z.number().min(0),
  numeroRecu: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  monnaie: z.string().trim().default("USD"),
  valider: z.boolean().default(false),
  transferer: z.boolean().default(false),
});

function nomClient(utilisateur: {
  prenom: string;
  nom: string;
  nomSociete: string | null;
  estInvite?: boolean;
}) {
  if (utilisateur.estInvite) return "Client invité";
  return utilisateur.nomSociete || `${utilisateur.prenom} ${utilisateur.nom}`.trim();
}

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function numeroDossier(id: string, numeroClient?: string | null) {
  return numeroClient || `CLT-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

async function genererNumeroClient() {
  const maintenant = new Date();
  const prefixe = `${maintenant.getFullYear()}${String(maintenant.getMonth() + 1).padStart(2, "0")}${String(maintenant.getDate()).padStart(2, "0")}`;
  const total = await baseDeDonnees.utilisateur.count({
    where: { role: "CLIENT", numeroClient: { startsWith: prefixe } },
  });
  return `${prefixe}${String(total + 1).padStart(3, "0")}`;
}

async function genererNumeroCommande() {
  const annee = new Date().getFullYear();
  const total = await baseDeDonnees.commande.count();
  return `CMD-${annee}-${String(total + 1).padStart(5, "0")}`;
}

function genererNumeroRecu() {
  const maintenant = new Date();
  const suite = randomBytes(3).toString("hex").toUpperCase();
  return `REC${maintenant.getFullYear()}${String(maintenant.getMonth() + 1).padStart(2, "0")}${suite}`;
}

function arrondi(montant: number) {
  return Math.round(montant * 100) / 100;
}

function statutDepuisMontants(total: number, paye: number, modeFacture: string, valider: boolean) {
  if (paye <= 0 && !valider) return StatutPaiement.EN_ATTENTE;
  if (paye + 0.009 >= total) return StatutPaiement.PAYE;
  if (paye > 0) return StatutPaiement.PARTIEL;
  if (modeFacture === "PRISE_EN_CHARGE" || modeFacture === "CONVENTIONNE" || modeFacture === "ABONNE") {
    return valider ? StatutPaiement.EN_ATTENTE : StatutPaiement.EN_ATTENTE;
  }
  return valider ? StatutPaiement.EN_ATTENTE : StatutPaiement.EN_ATTENTE;
}

function formaterClient(client: {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  nomSociete: string | null;
  adresse: string | null;
  ville: string | null;
  photoProfil: string | null;
  dateCreation: Date;
  estInvite: boolean;
  numeroClient?: string | null;
  ficheClient?: unknown;
}) {
  return {
    id: client.id,
    prenom: client.prenom,
    nom: client.nom,
    nomComplet: `${client.prenom} ${client.nom}`.trim(),
    email: client.email,
    telephone: client.telephone,
    nomSociete: client.nomSociete,
    adresse: client.adresse,
    ville: client.ville,
    photoProfil: client.photoProfil,
    dateCreation: client.dateCreation,
    initials: initials(client.prenom, client.nom),
    numeroDossier: numeroDossier(client.id, client.numeroClient),
    numeroClient: client.numeroClient ?? null,
    fiche: client.ficheClient ?? null,
  };
}

function montantPayeCommande(paiements: Array<{ montant: { toString(): string }; statut: string }>) {
  return arrondi(
    paiements
      .filter((paiement) => paiement.statut === "PAYE" || paiement.statut === "PARTIEL")
      .reduce((somme, paiement) => somme + Number(paiement.montant), 0),
  );
}

export async function creerClientAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaClient.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données client invalides.",
    });
    return;
  }

  const donnees = analyse.data;
  const numeroClient = await genererNumeroClient();
  const email = donnees.email?.trim() || `client.${numeroClient}@clients.elmed.local`;
  const existant = await baseDeDonnees.utilisateur.findUnique({ where: { email } });
  if (existant && !existant.estInvite) {
    reponse.status(409).json({ succes: false, message: "Un client existe déjà avec cet email." });
    return;
  }

  const motDePasseTemporaire = `Mm${randomBytes(4).toString("hex")}9`;
  const hash = await bcrypt.hash(motDePasseTemporaire, 12);
  const payload = {
    prenom: donnees.prenom,
    nom: donnees.nom,
    email,
    telephone: donnees.telephone || null,
    nomSociete: donnees.nomSociete || null,
    adresse: donnees.adresse || null,
    ville: donnees.ville || null,
    photoProfil: donnees.photoProfil || null,
    numeroClient,
    ficheClient: (donnees.fiche as Prisma.InputJsonValue | undefined) ?? undefined,
    motDePasse: hash,
    role: "CLIENT" as const,
    estInvite: false,
  };

  const client = existant?.estInvite
    ? await baseDeDonnees.utilisateur.update({ where: { id: existant.id }, data: payload })
    : await baseDeDonnees.utilisateur.create({ data: payload });

  reponse.json({
    succes: true,
    client: formaterClient(client),
    motDePasseTemporaire,
  });
}

export async function mettreAJourClientAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaClient.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données client invalides.",
    });
    return;
  }

  const client = await baseDeDonnees.utilisateur.findFirst({
    where: { id: identifiantRoute(requete.params.id), role: "CLIENT" },
  });
  if (!client) {
    reponse.status(404).json({ succes: false, message: "Client introuvable." });
    return;
  }

  const donnees = analyse.data;
  const email = donnees.email?.trim() || client.email;
  const autre = await baseDeDonnees.utilisateur.findFirst({
    where: { email, id: { not: client.id }, estInvite: false },
  });
  if (autre) {
    reponse.status(409).json({ succes: false, message: "Un autre client utilise déjà cet email." });
    return;
  }

  const misAJour = await baseDeDonnees.utilisateur.update({
    where: { id: client.id },
    data: {
      prenom: donnees.prenom,
      nom: donnees.nom,
      email,
      telephone: donnees.telephone || null,
      nomSociete: donnees.nomSociete || null,
      adresse: donnees.adresse || null,
      ville: donnees.ville || null,
      photoProfil: donnees.photoProfil || client.photoProfil,
      ficheClient: (donnees.fiche as Prisma.InputJsonValue | undefined) ?? client.ficheClient ?? undefined,
    },
  });

  reponse.json({ succes: true, client: formaterClient(misAJour) });
}

export async function obtenirClientAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const client = await baseDeDonnees.utilisateur.findFirst({
    where: { id: identifiantRoute(requete.params.id), role: "CLIENT", estInvite: false },
    include: {
      commandes: {
        include: { paiements: true, lignes: true },
        orderBy: { dateCommande: "desc" },
        take: 20,
      },
    },
  });

  if (!client) {
    reponse.status(404).json({ succes: false, message: "Client introuvable." });
    return;
  }

  const commandes = client.commandes.map((commande) => {
    const paye = montantPayeCommande(commande.paiements);
    const total = Number(commande.montantTotal);
    return {
      id: commande.id,
      numeroCommande: commande.numeroCommande,
      montantTotal: total,
      montantPaye: paye,
      resteAPayer: arrondi(Math.max(0, total - paye)),
      statut: commande.statut,
      statutPaiement: commande.paiements[0]?.statut ?? "EN_ATTENTE",
      modeFacture: commande.modeFacture,
      dateCommande: commande.dateCommande,
      nombreArticles: commande.lignes.reduce((somme, ligne) => somme + ligne.quantite, 0),
    };
  });

  const factureAvance =
    commandes.find(
      (commande) =>
        commande.resteAPayer > 0 &&
        (commande.modeFacture === "AVANCE" || commande.statutPaiement === "PARTIEL"),
    ) ?? null;

  reponse.json({
    succes: true,
    client: formaterClient(client),
    commandes,
    factureAvance,
    peutSolde: Boolean(factureAvance),
  });
}

export async function listerFacturesEnAttente(_requete: RequeteAuthentifiee, reponse: Response) {
  const commandes = await baseDeDonnees.commande.findMany({
    where: { statut: { notIn: ["ANNULEE", "REFUSEE"] } },
    include: {
      client: true,
      lignes: true,
      paiements: { orderBy: { datePaiement: "desc" } },
    },
    orderBy: { dateCommande: "desc" },
    take: 80,
  });

  const factures = commandes
    .map((commande) => {
      const paye = montantPayeCommande(commande.paiements);
      const total = Number(commande.montantTotal);
      const reste = arrondi(Math.max(0, total - paye));
      const estPayee = reste <= 0.009;
      const estAvance =
        reste > 0.009 &&
        (commande.modeFacture === "AVANCE" || commande.paiements.some((paiement) => paiement.statut === "PARTIEL"));
      const estAdminAFacturer = Boolean(commande.numeroRecu) && reste > 0.009 && !estAvance;
      if (estPayee || (!estAvance && !estAdminAFacturer)) return null;
      return {
        id: commande.id,
        clientId: commande.clientId,
        numeroCommande: commande.numeroCommande,
        nomClient: nomClient(commande.client),
        provenance: commande.numeroRecu ? "Administration" : "Boutique",
        nombreArticles: commande.lignes.reduce((somme, ligne) => somme + ligne.quantite, 0),
        montantTotal: total,
        montantPaye: paye,
        resteAPayer: reste,
        statutPaiement: estAvance ? "PARTIEL" : "EN_ATTENTE",
        modeFacture: commande.modeFacture,
        libelleStatut: estAvance ? "Avance à solder" : "À facturer",
        dateCommande: commande.dateCommande,
      };
    })
    .filter((facture) => facture !== null);

  const dejaListes = [...new Set(factures.map((facture) => facture.clientId))];
  const clientsSansFacture = await baseDeDonnees.utilisateur.findMany({
    where: {
      role: "CLIENT",
      estInvite: false,
      ...(dejaListes.length > 0 ? { id: { notIn: dejaListes } } : {}),
      commandes: {
        none: {
          statut: { notIn: ["ANNULEE", "REFUSEE"] },
          OR: [
            { numeroRecu: { not: null } },
            { modeFacture: "AVANCE" },
            { paiements: { some: { statut: "PARTIEL" } } },
          ],
        },
      },
    },
    orderBy: { dateCreation: "desc" },
    take: 40,
  });

  reponse.json({
    succes: true,
    factures: [
      ...clientsSansFacture.map((client) => ({
        id: "",
        clientId: client.id,
        numeroCommande: "",
        nomClient: nomClient(client),
        provenance: "Administration",
        nombreArticles: 0,
        montantTotal: 0,
        montantPaye: 0,
        resteAPayer: 0,
        statutPaiement: "EN_ATTENTE",
        modeFacture: "CASH",
        libelleStatut: "À facturer",
        dateCommande: client.dateCreation,
      })),
      ...factures,
    ],
  });
}

export async function obtenirFactureAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const commande = await baseDeDonnees.commande.findUnique({
    where: { id: identifiantRoute(requete.params.id) },
    include: {
      client: true,
      lignes: { include: { produit: true } },
      paiements: { orderBy: { datePaiement: "desc" } },
    },
  });

  if (!commande) {
    reponse.status(404).json({ succes: false, message: "Facture introuvable." });
    return;
  }

  const paye = montantPayeCommande(commande.paiements);
  reponse.json({
    succes: true,
    facture: {
      id: commande.id,
      numeroCommande: commande.numeroCommande,
      clientId: commande.clientId,
      client: formaterClient(commande.client),
      lignes: commande.lignes.map((ligne) => ({
        produitId: ligne.produitId,
        nom: ligne.produit.nom,
        sku: ligne.produit.sku,
        quantite: ligne.quantite,
        prixUnitaire: Number(ligne.prixUnitaire),
      })),
      modeFacture: commande.modeFacture,
      typeFacture: commande.typeFacture,
      remise: Number(commande.remise),
      fraisDivers: Number(commande.fraisDivers),
      numeroRecu: commande.numeroRecu,
      monnaie: commande.monnaie,
      notes: commande.notes,
      montantTotal: Number(commande.montantTotal),
      montantPaye: paye,
      resteAPayer: arrondi(Math.max(0, Number(commande.montantTotal) - paye)),
      modePaiement: commande.paiements[0]?.modePaiement ?? "ESPECES",
      statutPaiement: commande.paiements[0]?.statut ?? "EN_ATTENTE",
    },
  });
}

export async function enregistrerFactureAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaFacture.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Facture invalide.",
    });
    return;
  }

  const donnees = analyse.data;
  const client = await baseDeDonnees.utilisateur.findFirst({
    where: { id: donnees.clientId, role: "CLIENT" },
  });
  if (!client) {
    reponse.status(404).json({ succes: false, message: "Client introuvable." });
    return;
  }

  const produits = await baseDeDonnees.produit.findMany({
    where: { id: { in: donnees.lignes.map((ligne) => ligne.produitId) } },
  });
  if (produits.length !== donnees.lignes.length) {
    reponse.status(400).json({ succes: false, message: "Un produit est introuvable." });
    return;
  }

  const lignes = donnees.lignes.map((ligne) => {
    const produit = produits.find((item) => item.id === ligne.produitId)!;
    const prixUnitaire = arrondi(ligne.prixUnitaire ?? Number(produit.prix));
    return {
      produitId: produit.id,
      quantite: ligne.quantite,
      prixUnitaire,
      sousTotal: arrondi(prixUnitaire * ligne.quantite),
    };
  });

  let commandeCibleId = donnees.commandeId;
  if (donnees.modeFacture === "SOLDE") {
    const avance = commandeCibleId
      ? await baseDeDonnees.commande.findFirst({
          where: { id: commandeCibleId, clientId: client.id },
          include: { paiements: true },
        })
      : await baseDeDonnees.commande.findFirst({
          where: {
            clientId: client.id,
            statut: { notIn: ["ANNULEE", "REFUSEE"] },
            OR: [{ modeFacture: "AVANCE" }, { paiements: { some: { statut: "PARTIEL" } } }],
          },
          include: { paiements: true },
          orderBy: { dateCommande: "desc" },
        });
    const payeAvance = avance ? montantPayeCommande(avance.paiements) : 0;
    const resteAvance = avance ? arrondi(Math.max(0, Number(avance.montantTotal) - payeAvance)) : 0;
    if (!avance || resteAvance <= 0) {
      reponse.status(400).json({
        succes: false,
        message: "Aucune facture d'avance à solder pour ce client.",
      });
      return;
    }
    commandeCibleId = avance.id;
  }

  const totalProduits = arrondi(lignes.reduce((somme, ligne) => somme + ligne.sousTotal, 0));
  const total = arrondi(Math.max(0, totalProduits - donnees.remise + donnees.fraisDivers));
  const montantPaye = arrondi(Math.min(donnees.montantPaye, total));
  const statutPaiement = statutDepuisMontants(total, montantPaye, donnees.modeFacture, donnees.valider);
  const notes = [donnees.notes, donnees.transferer ? "Transfert après paiement demandé." : null]
    .filter(Boolean)
    .join(" ");

  const commande = await baseDeDonnees.$transaction(async (transaction) => {
    let cible = commandeCibleId
      ? await transaction.commande.findFirst({
          where: { id: commandeCibleId, clientId: client.id },
          include: { paiements: true },
        })
      : null;

    if (cible) {
      await transaction.ligneCommande.deleteMany({ where: { commandeId: cible.id } });
      await transaction.ligneCommande.createMany({
        data: lignes.map((ligne) => ({
          commandeId: cible!.id,
          produitId: ligne.produitId,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
        })),
      });
      cible = await transaction.commande.update({
        where: { id: cible.id },
        data: {
          montantTotal: total,
          notes: notes || null,
          modeFacture: donnees.modeFacture as ModeFacture,
          typeFacture: donnees.typeFacture as TypeFacture,
          remise: donnees.remise,
          fraisDivers: donnees.fraisDivers,
          numeroRecu: donnees.numeroRecu || cible.numeroRecu || genererNumeroRecu(),
          monnaie: donnees.monnaie,
          statut: statutPaiement === "PAYE" ? "VALIDEE" : cible.statut === "VALIDEE" ? "VALIDEE" : "EN_ATTENTE",
        },
        include: { paiements: true },
      });
    } else {
      cible = await transaction.commande.create({
        data: {
          numeroCommande: await genererNumeroCommande(),
          clientId: client.id,
          statut: statutPaiement === "PAYE" ? "VALIDEE" : "EN_ATTENTE",
          montantTotal: total,
          notes: notes || null,
          modeFacture: donnees.modeFacture as ModeFacture,
          typeFacture: donnees.typeFacture as TypeFacture,
          remise: donnees.remise,
          fraisDivers: donnees.fraisDivers,
          numeroRecu: donnees.numeroRecu || genererNumeroRecu(),
          monnaie: donnees.monnaie,
          lignes: {
            create: lignes.map((ligne) => ({
              produitId: ligne.produitId,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
            })),
          },
        },
        include: { paiements: true },
      });
    }

    const dejaPaye = montantPayeCommande(cible.paiements);
    const aEncaisser = arrondi(Math.max(0, montantPaye - dejaPaye));
    if (aEncaisser > 0 || (statutPaiement === "PAYE" && cible.paiements.length === 0)) {
      await transaction.paiement.create({
        data: {
          commandeId: cible.id,
          montant: aEncaisser || montantPaye || total,
          modePaiement: donnees.modePaiement,
          statut: statutPaiement,
          reference: cible.numeroRecu,
        },
      });
    } else if (cible.paiements[0] && donnees.valider) {
      await transaction.paiement.update({
        where: { id: cible.paiements[0].id },
        data: {
          modePaiement: donnees.modePaiement,
          statut: statutPaiement,
          montant: montantPaye || Number(cible.paiements[0].montant),
          reference: cible.numeroRecu,
          datePaiement: new Date(),
        },
      });
    }

    const documentExistant = await transaction.document.findFirst({
      where: { commandeId: cible.id, typeDocument: TypeDocument.FACTURE },
    });
    if (!documentExistant) {
      await transaction.document.create({
        data: {
          commandeId: cible.id,
          typeDocument: TypeDocument.FACTURE,
          numeroDocument: `FAC-${cible.numeroCommande}`,
        },
      });
    }

    const dejaPayee = cible.paiements.some((paiement) => paiement.statut === "PAYE");
    if (donnees.valider && statutPaiement === "PAYE" && !dejaPayee) {
      for (const ligne of lignes) {
        await transaction.produit.update({
          where: { id: ligne.produitId },
          data: { quantiteStock: { decrement: ligne.quantite } },
        });
      }
    }

    await transaction.notification.create({
      data: {
        utilisateurId: client.id,
        titre: statutPaiement === "PAYE" ? "Facture encaissée" : "Facture établie",
        contenu:
          statutPaiement === "PAYE"
            ? `La facture ${cible.numeroCommande} a été encaissée.`
            : `Une facture ${cible.numeroCommande} a été établie pour votre compte.`,
        typeNotif: "FACTURE",
        lien: `/commandes/${cible.id}`,
      },
    });

    return cible;
  });

  emettreTempsReel(client.id, "commande", { commandeId: commande.id });
  emettreTempsReel(client.id, "notification");

  reponse.json({
    succes: true,
    commandeId: commande.id,
    numeroCommande: commande.numeroCommande,
    numeroRecu: commande.numeroRecu,
    montantTotal: Number(commande.montantTotal),
  });
}

export async function telechargerFactureAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const commande = await baseDeDonnees.commande.findUnique({
    where: { id: identifiantRoute(requete.params.id) },
    include: {
      client: true,
      lignes: { include: { produit: true } },
      paiements: { orderBy: { datePaiement: "desc" } },
    },
  });

  if (!commande) {
    reponse.status(404).json({ succes: false, message: "Facture introuvable." });
    return;
  }

  const type = requete.query.type === "proforma" ? "PROFORMA" : "FACTURE";
  const dateTexte = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(commande.dateCommande)
    .replace(/^(\d+\s)([a-z])/, (_tout, prefixe: string, lettre: string) => `${prefixe}${lettre.toUpperCase()}`);

  const paiement = commande.paiements[0];
  const montantPaye = montantPayeCommande(commande.paiements);
  const montantTotal = Number(commande.montantTotal);
  const pdf = await genererProformaPdf({
    numero: commande.numeroRecu || commande.numeroCommande,
    dateTexte,
    nomClient: nomClient(commande.client),
    titreDocument: type,
    statutPaiement: paiement?.statut,
    libellePaiement: paiement ? libelleStatutPaiement(paiement.statut) : "En attente",
    libelleModePaiement: paiement ? libelleModePaiement(paiement.modePaiement) : undefined,
    lignes: commande.lignes.map((ligne) => ({
      quantite: ligne.quantite,
      designation: ligne.produit.nom,
      prixUnitaire: Number(ligne.prixUnitaire),
      prixTotal: Number(ligne.prixUnitaire) * ligne.quantite,
    })),
    montantTotal,
    montantPaye,
    resteAPayer: arrondi(Math.max(0, montantTotal - montantPaye)),
  });

  reponse.setHeader("Content-Type", "application/pdf");
  reponse.setHeader(
    "Content-Disposition",
    `inline; filename="${type.toLowerCase()}-ELMED-${commande.numeroCommande}.pdf"`,
  );
  reponse.send(pdf);
}
