import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { fusionnerCompteInvite, poserSession } from "../authentification/invite";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { optionsCookieInvite, optionsCookieJeton } from "../config/environnement";
import type { RequeteAuthentifiee } from "../middlewares/authentification";

const schemaConnexion = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(6),
});

const schemaInscription = z.object({
  prenom: z.string().trim().min(1, "Le prénom est requis."),
  nom: z.string().trim().min(1, "Le nom est requis."),
  email: z.string().email("Email invalide."),
  motDePasse: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Za-z]/, "Le mot de passe doit contenir une lettre.")
    .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre."),
  telephone: z.string().trim().optional(),
  nomSociete: z.string().trim().optional(),
});

function formaterUtilisateur(utilisateur: {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  role: string;
  photoProfil: string | null;
  nomSociete: string | null;
  adresse: string | null;
  ville: string | null;
  estInvite?: boolean;
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
    nomSociete: utilisateur.nomSociete,
    adresse: utilisateur.adresse,
    ville: utilisateur.ville,
    estInvite: Boolean(utilisateur.estInvite),
  };
}

export async function connecterClient(requete: Request, reponse: Response) {
  const analyse = schemaConnexion.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Email ou mot de passe invalide." });
    return;
  }

  const { email, motDePasse } = analyse.data;
  const utilisateur = await baseDeDonnees.utilisateur.findUnique({ where: { email } });

  if (!utilisateur || utilisateur.estInvite) {
    reponse.status(401).json({ succes: false, message: "Identifiants incorrects." });
    return;
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!motDePasseValide) {
    reponse.status(401).json({ succes: false, message: "Identifiants incorrects." });
    return;
  }

  const inviteId = requete.cookies?.mm_invite as string | undefined;
  await fusionnerCompteInvite(inviteId, utilisateur.id);
  poserSession(reponse, utilisateur.id, utilisateur.role, false);
  reponse.json({
    succes: true,
    utilisateur: formaterUtilisateur({ ...utilisateur, estInvite: false }),
  });
}

export async function inscrireClient(requete: Request, reponse: Response) {
  const analyse = schemaInscription.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({
      succes: false,
      message: analyse.error.issues[0]?.message ?? "Données d'inscription invalides.",
    });
    return;
  }

  const { prenom, nom, email, motDePasse, telephone, nomSociete } = analyse.data;
  const existant = await baseDeDonnees.utilisateur.findUnique({ where: { email } });
  if (existant && !existant.estInvite) {
    reponse.status(409).json({ succes: false, message: "Un compte existe déjà avec cet email." });
    return;
  }

  const hash = await bcrypt.hash(motDePasse, 12);
  const utilisateur = existant?.estInvite
    ? await baseDeDonnees.utilisateur.update({
        where: { id: existant.id },
        data: {
          prenom,
          nom,
          email,
          motDePasse: hash,
          telephone: telephone || null,
          nomSociete: nomSociete || null,
          estInvite: false,
        },
      })
    : await baseDeDonnees.utilisateur.create({
        data: {
          prenom,
          nom,
          email,
          motDePasse: hash,
          telephone: telephone || null,
          nomSociete: nomSociete || null,
          role: "CLIENT",
          estInvite: false,
        },
      });

  const inviteId = requete.cookies?.mm_invite as string | undefined;
  if (inviteId !== utilisateur.id) {
    await fusionnerCompteInvite(inviteId, utilisateur.id);
  }
  poserSession(reponse, utilisateur.id, utilisateur.role, false);
  reponse.status(201).json({
    succes: true,
    utilisateur: formaterUtilisateur(utilisateur),
  });
}

export function deconnecterClient(_requete: Request, reponse: Response) {
  reponse.clearCookie("mm_jeton", { ...optionsCookieJeton, maxAge: 0 });
  reponse.clearCookie("mm_invite", { ...optionsCookieInvite, maxAge: 0 });
  reponse.json({ succes: true, message: "Déconnexion effectuée." });
}

export async function obtenirProfil(requete: RequeteAuthentifiee, reponse: Response) {
  const utilisateur = await baseDeDonnees.utilisateur.findUnique({
    where: { id: requete.utilisateurId },
  });

  if (!utilisateur) {
    reponse.status(404).json({ succes: false, message: "Utilisateur introuvable." });
    return;
  }

  reponse.json({ succes: true, utilisateur: formaterUtilisateur(utilisateur) });
}

export async function mettreAJourProfil(requete: RequeteAuthentifiee, reponse: Response) {
  const schema = z.object({
    prenom: z.string().min(1).optional(),
    nom: z.string().min(1).optional(),
    telephone: z.string().optional(),
    nomSociete: z.string().optional(),
    adresse: z.string().optional(),
    ville: z.string().optional(),
  });

  const analyse = schema.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Données de profil invalides." });
    return;
  }

  const utilisateur = await baseDeDonnees.utilisateur.update({
    where: { id: requete.utilisateurId },
    data: analyse.data,
  });

  reponse.json({ succes: true, utilisateur: formaterUtilisateur(utilisateur) });
}

export async function changerMotDePasse(requete: RequeteAuthentifiee, reponse: Response) {
  const schema = z.object({
    motDePasseActuel: z.string().min(6),
    nouveauMotDePasse: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Une majuscule est requise.")
      .regex(/[0-9]/, "Un chiffre est requis."),
  });

  const analyse = schema.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Mot de passe invalide." });
    return;
  }

  const utilisateur = await baseDeDonnees.utilisateur.findUnique({
    where: { id: requete.utilisateurId },
  });

  if (!utilisateur) {
    reponse.status(404).json({ succes: false, message: "Utilisateur introuvable." });
    return;
  }

  const valide = await bcrypt.compare(analyse.data.motDePasseActuel, utilisateur.motDePasse);
  if (!valide) {
    reponse.status(401).json({ succes: false, message: "Mot de passe actuel incorrect." });
    return;
  }

  const hash = await bcrypt.hash(analyse.data.nouveauMotDePasse, 12);
  await baseDeDonnees.utilisateur.update({
    where: { id: utilisateur.id },
    data: { motDePasse: hash },
  });

  reponse.json({ succes: true, message: "Mot de passe mis à jour." });
}
