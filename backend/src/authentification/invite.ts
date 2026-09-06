import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextFunction, Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { optionsCookieInvite, optionsCookieJeton } from "../config/environnement";
import { creerJeton, type RequeteAuthentifiee } from "../middlewares/authentification";

export async function creerUtilisateurInvite() {
  const identifiant = randomBytes(8).toString("hex");
  const motDePasse = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
  return baseDeDonnees.utilisateur.create({
    data: {
      prenom: "Invité",
      nom: "ELMED",
      email: `invite-${identifiant}@invite.elmed.local`,
      motDePasse,
      role: "CLIENT",
      estInvite: true,
    },
  });
}

export function poserSession(reponse: Response, utilisateurId: string, role: string, estInvite: boolean) {
  const jeton = creerJeton(utilisateurId, role);
  reponse.cookie("mm_jeton", jeton, optionsCookieJeton);
  if (estInvite) {
    reponse.cookie("mm_invite", utilisateurId, optionsCookieInvite);
  } else {
    reponse.clearCookie("mm_invite", { ...optionsCookieInvite, maxAge: 0 });
  }
}

export async function assurerClientOuInvite(
  requete: RequeteAuthentifiee,
  reponse: Response,
  suivant: NextFunction,
) {
  if (requete.utilisateurId) {
    suivant();
    return;
  }

  const inviteId = requete.cookies?.mm_invite as string | undefined;
  if (inviteId) {
    const existant = await baseDeDonnees.utilisateur.findUnique({ where: { id: inviteId } });
    if (existant?.actif && existant.estInvite) {
      requete.utilisateurId = existant.id;
      requete.roleUtilisateur = existant.role;
      requete.estInvite = true;
      poserSession(reponse, existant.id, existant.role, true);
      suivant();
      return;
    }
  }

  const invite = await creerUtilisateurInvite();
  requete.utilisateurId = invite.id;
  requete.roleUtilisateur = invite.role;
  requete.estInvite = true;
  poserSession(reponse, invite.id, invite.role, true);
  suivant();
}

export async function fusionnerCompteInvite(inviteId: string | undefined, clientId: string) {
  if (!inviteId || inviteId === clientId) return;

  const invite = await baseDeDonnees.utilisateur.findUnique({ where: { id: inviteId } });
  if (!invite?.estInvite) return;

  await baseDeDonnees.$transaction(async (transaction) => {
    const lignesInvite = await transaction.lignePanier.findMany({ where: { clientId: inviteId } });
    for (const ligne of lignesInvite) {
      await transaction.lignePanier.upsert({
        where: { clientId_produitId: { clientId, produitId: ligne.produitId } },
        create: { clientId, produitId: ligne.produitId, quantite: ligne.quantite },
        update: { quantite: { increment: ligne.quantite } },
      });
    }
    await transaction.lignePanier.deleteMany({ where: { clientId: inviteId } });
    await transaction.commande.updateMany({ where: { clientId: inviteId }, data: { clientId } });
    await transaction.conversation.updateMany({ where: { clientId: inviteId }, data: { clientId } });
    await transaction.notification.updateMany({ where: { utilisateurId: inviteId }, data: { utilisateurId: clientId } });
    await transaction.utilisateur.delete({ where: { id: inviteId } }).catch(() => undefined);
  });
}
