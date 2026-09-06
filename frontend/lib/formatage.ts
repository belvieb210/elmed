export function formaterMontant(montant: number) {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant)} $`;
}

export function formaterDate(dateIso: string) {
  const date = new Date(dateIso);
  const texte = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return texte.replace(/^(\d+\s)([a-z])/, (_, prefixe: string, lettre: string) => `${prefixe}${lettre.toUpperCase()}`);
}

export function formaterHeure(dateIso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateIso));
}

export function formaterDateHeure(dateIso: string) {
  return `${formaterDate(dateIso)} • ${formaterHeure(dateIso)}`;
}

export function libelleStatutCommande(statut: string) {
  const libelles: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    EN_ATTENTE: "En attente",
    VALIDEE: "Validée",
    REFUSEE: "Refusée",
    ANNULEE: "Annulée",
    EN_PREPARATION: "En préparation",
    PRET_RETRAIT: "Prête au retrait",
    EXPEDIEE: "Expédiée",
    EN_ROUTE: "En route",
    LIVREE: "Livrée",
    CLOTUREE: "Clôturée",
  };
  return libelles[statut] ?? statut;
}

export function classeStatut(statut: string) {
  if (statut === "REFUSEE" || statut === "ANNULEE" || statut === "ECHEC") {
    return "bg-red-100 text-red-700";
  }
  if (statut === "LIVREE" || statut === "CLOTUREE" || statut === "PAYE") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (statut === "EXPEDIEE" || statut === "EN_ROUTE" || statut === "EN_ATTENTE" || statut === "ENVOYEE") {
    return "bg-orange-100 text-orange-700";
  }
  return "bg-blue-100 text-blue-700";
}
