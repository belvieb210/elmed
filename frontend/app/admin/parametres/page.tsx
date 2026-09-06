"use client";

import { FormEvent, useState } from "react";
import { ChampMotDePasse } from "@/composants/auth/ChampMotDePasse";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { appelerApi } from "@/lib/api";

export default function PageParametresAdmin() {
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
    <MiseEnPageAdmin titre="Paramètres" sousTitre="Sécurité du compte gestionnaire">
      <form onSubmit={changer} className="max-w-lg space-y-4 rounded-2xl border border-slate-100 bg-white p-6">
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
        />
        <button type="submit" className="rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white">
          Mettre à jour
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </MiseEnPageAdmin>
  );
}
