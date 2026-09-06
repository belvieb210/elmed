import type { Response } from "express";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { emettreTempsReel } from "../temps-reel/diffuseur";
import { identifiantRoute } from "../utils/identifiant";

export async function listerNotifications(requete: RequeteAuthentifiee, reponse: Response) {
  const notifications = await baseDeDonnees.notification.findMany({
    where: { utilisateurId: requete.utilisateurId },
    orderBy: { dateCreation: "desc" },
  });

  reponse.json({ succes: true, notifications });
}

export async function marquerNotificationLue(requete: RequeteAuthentifiee, reponse: Response) {
  await baseDeDonnees.notification.updateMany({
    where: { id: identifiantRoute(requete.params.id), utilisateurId: requete.utilisateurId },
    data: { lue: true },
  });
  emettreTempsReel(requete.utilisateurId, "notification");
  reponse.json({ succes: true });
}

export async function marquerToutesLues(requete: RequeteAuthentifiee, reponse: Response) {
  await baseDeDonnees.notification.updateMany({
    where: { utilisateurId: requete.utilisateurId, lue: false },
    data: { lue: true },
  });
  emettreTempsReel(requete.utilisateurId, "notification");
  reponse.json({ succes: true });
}
