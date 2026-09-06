export type CarteEnregistree = {
  id: string;
  marque: string;
  derniers: string;
  masque: string;
};

const CLE = "elmed_cartes_enregistrees";

const cartesDemo: CarteEnregistree[] = [
  { id: "demo-visa-1971", marque: "Visa", derniers: "1971", masque: "4187 62** **** 1971" },
  { id: "demo-visa-2832", marque: "Visa", derniers: "2832", masque: "4187 62** **** 2832" },
];

export function lireCartesEnregistrees(): CarteEnregistree[] {
  if (typeof window === "undefined") return cartesDemo;
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return cartesDemo;
    const lues = JSON.parse(brut) as CarteEnregistree[];
    return lues.length > 0 ? lues : cartesDemo;
  } catch {
    return cartesDemo;
  }
}

export function enregistrerCarteLocale(carte: CarteEnregistree) {
  const actuelles = lireCartesEnregistrees().filter((item) => item.id !== carte.id);
  window.localStorage.setItem(CLE, JSON.stringify([carte, ...actuelles]));
}

export function masquerNumero(numero: string) {
  const chiffres = numero.replace(/\D/g, "");
  const derniers = chiffres.slice(-4);
  const debut = chiffres.slice(0, 4);
  const milieu = chiffres.slice(4, 6);
  return `${debut} ${milieu}** **** ${derniers}`;
}

export function formaterNumeroCarte(valeur: string) {
  return valeur
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formaterExpiration(valeur: string) {
  const chiffres = valeur.replace(/\D/g, "").slice(0, 4);
  if (chiffres.length <= 2) return chiffres;
  return `${chiffres.slice(0, 2)}/${chiffres.slice(2)}`;
}

export function marqueDepuisNumero(numero: string) {
  const chiffres = numero.replace(/\D/g, "");
  if (chiffres.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(chiffres) || /^2[2-7]/.test(chiffres)) return "Mastercard";
  return "Carte";
}

export function numeroCarteValide(numero: string) {
  const chiffres = numero.replace(/\D/g, "");
  if (chiffres.length < 13 || chiffres.length > 19) return false;
  let somme = 0;
  let double = false;
  for (let index = chiffres.length - 1; index >= 0; index -= 1) {
    let chiffre = Number(chiffres[index]);
    if (double) {
      chiffre *= 2;
      if (chiffre > 9) chiffre -= 9;
    }
    somme += chiffre;
    double = !double;
  }
  return somme % 10 === 0;
}

export function expirationValide(valeur: string) {
  const correspondance = /^(\d{2})\/(\d{2})$/.exec(valeur);
  if (!correspondance) return false;
  const mois = Number(correspondance[1]);
  const annee = 2000 + Number(correspondance[2]);
  if (mois < 1 || mois > 12) return false;
  const fin = new Date(annee, mois, 0);
  return fin.getTime() >= Date.now();
}
