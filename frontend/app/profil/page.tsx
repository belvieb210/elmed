"use client";

import { FormEvent, useEffect, useState } from "react";
import { BarriereCompte } from "@/composants/auth/BarriereCompte";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { appelerApi } from "@/lib/api";
import { useClient } from "@/store/contexteClient";
import type { Utilisateur } from "@/types/modeles";

export default function PageProfil() {
  const { utilisateur, chargerTableauDeBord, deconnecter } = useClient();
  const [formulaire, setFormulaire] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    nomSociete: "",
    adresse: "",
    ville: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!utilisateur) return;
    setFormulaire({
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      telephone: utilisateur.telephone ?? "",
      nomSociete: utilisateur.nomSociete ?? "",
      adresse: utilisateur.adresse ?? "",
      ville: utilisateur.ville ?? "",
    });
  }, [utilisateur]);

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault();
    await appelerApi<{ utilisateur: Utilisateur }>("/profil", {
      method: "PUT",
      body: JSON.stringify(formulaire),
    });
    await chargerTableauDeBord();
    setMessage("Profil mis à jour.");
  }

  return (
    <MiseEnPageClient>
      <BarriereCompte
        titre="Profil client"
        description="Le profil, l’adresse et les informations société sont liés à un compte MateMedical."
      >
      <EnTetePage titre="Mon profil" description="Informations de votre établissement." />
      <form onSubmit={enregistrer} className="max-w-2xl space-y-4 rounded-2xl border border-bleu-hero bg-white p-6">
        {Object.entries({
          prenom: "Prénom",
          nom: "Nom",
          telephone: "Téléphone",
          nomSociete: "Société",
          adresse: "Adresse",
          ville: "Ville",
        }).map(([cle, libelle]) => (
          <label key={cle} className="block text-sm font-medium text-slate-700">
            {libelle}
            <input
              value={formulaire[cle as keyof typeof formulaire]}
              onChange={(e) => setFormulaire((actuel) => ({ ...actuel, [cle]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-bleu-hero px-3 py-2.5 text-sm outline-none"
            />
          </label>
        ))}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white">
            Enregistrer
          </button>
          <button
            type="button"
            onClick={deconnecter}
            className="rounded-xl border border-bleu-hero px-4 py-2.5 text-sm"
          >
            Déconnexion
          </button>
        </div>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
      </form>
      </BarriereCompte>
    </MiseEnPageClient>
  );
}
