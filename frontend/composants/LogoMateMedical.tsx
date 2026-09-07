"use client";

import { useEffect, useState } from "react";
import { appelerApi } from "@/lib/api";
import type { ParametreEntreprise } from "@/types/modeles";

const NOM_DEFAUT = "MateMedical";

export function LogoMateMedical({
  taille = "md",
  clair = false,
}: {
  taille?: "sm" | "md";
  clair?: boolean;
}) {
  const dimension = taille === "sm" ? "h-8 w-8" : "h-10 w-10";
  const texte = taille === "sm" ? "text-lg" : "text-xl";
  const [marque, setMarque] = useState({ nom: NOM_DEFAUT, logoUrl: null as string | null });

  useEffect(() => {
    function appliquerTitre(nom: string) {
      if (typeof document === "undefined") return;
      const actuel = document.title;
      if (actuel.includes("Administration")) {
        document.title = `Administration — ${nom}`;
      } else if (actuel.includes("Connexion")) {
        document.title = `Connexion — ${nom}`;
      } else if (actuel.includes("Créer un compte") || actuel.includes("Inscription")) {
        document.title = `Créer un compte — ${nom}`;
      } else if (!actuel || actuel === NOM_DEFAUT || actuel.includes("MateMedical")) {
        document.title = nom;
      }
    }

    function charger() {
      appelerApi<{ entreprise: ParametreEntreprise }>("/entreprise")
        .then((donnees) => {
          const nom = donnees.entreprise.nomCommercial?.trim() || NOM_DEFAUT;
          setMarque({
            nom,
            logoUrl: donnees.entreprise.logoUrl || null,
          });
          appliquerTitre(nom);
        })
        .catch(() => undefined);
    }
    charger();
    window.addEventListener("mm-entreprise-maj", charger);
    return () => window.removeEventListener("mm-entreprise-maj", charger);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      {marque.logoUrl ? (
        <img
          src={marque.logoUrl}
          alt=""
          className={`${dimension} rounded-xl object-contain`}
        />
      ) : (
        <span
          className={`${dimension} grid place-items-center rounded-xl ${
            clair ? "bg-white/15 text-white" : "bg-violet-marque text-white shadow-sm"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path
              d="M12 4v16M8 8h8M9 16c.8 1.4 2 2.2 3 2.2S14.2 17.4 15 16"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <circle cx="8.2" cy="8" r="1.2" fill="currentColor" />
            <circle cx="15.8" cy="8" r="1.2" fill="currentColor" />
          </svg>
        </span>
      )}
      <span
        className={`${texte} font-semibold tracking-tight ${
          clair ? "text-white" : "text-violet-marque"
        }`}
      >
        {marque.nom}
      </span>
    </div>
  );
}
