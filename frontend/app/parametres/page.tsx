"use client";

import { FormEvent, useState } from "react";
import { BarriereCompte } from "@/composants/auth/BarriereCompte";
import { ChampMotDePasse } from "@/composants/auth/ChampMotDePasse";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { appelerApi } from "@/lib/api";

export default function PageParametres() {
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function changer(evenement: FormEvent) {
    evenement.preventDefault();
    try {
      const resultat = await appelerApi<{ message: string }>("/profil/mot-de-passe", {
        method: "PUT",
        body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse }),
      });
      setMessage(resultat.message);
      setMotDePasseActuel("");
      setNouveauMotDePasse("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Impossible de modifier le mot de passe.");
    }
  }

  return (
    <MiseEnPageClient>
      <BarriereCompte
        titre="Paramètres du compte"
        description="La sécurité du compte (mot de passe) est disponible après inscription ou connexion."
      >
        <EnTetePage titre="Paramètres" description="Sécurité de votre compte client." />
        <form onSubmit={changer} className="max-w-lg space-y-4 rounded-2xl border border-bleu-hero bg-white p-6">
          <ChampMotDePasse
            label="Mot de passe actuel"
            value={motDePasseActuel}
            onChange={setMotDePasseActuel}
            autoComplete="current-password"
          />
          <ChampMotDePasse
            label="Nouveau mot de passe"
            value={nouveauMotDePasse}
            onChange={setNouveauMotDePasse}
            autoComplete="new-password"
            aide="Au moins 8 caractères, une majuscule et un chiffre."
          />
          <button type="submit" className="rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white">
            Mettre à jour
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </form>
        <BandeauMessagerie />
      </BarriereCompte>
    </MiseEnPageClient>
  );
}
