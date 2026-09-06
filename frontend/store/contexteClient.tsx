"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { appelerApi, URL_API } from "@/lib/api";
import { diffuserEvenementTempsReel, type TypeEvenementTempsReel } from "@/lib/temps-reel";
import type {
  BadgesNavigation,
  Panier,
  TableauDeBord,
  Utilisateur,
} from "@/types/modeles";

interface ContexteClientValeur {
  utilisateur: Utilisateur | null;
  badges: BadgesNavigation;
  tableauDeBord: TableauDeBord | null;
  panier: Panier | null;
  chargement: boolean;
  erreur: string | null;
  menuMobileOuvert: boolean;
  definirMenuMobileOuvert: (ouvert: boolean) => void;
  connecter: (email: string, motDePasse: string) => Promise<void>;
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

const pagesPubliques = ["/connexion"];

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

  const deconnecter = useCallback(async () => {
    try {
      await appelerApi("/deconnexion", { method: "POST" });
    } catch {
      /* cookie déjà expiré */
    }
    setUtilisateur(null);
    setTableauDeBord(null);
    setPanier(null);
    setBadges(badgesVides);
    routeur.push("/connexion");
  }, [routeur]);

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
          setErreur(err instanceof Error ? err.message : "Session expirée.");
          if (!pagesPubliques.includes(chemin)) {
            routeur.push("/connexion");
          }
        }
      } finally {
        if (!ignore) setChargement(false);
      }
    }

    initialiser();
    return () => {
      ignore = true;
    };
  }, [chargerTableauDeBord, chemin, routeur]);

  useEffect(() => {
    setMenuMobileOuvert(false);
  }, [chemin]);

  useEffect(() => {
    if (!utilisateur) return;

    const flux = new EventSource(`${URL_API}/temps-reel`, { withCredentials: true });
    const types: TypeEvenementTempsReel[] = ["panier", "message", "notification", "commande"];

    for (const type of types) {
      flux.addEventListener(type, () => {
        diffuserEvenementTempsReel({ type });
        if (type === "panier") {
          void chargerPanier();
        } else {
          void chargerTableauDeBord();
        }
      });
    }

    return () => flux.close();
  }, [utilisateur, chargerPanier, chargerTableauDeBord]);

  const valeur = useMemo(
    () => ({
      utilisateur,
      badges,
      tableauDeBord,
      panier,
      chargement,
      erreur,
      menuMobileOuvert,
      definirMenuMobileOuvert: setMenuMobileOuvert,
      connecter,
      deconnecter,
      chargerTableauDeBord,
      chargerPanier,
      ajouterProduitAuPanier,
    }),
    [
      utilisateur,
      badges,
      tableauDeBord,
      panier,
      chargement,
      erreur,
      menuMobileOuvert,
      connecter,
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
