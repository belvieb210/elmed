"use client";

import { useEffect } from "react";

export type TypeEvenementTempsReel = "panier" | "message" | "notification" | "commande" | "client";

export const NOM_EVENEMENT_TEMPS_REEL = "elmed-temps-reel";

export function diffuserEvenementTempsReel(detail: { type: TypeEvenementTempsReel }) {
  window.dispatchEvent(new CustomEvent(NOM_EVENEMENT_TEMPS_REEL, { detail }));
}

export function useEvenementTempsReel(type: TypeEvenementTempsReel, recharger: () => void) {
  useEffect(() => {
    function surEvenement(evenement: Event) {
      const detail = (evenement as CustomEvent<{ type?: string }>).detail;
      if (detail?.type === type) recharger();
    }

    window.addEventListener(NOM_EVENEMENT_TEMPS_REEL, surEvenement);
    return () => window.removeEventListener(NOM_EVENEMENT_TEMPS_REEL, surEvenement);
  }, [type, recharger]);
}
