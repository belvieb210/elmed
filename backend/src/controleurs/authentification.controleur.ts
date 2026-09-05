import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { optionsCookieJeton } from "../config/environnement";
import { creerJeton, type RequeteAuthentifiee } from "../middlewares/authentification";

const schemaConnexion = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(6),
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

  if (!utilisateur) {
    reponse.status(401).json({ succes: false, message: "Identifiants incorrects." });
    return;
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!motDePasseValide) {
    reponse.status(401).json({ succes: false, message: "Identifiants incorrects." });
    return;
  }

  const jeton = creerJeton(utilisateur.id, utilisateur.role);
  reponse.cookie("mm_jeton", jeton, optionsCookieJeton);
  reponse.json({
    succes: true,
    utilisateur: formaterUtilisateur(utilisateur),
  });
}

export function deconnecterClient(_requete: Request, reponse: Response) {
  reponse.clearCookie("mm_jeton", { ...optionsCookieJeton, maxAge: 0 });
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
