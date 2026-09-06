import type { Response } from "express";
import { ModePaiement, StatutPaiement } from "@prisma/client";
import { z } from "zod";
import { encaisserCommandeExistante, enregistrerCommandeDepuisPanier } from "../commandes/enregistrer-depuis-panier";
import { baseDeDonnees } from "../config/baseDeDonnees";
import type { RequeteAuthentifiee } from "../middlewares/authentification";
import { configurationPasserelle, traiterPaiement, type CanalPaiement } from "../paiements/passerelle";

function modeDepuisCanal(canal: CanalPaiement, telephone?: string): ModePaiement {
  if (canal === "VIREMENT") return ModePaiement.VIREMENT;
  if (canal === "CARTE") return ModePaiement.CARTE_BANCAIRE;
  if (telephone?.startsWith("084") || telephone?.startsWith("085")) return ModePaiement.MOBILE_MONEY_AIRTEL;
  if (telephone?.startsWith("080") || telephone?.startsWith("089")) return ModePaiement.MOBILE_MONEY_ORANGE;
  return ModePaiement.MOBILE_MONEY_MPESA;
}

export function obtenirConfigurationPaiement(_requete: RequeteAuthentifiee, reponse: Response) {
  reponse.json({
    succes: true,
    configuration: configurationPasserelle(),
  });
}

export async function confirmerPaiementEnLigne(requete: RequeteAuthentifiee, reponse: Response) {
  const schema = z.object({
    canal: z.enum(["FLEXPAIE", "CARTE", "VIREMENT"]),
    commandeId: z.string().uuid().optional(),
    telephone: z.string().optional(),
    marqueCarte: z.string().optional(),
    derniersChiffres: z.string().regex(/^\d{4}$/).optional(),
  });

  const analyse = schema.safeParse(requete.body);
  if (!analyse.success) {
    reponse.status(400).json({ succes: false, message: "Données de paiement invalides." });
    return;
  }

  const { canal, commandeId, telephone, marqueCarte, derniersChiffres } = analyse.data;

  try {
    let montant = 0;
    if (commandeId) {
      const existante = await baseDeDonnees.commande.findFirst({
        where: { id: commandeId, clientId: requete.utilisateurId },
      });
      if (!existante) {
        reponse.status(404).json({ succes: false, message: "Commande introuvable." });
        return;
      }
      montant = Number(existante.montantTotal);
    } else {
      const lignesPanier = await baseDeDonnees.lignePanier.findMany({
        where: { clientId: requete.utilisateurId },
        include: { produit: true },
      });
      montant = lignesPanier.reduce(
        (somme, ligne) => somme + Number(ligne.produit.prix) * ligne.quantite,
        0,
      );
    }

    const resultat = await traiterPaiement({
      canal,
      montant,
      telephone,
      marqueCarte,
      derniersChiffres,
    });

    if (!resultat.accepte) {
      reponse.status(402).json({ succes: false, message: resultat.message });
      return;
    }

    const statutPaiement = canal === "VIREMENT" ? StatutPaiement.EN_ATTENTE : StatutPaiement.PAYE;
    const notes = [
      `Canal : ${canal}`,
      telephone ? `Tél. : ${telephone}` : null,
      marqueCarte && derniersChiffres ? `Carte ${marqueCarte} ****${derniersChiffres}` : null,
      resultat.modeSimulation ? "Simulation" : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const commande = commandeId
      ? await encaisserCommandeExistante({
          clientId: requete.utilisateurId!,
          commandeId,
          modePaiement: modeDepuisCanal(canal, telephone),
          statutPaiement,
          reference: resultat.reference,
          notes,
        })
      : await enregistrerCommandeDepuisPanier({
          clientId: requete.utilisateurId!,
          modePaiement: modeDepuisCanal(canal, telephone),
          statutPaiement,
          reference: resultat.reference,
          notes,
        });

    reponse.status(201).json({
      succes: true,
      message: resultat.message,
      simulation: resultat.modeSimulation,
      commande: {
        id: commande.id,
        numeroCommande: commande.numeroCommande,
        montantTotal: Number(commande.montantTotal),
        statut: commande.statut,
      },
    });
  } catch (erreur) {
    reponse.status(400).json({
      succes: false,
      message: erreur instanceof Error ? erreur.message : "Paiement impossible.",
    });
  }
}
