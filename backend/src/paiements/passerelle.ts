/**
 * Passerelle de paiement ELMED.
 * Mode actuel : SIMULATION (aucun encaissement réel).
 * Quand vous recevrez les clés FlexPaie, renseignez-les dans backend/.env
 * et passez PASSERELLE_PAIEMENT=FLEXPAIE.
 */
export type CanalPaiement = "FLEXPAIE" | "CARTE" | "VIREMENT";

export type ResultatPasserelle = {
  accepte: boolean;
  reference: string;
  message: string;
  modeSimulation: boolean;
};

function referencePaiement(canal: CanalPaiement) {
  return `${canal}-${Date.now().toString(36).toUpperCase()}`;
}

export function configurationPasserelle() {
  const mode = (process.env.PASSERELLE_PAIEMENT ?? "SIMULATION").toUpperCase();
  return {
    mode,
    flexpaieConfigure: Boolean(process.env.FLEXPAIE_JETON && process.env.FLEXPAIE_MARCHAND),
    devise: "FC",
    pays: "RD Congo",
    tauxFrais: 0.03,
  };
}

async function appelerFlexPaie(params: { montant: number; telephone?: string; reference: string }) {
  const jeton = process.env.FLEXPAIE_JETON;
  const marchand = process.env.FLEXPAIE_MARCHAND;
  const url = process.env.FLEXPAIE_URL ?? "https://backend.flexpay.cd/api/rest/v1/payment";
  const rappel = process.env.FLEXPAIE_URL_RAPPEL ?? "";

  const reponse = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jeton}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant: marchand,
      type: 1,
      reference: params.reference,
      phone: params.telephone,
      amount: String(Math.round(params.montant)),
      currency: "CDF",
      callbackUrl: rappel,
    }),
  });

  const donnees = (await reponse.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!reponse.ok || (donnees.code != null && donnees.code !== "0")) {
    throw new Error(donnees.message ?? "FlexPaie a refusé la transaction.");
  }
}

export async function traiterPaiement(params: {
  canal: CanalPaiement;
  montant: number;
  telephone?: string;
  marqueCarte?: string;
  derniersChiffres?: string;
}): Promise<ResultatPasserelle> {
  const config = configurationPasserelle();
  const reference = referencePaiement(params.canal);
  const peutAppelerFlexPaie =
    config.mode === "FLEXPAIE" && config.flexpaieConfigure && params.canal === "FLEXPAIE";

  if (peutAppelerFlexPaie) {
    await appelerFlexPaie({ montant: params.montant, telephone: params.telephone, reference });
    return {
      accepte: true,
      reference,
      modeSimulation: false,
      message: "Paiement FlexPaie accepté.",
    };
  }

  return {
    accepte: true,
    reference,
    modeSimulation: true,
    message:
      params.canal === "VIREMENT"
        ? "Virement enregistré. Nous confirmerons à réception des fonds."
        : "Paiement simulé avec succès. Branchez l'API FlexPaie pour l'encaissement réel.",
  };
}
