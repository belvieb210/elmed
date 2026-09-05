"use client";

import { FormEvent, useState } from "react";
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
      <EnTetePage titre="Paramètres" description="Sécurité de votre compte client." />
      <form onSubmit={changer} className="max-w-lg space-y-4 rounded-2xl border border-slate-100 bg-white p-6">
        <label className="block text-sm font-medium">
          Mot de passe actuel
          <input
            type="password"
            value={motDePasseActuel}
            onChange={(e) => setMotDePasseActuel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Nouveau mot de passe
          <input
            type="password"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            required
          />
        </label>
        <button type="submit" className="rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white">
          Mettre à jour
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
      <BandeauMessagerie />
    </MiseEnPageClient>
  );
}
