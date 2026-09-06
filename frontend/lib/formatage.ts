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

export function formaterRelatif(dateIso: string) {
  const delta = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.max(0, Math.floor(delta / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} j`;
  return formaterDate(dateIso);
}

export function formaterDateCourte(date = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function libelleModeFacture(mode?: string) {
  const libelles: Record<string, string> = {
    CASH: "Cash",
    AVANCE: "Avance",
    SOLDE: "Solde",
    PRISE_EN_CHARGE: "Prise en charge",
    ABONNE: "Abonné",
    CONVENTIONNE: "Conventionné",
  };
  return libelles[mode ?? ""] ?? mode ?? "Cash";
}

export function libelleRole(role?: string) {
  const libelles: Record<string, string> = {
    CLIENT: "Client",
    SUPER_ADMIN: "Super Admin",
    DIRECTEUR: "Directeur",
    COMMERCIAL: "Commercial",
    COMPTABLE: "Comptable",
    MAGASINIER: "Magasinier",
    SUPPORT: "Support",
    LIVREUR: "Livreur",
  };
  return libelles[role ?? ""] ?? role ?? "Équipe";
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
