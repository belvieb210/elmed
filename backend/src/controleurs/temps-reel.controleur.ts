import type { Response } from "express";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { abonnerTempsReel, retirerTempsReel } from "../temps-reel/diffuseur";

export function ouvrirFluxTempsReel(requete: RequeteAuthentifiee, reponse: Response) {
  const utilisateurId = requete.utilisateurId!;

  reponse.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  reponse.write(":connecte\n\n");
  abonnerTempsReel(utilisateurId, reponse);

  const battement = setInterval(() => {
    try {
      reponse.write(":ping\n\n");
    } catch {
      clearInterval(battement);
    }
  }, 25000);

  const fermer = () => {
    clearInterval(battement);
    retirerTempsReel(utilisateurId, reponse);
  };

  requete.on("close", fermer);
  reponse.on("close", fermer);
}
