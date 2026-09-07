"use client";

import { useEffect } from "react";

export type TypeEvenementTempsReel = "panier" | "message" | "notification" | "commande" | "client";

export type DetailTempsReel = {
  type: TypeEvenementTempsReel;
  clientId?: string;
  commandeId?: string;
  conversationId?: string;
};

export const NOM_EVENEMENT_TEMPS_REEL = "elmed-temps-reel";

export function diffuserEvenementTempsReel(detail: DetailTempsReel) {
  window.dispatchEvent(new CustomEvent(NOM_EVENEMENT_TEMPS_REEL, { detail }));
}

export function useEvenementTempsReel(
  type: TypeEvenementTempsReel,
  recharger: (detail?: DetailTempsReel) => void,
) {
  useEffect(() => {
    function surEvenement(evenement: Event) {
      const detail = (evenement as CustomEvent<DetailTempsReel>).detail;
      if (detail?.type === type) recharger(detail);
    }

    window.addEventListener(NOM_EVENEMENT_TEMPS_REEL, surEvenement);
    return () => window.removeEventListener(NOM_EVENEMENT_TEMPS_REEL, surEvenement);
  }, [type, recharger]);
}
