export const pagesAuthentification = ["/connexion", "/inscription"];

export function estPageCompte(chemin: string) {
  return (
    chemin === "/commandes" ||
    chemin === "/notifications" ||
    chemin === "/profil" ||
    chemin === "/parametres"
  );
}

export function estPageAuthentification(chemin: string) {
  return pagesAuthentification.includes(chemin);
}

export function normaliserSuivant(valeur: string | null | undefined) {
  if (!valeur || !valeur.startsWith("/") || valeur.startsWith("//")) return "/";
  if (valeur.startsWith("/connexion") || valeur.startsWith("/inscription")) return "/";
  return valeur;
}

export function lienConnexion(suivant?: string) {
  const cible = normaliserSuivant(suivant);
  return cible === "/" ? "/connexion" : `/connexion?suivant=${encodeURIComponent(cible)}`;
}

export function lienInscription(suivant?: string) {
  const cible = normaliserSuivant(suivant);
  return cible === "/" ? "/inscription" : `/inscription?suivant=${encodeURIComponent(cible)}`;
}

export function lienProtege(href: string, compteReel: boolean) {
  return compteReel || !estPageCompte(href) ? href : lienConnexion(href);
}

export function lienMessagerie(compteReel: boolean) {
  return compteReel ? "/messagerie" : lienConnexion("/messagerie");
}
