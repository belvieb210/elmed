import type { Response } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { emettreTempsReelEquipe } from "../temps-reel/diffuseur";
import { identifiantRoute } from "../utils/identifiant";
import { adresseIpRequete, enregistrerAudit } from "../audit/enregistrer";

const rolesPersonnelAutorises = [
  "SUPER_ADMIN",
  "ADMIN",
  "DIRECTEUR",
  "COMMERCIAL",
  "COMPTABLE",
  "MAGASINIER",
  "SUPPORT",
  "LIVREUR",
] as const;

const schemaPersonnel = z.object({
  prenom: z.string().trim().min(1, "Le prénom est requis."),
  nom: z.string().trim().min(1, "Le nom est requis."),
  email: z.string().trim().email("Email invalide."),
  telephone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(rolesPersonnelAutorises),
  photoProfil: z.string().optional().or(z.literal("")),
  motDePasse: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Za-z]/, "Le mot de passe doit contenir une lettre.")
    .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre.")
    .optional()
    .or(z.literal("")),
  actif: z.boolean().optional(),
});

function formaterPersonnel(utilisateur: {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: string;
  photoProfil: string | null;
  actif: boolean;
  dateCreation: Date;
}) {
  return {
    id: utilisateur.id,
    prenom: utilisateur.prenom,
    nom: utilisateur.nom,
    nomComplet: `${utilisateur.prenom} ${utilisateur.nom}`,
    email: utilisateur.email,
    telephone: utilisateur.telephone,
    role: utilisateur.role,
    photoProfil: utilisateur.photoProfil,
    actif: utilisateur.actif,
    dateCreation: utilisateur.dateCreation,
  };
}

function genererMotDePasseTemporaire() {
  return `Mm${randomBytes(4).toString("hex")}9A`;
}

export async function listerPersonnelAdmin(_requete: RequeteAuthentifiee, reponse: Response) {
  const utilisateurs = await baseDeDonnees.utilisateur.findMany({
    where: {
      estInvite: false,
      role: { not: "CLIENT" },
    },
    orderBy: [{ role: "asc" }, { nom: "asc" }],
  });

  reponse.json({
    succes: true,
    utilisateurs: utilisateurs.map(formaterPersonnel),
  });
}

export async function creerPersonnelAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaPersonnel.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données invalides.",
    });
    return;
  }

  const donnees = analyse.data;
  if (donnees.role === "SUPER_ADMIN" && requete.roleUtilisateur !== "SUPER_ADMIN") {
    reponse.status(403).json({
      succes: false,
      message: "Seul un Super Admin peut créer un autre Super Admin.",
    });
    return;
  }

  const email = donnees.email.toLowerCase();
  const existant = await baseDeDonnees.utilisateur.findUnique({ where: { email } });
  if (existant && !existant.estInvite) {
    reponse.status(409).json({ succes: false, message: "Un compte existe déjà avec cet email." });
    return;
  }

  const motDePasseTemporaire = donnees.motDePasse?.trim() || genererMotDePasseTemporaire();
  const hash = await bcrypt.hash(motDePasseTemporaire, 12);

  const payload = {
    prenom: donnees.prenom,
    nom: donnees.nom,
    email,
    telephone: donnees.telephone?.trim() || null,
    role: donnees.role,
    photoProfil: donnees.photoProfil?.trim() || null,
    motDePasse: hash,
    actif: donnees.actif ?? true,
    estInvite: false,
  };

  const utilisateur = existant?.estInvite
    ? await baseDeDonnees.utilisateur.update({ where: { id: existant.id }, data: payload })
    : await baseDeDonnees.utilisateur.create({ data: payload });

  emettreTempsReelEquipe("client", { utilisateurId: utilisateur.id });

  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: "CREATION_PERSONNEL",
    tableCible: "utilisateurs",
    details: `Personnel créé : ${utilisateur.prenom} ${utilisateur.nom} (${utilisateur.email}) — rôle ${utilisateur.role}`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.status(201).json({
    succes: true,
    utilisateur: formaterPersonnel(utilisateur),
    motDePasseTemporaire,
    message: "Compte personnel créé. Communiquez le mot de passe temporaire — il pourra le changer dans Profil / Paramètres.",
  });
}

export async function mettreAJourPersonnelAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const analyse = schemaPersonnel.omit({ motDePasse: true }).extend({
    actif: z.boolean().optional(),
  }).safeParse(requete.body);

  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données invalides.",
    });
    return;
  }

  const identifiant = identifiantRoute(requete.params.id);
  const utilisateur = await baseDeDonnees.utilisateur.findFirst({
    where: { id: identifiant, estInvite: false, role: { not: "CLIENT" } },
  });
  if (!utilisateur) {
    reponse.status(404).json({ succes: false, message: "Personnel introuvable." });
    return;
  }

  if (analyse.data.role === "SUPER_ADMIN" && requete.roleUtilisateur !== "SUPER_ADMIN") {
    reponse.status(403).json({
      succes: false,
      message: "Seul un Super Admin peut attribuer le rôle Super Admin.",
    });
    return;
  }

  if (utilisateur.id === requete.utilisateurId && analyse.data.role !== utilisateur.role) {
    reponse.status(400).json({ succes: false, message: "Vous ne pouvez pas changer votre propre rôle." });
    return;
  }

  if (utilisateur.role === "SUPER_ADMIN" && analyse.data.role !== "SUPER_ADMIN") {
    const autres = await baseDeDonnees.utilisateur.count({
      where: { role: "SUPER_ADMIN", actif: true, id: { not: utilisateur.id } },
    });
    if (autres === 0) {
      reponse.status(400).json({
        succes: false,
        message: "Impossible de retirer le dernier Super Admin actif.",
      });
      return;
    }
  }

  const email = analyse.data.email.toLowerCase();
  const conflit = await baseDeDonnees.utilisateur.findFirst({
    where: { email, id: { not: identifiant }, estInvite: false },
  });
  if (conflit) {
    reponse.status(409).json({ succes: false, message: "Un autre compte utilise déjà cet email." });
    return;
  }

  try {
    const misAJour = await baseDeDonnees.utilisateur.update({
      where: { id: identifiant },
      data: {
        prenom: analyse.data.prenom,
        nom: analyse.data.nom,
        email,
        telephone: analyse.data.telephone?.trim() || null,
        role: analyse.data.role,
        photoProfil: analyse.data.photoProfil?.trim() || utilisateur.photoProfil,
        actif: analyse.data.actif ?? utilisateur.actif,
      },
    });

    void enregistrerAudit({
      utilisateurId: requete.utilisateurId,
      action: "MODIFICATION_PERSONNEL",
      tableCible: "utilisateurs",
      details: `Personnel modifié : ${misAJour.prenom} ${misAJour.nom} (${misAJour.email}) — rôle ${misAJour.role}`,
      adresseIp: adresseIpRequete(requete),
    });

    reponse.json({ succes: true, utilisateur: formaterPersonnel(misAJour) });
  } catch (erreur) {
    const detail = erreur instanceof Error ? erreur.message : String(erreur);
    reponse.status(500).json({
      succes: false,
      message: detail.includes("ADMIN")
        ? "Le rôle Admin n’est pas encore disponible en base. Attendez la migration puis réessayez."
        : "Mise à jour impossible.",
      detail,
    });
  }
}

export async function reinitialiserMotDePassePersonnel(requete: RequeteAuthentifiee, reponse: Response) {
  const identifiant = identifiantRoute(requete.params.id);
  const utilisateur = await baseDeDonnees.utilisateur.findFirst({
    where: { id: identifiant, estInvite: false, role: { not: "CLIENT" } },
  });
  if (!utilisateur) {
    reponse.status(404).json({ succes: false, message: "Personnel introuvable." });
    return;
  }

  const motDePasseTemporaire = genererMotDePasseTemporaire();
  const hash = await bcrypt.hash(motDePasseTemporaire, 12);
  await baseDeDonnees.utilisateur.update({
    where: { id: identifiant },
    data: { motDePasse: hash },
  });

  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: "REINITIALISATION_MOT_DE_PASSE",
    tableCible: "utilisateurs",
    details: `Mot de passe réinitialisé pour ${utilisateur.prenom} ${utilisateur.nom} (${utilisateur.email})`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.json({
    succes: true,
    motDePasseTemporaire,
    message: "Mot de passe réinitialisé. À communiquer à l’utilisateur pour qu’il le change dans son profil.",
  });
}

export async function desactiverPersonnelAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const identifiant = identifiantRoute(requete.params.id);
  if (identifiant === requete.utilisateurId) {
    reponse.status(400).json({ succes: false, message: "Vous ne pouvez pas désactiver votre propre compte." });
    return;
  }

  const utilisateur = await baseDeDonnees.utilisateur.findFirst({
    where: { id: identifiant, estInvite: false, role: { not: "CLIENT" } },
  });
  if (!utilisateur) {
    reponse.status(404).json({ succes: false, message: "Personnel introuvable." });
    return;
  }

  if (utilisateur.role === "SUPER_ADMIN") {
    const autres = await baseDeDonnees.utilisateur.count({
      where: { role: "SUPER_ADMIN", actif: true, id: { not: utilisateur.id } },
    });
    if (autres === 0) {
      reponse.status(400).json({
        succes: false,
        message: "Impossible de désactiver le dernier Super Admin.",
      });
      return;
    }
  }

  const misAJour = await baseDeDonnees.utilisateur.update({
    where: { id: identifiant },
    data: { actif: !utilisateur.actif },
  });

  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: misAJour.actif ? "ACTIVATION_PERSONNEL" : "DESACTIVATION_PERSONNEL",
    tableCible: "utilisateurs",
    details: `Compte ${misAJour.actif ? "réactivé" : "désactivé"} : ${misAJour.prenom} ${misAJour.nom} (${misAJour.email})`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.json({
    succes: true,
    utilisateur: formaterPersonnel(misAJour),
    message: misAJour.actif ? "Compte réactivé." : "Compte désactivé.",
  });
}

export async function supprimerPersonnelAdmin(requete: RequeteAuthentifiee, reponse: Response) {
  const identifiant = identifiantRoute(requete.params.id);
  if (identifiant === requete.utilisateurId) {
    reponse.status(400).json({
      succes: false,
      message: "Vous ne pouvez pas supprimer votre propre compte.",
    });
    return;
  }

  const utilisateur = await baseDeDonnees.utilisateur.findFirst({
    where: { id: identifiant, estInvite: false, role: { not: "CLIENT" } },
  });
  if (!utilisateur) {
    reponse.status(404).json({ succes: false, message: "Personnel introuvable." });
    return;
  }

  if (utilisateur.role === "SUPER_ADMIN") {
    const autres = await baseDeDonnees.utilisateur.count({
      where: { role: "SUPER_ADMIN", actif: true, id: { not: utilisateur.id } },
    });
    if (autres === 0) {
      reponse.status(400).json({
        succes: false,
        message: "Impossible de supprimer le dernier Super Admin actif.",
      });
      return;
    }
  }

  try {
    await baseDeDonnees.$transaction(async (tx) => {
      await tx.journalAudit.updateMany({
        where: { utilisateurId: identifiant },
        data: { utilisateurId: null },
      });

      const messagesAuteur = await tx.message.findMany({
        where: { auteurId: identifiant },
        select: { id: true },
      });
      const idsMessages = messagesAuteur.map((message) => message.id);
      if (idsMessages.length > 0) {
        await tx.message.updateMany({
          where: { reponseAId: { in: idsMessages } },
          data: { reponseAId: null },
        });
        await tx.message.deleteMany({ where: { id: { in: idsMessages } } });
      }

      await tx.notification.deleteMany({ where: { utilisateurId: identifiant } });
      await tx.lignePanier.deleteMany({ where: { clientId: identifiant } });
      await tx.utilisateur.delete({ where: { id: identifiant } });
    });
  } catch (erreur) {
    const detail = erreur instanceof Error ? erreur.message : String(erreur);
    reponse.status(409).json({
      succes: false,
      message:
        "Suppression impossible : ce compte est encore lié à des données (commandes, conversations…). Désactivez-le plutôt.",
      detail,
    });
    return;
  }

  void enregistrerAudit({
    utilisateurId: requete.utilisateurId,
    action: "SUPPRESSION_PERSONNEL",
    tableCible: "utilisateurs",
    details: `Personnel supprimé définitivement : ${utilisateur.prenom} ${utilisateur.nom} (${utilisateur.email}) — rôle ${utilisateur.role}`,
    adresseIp: adresseIpRequete(requete),
  });

  reponse.json({
    succes: true,
    message: `Compte de ${utilisateur.prenom} ${utilisateur.nom} supprimé définitivement.`,
  });
}
