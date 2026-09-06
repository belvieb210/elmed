"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { appelerApi } from "@/lib/api";
import { estPageAuthentification, estPageCompte, normaliserSuivant } from "@/lib/compte";
import { connecterSocketTempsReel } from "@/lib/socket";
import { diffuserEvenementTempsReel } from "@/lib/temps-reel";
import type { BadgesNavigation, Panier, TableauDeBord, Utilisateur } from "@/types/modeles";

interface DonneesInscription {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
  nomSociete?: string;
}

interface ContexteClientValeur {
  utilisateur: Utilisateur | null;
  compteReel: boolean;
  badges: BadgesNavigation;
  tableauDeBord: TableauDeBord | null;
  panier: Panier | null;
  chargement: boolean;
  erreur: string | null;
  menuMobileOuvert: boolean;
  definirMenuMobileOuvert: (ouvert: boolean) => void;
  connecter: (email: string, motDePasse: string) => Promise<void>;
  inscrire: (donnees: DonneesInscription) => Promise<void>;
  deconnecter: () => void;
  chargerTableauDeBord: () => Promise<void>;
  chargerPanier: () => Promise<void>;
  ajouterProduitAuPanier: (produitId: string) => Promise<void>;
}

const ContexteClient = createContext<ContexteClientValeur | null>(null);

const badgesVides: BadgesNavigation = {
  nombreArticlesPanier: 0,
  messagesNonLus: 0,
  notificationsNonLues: 0,
};

export function FournisseurClient({ children }: { children: React.ReactNode }) {
  const routeur = useRouter();
  const chemin = usePathname();
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [badges, setBadges] = useState<BadgesNavigation>(badgesVides);
  const [tableauDeBord, setTableauDeBord] = useState<TableauDeBord | null>(null);
  const [panier, setPanier] = useState<Panier | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);

  const compteReel = Boolean(utilisateur && !utilisateur.estInvite);

  const chargerTableauDeBord = useCallback(async () => {
    const donnees = await appelerApi<{ tableauDeBord: TableauDeBord }>("/accueil");
    setTableauDeBord(donnees.tableauDeBord);
    setUtilisateur(donnees.tableauDeBord.utilisateur);
    setBadges(donnees.tableauDeBord.badges);
  }, []);

  const chargerPanier = useCallback(async () => {
    const donnees = await appelerApi<{ panier: Panier }>("/panier");
    setPanier(donnees.panier);
    setBadges((actuel) => ({
      ...actuel,
      nombreArticlesPanier: donnees.panier.nombreArticles,
    }));
  }, []);

  const connecter = useCallback(
    async (email: string, motDePasse: string) => {
      const donnees = await appelerApi<{ utilisateur: Utilisateur }>("/connexion", {
        method: "POST",
        body: JSON.stringify({ email, motDePasse }),
      });
      setUtilisateur(donnees.utilisateur);
      await chargerTableauDeBord();
    },
    [chargerTableauDeBord],
  );

  const inscrire = useCallback(
    async (donneesInscription: DonneesInscription) => {
      const donnees = await appelerApi<{ utilisateur: Utilisateur }>("/inscription", {
        method: "POST",
        body: JSON.stringify(donneesInscription),
      });
      setUtilisateur(donnees.utilisateur);
      await chargerTableauDeBord();
    },
    [chargerTableauDeBord],
  );

  const deconnecter = useCallback(async () => {
    try {
      await appelerApi("/deconnexion", { method: "POST" });
    } catch {
      /* cookie déjà expiré */
    }
    setUtilisateur(null);
    setPanier(null);
    setBadges(badgesVides);
    routeur.push("/");
    try {
      await chargerTableauDeBord();
    } catch {
      setTableauDeBord(null);
    }
  }, [routeur, chargerTableauDeBord]);

  const ajouterProduitAuPanier = useCallback(
    async (produitId: string) => {
      await appelerApi("/panier", {
        method: "POST",
        body: JSON.stringify({ produitId, quantite: 1 }),
      });
      await Promise.all([chargerPanier(), chargerTableauDeBord()]);
    },
    [chargerPanier, chargerTableauDeBord],
  );

  useEffect(() => {
    let ignore = false;

    async function initialiser() {
      try {
        setErreur(null);
        await chargerTableauDeBord();
      } catch (err) {
        if (!ignore) {
          setUtilisateur(null);
          setTableauDeBord(null);
          setErreur(err instanceof Error ? err.message : "Impossible de charger le catalogue.");
        }
      } finally {
        if (!ignore) setChargement(false);
      }
    }

    initialiser();
    return () => {
      ignore = true;
    };
  }, [chargerTableauDeBord]);

  useEffect(() => {
    if (chargement) return;
    if (!compteReel && estPageCompte(chemin)) {
      routeur.replace(`/connexion?suivant=${encodeURIComponent(chemin)}`);
    }
    if (compteReel && estPageAuthentification(chemin)) {
      routeur.replace("/");
    }
  }, [chargement, compteReel, chemin, routeur]);

  useEffect(() => {
    setMenuMobileOuvert(false);
  }, [chemin]);

  useEffect(() => {
    if (!compteReel && chemin !== "/messagerie") return;

    return connecterSocketTempsReel((type) => {
      diffuserEvenementTempsReel({ type });
      if (type === "panier") {
        void chargerPanier();
      } else {
        void chargerTableauDeBord();
      }
    });
  }, [compteReel, chemin, chargerPanier, chargerTableauDeBord]);

  const valeur = useMemo(
    () => ({
      utilisateur,
      compteReel,
      badges,
      tableauDeBord,
      panier,
      chargement,
      erreur,
      menuMobileOuvert,
      definirMenuMobileOuvert: setMenuMobileOuvert,
      connecter,
      inscrire,
      deconnecter,
      chargerTableauDeBord,
      chargerPanier,
      ajouterProduitAuPanier,
    }),
    [
      utilisateur,
      compteReel,
      badges,
      tableauDeBord,
      panier,
      chargement,
      erreur,
      menuMobileOuvert,
      connecter,
      inscrire,
      deconnecter,
      chargerTableauDeBord,
      chargerPanier,
      ajouterProduitAuPanier,
    ],
  );

  return <ContexteClient.Provider value={valeur}>{children}</ContexteClient.Provider>;
}

export function useClient() {
  const contexte = useContext(ContexteClient);
  if (!contexte) {
    throw new Error("useClient doit être utilisé dans FournisseurClient.");
  }
  return contexte;
}

export function destinationApresAuth(suivant: string | null) {
  return normaliserSuivant(suivant);
}
