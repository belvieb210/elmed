export const etapesSuivi = ["Reçue", "Préparation", "Expédiée", "Livrée"] as const;

export type OngletCommandes = "toutes" | "en_cours" | "livrees" | "annulees";

const statutsAnnules = ["ANNULEE", "REFUSEE"];
const statutsLivres = ["LIVREE", "CLOTUREE"];
const statutsEnCours = [
  "BROUILLON",
  "ENVOYEE",
  "EN_ATTENTE",
  "VALIDEE",
  "EN_PREPARATION",
  "PRET_RETRAIT",
  "EXPEDIEE",
  "EN_ROUTE",
];

export function ongletDepuisStatutUrl(statut: string): OngletCommandes {
  if (statutsAnnules.includes(statut)) return "annulees";
  if (statutsLivres.includes(statut)) return "livrees";
  if (statutsEnCours.includes(statut)) return "en_cours";
  return "toutes";
}

export function commandeDansOnglet(statut: string, onglet: OngletCommandes) {
  if (onglet === "toutes") return true;
  if (onglet === "annulees") return statutsAnnules.includes(statut);
  if (onglet === "livrees") return statutsLivres.includes(statut);
  return statutsEnCours.includes(statut);
}

export function libelleAffichageStatut(statut: string) {
  if (statutsAnnules.includes(statut)) return "Annulée";
  if (statutsLivres.includes(statut)) return "Livrée";
  if (statut === "EXPEDIEE" || statut === "EN_ROUTE") return "En livraison";
  if (statut === "EN_PREPARATION" || statut === "VALIDEE" || statut === "PRET_RETRAIT") return "En préparation";
  if (statut === "EN_ATTENTE" || statut === "ENVOYEE") return "Reçue";
  return "Reçue";
}

export function classeBadgeStatut(statut: string) {
  if (statutsAnnules.includes(statut)) return "bg-red-50 text-red-600";
  if (statutsLivres.includes(statut)) return "bg-emerald-50 text-emerald-700";
  if (statut === "EXPEDIEE" || statut === "EN_ROUTE") return "bg-orange-50 text-orange-600";
  return "bg-blue-50 text-blue-600";
}

export function indexEtape(statut: string) {
  if (statutsAnnules.includes(statut)) return -1;
  if (statutsLivres.includes(statut)) return 3;
  if (statut === "EXPEDIEE" || statut === "EN_ROUTE") return 2;
  if (statut === "EN_PREPARATION" || statut === "VALIDEE" || statut === "PRET_RETRAIT") return 1;
  return 0;
}

export function classeBadgePaiement(statut: string) {
  if (statut === "PAYE") return "bg-emerald-50 text-emerald-700";
  if (statut === "ECHEC" || statut === "REMBOURSE") return "bg-red-50 text-red-600";
  return "bg-orange-50 text-orange-600";
}
