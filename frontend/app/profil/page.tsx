"use client";

import { FormEvent, useEffect, useState } from "react";
import { BarriereCompte } from "@/composants/auth/BarriereCompte";
import { ChampMotDePasse } from "@/composants/auth/ChampMotDePasse";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { appelerApi } from "@/lib/api";
import { useClient } from "@/store/contexteClient";
import type { Utilisateur } from "@/types/modeles";

const champ =
  "mt-1 w-full rounded-xl border border-bleu-hero px-3 py-2.5 text-sm outline-none";

export default function PageProfil() {
  const { utilisateur, chargerTableauDeBord, deconnecter } = useClient();
  const [formulaire, setFormulaire] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    nomSociete: "",
    adresse: "",
    ville: "",
    photoProfil: "" as string | null,
  });
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!utilisateur) return;
    setFormulaire({
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      telephone: utilisateur.telephone ?? "",
      nomSociete: utilisateur.nomSociete ?? "",
      adresse: utilisateur.adresse ?? "",
      ville: utilisateur.ville ?? "",
      photoProfil: utilisateur.photoProfil,
    });
  }, [utilisateur]);

  function lirePhoto(fichier?: File) {
    if (!fichier) return;
    if (fichier.size > 3 * 1024 * 1024) {
      setErreur("La photo ne doit pas dépasser 3 Mo.");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      if (typeof lecteur.result === "string") {
        setFormulaire((actuel) => ({ ...actuel, photoProfil: lecteur.result as string }));
      }
    };
    lecteur.readAsDataURL(fichier);
  }

  async function enregistrer(evenement: FormEvent) {
    evenement.preventDefault();
    setErreur(null);
    try {
      await appelerApi<{ utilisateur: Utilisateur }>("/profil", {
        method: "PUT",
        body: JSON.stringify(formulaire),
      });
      await chargerTableauDeBord();
      setMessage("Profil mis à jour.");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible.");
    }
  }

  async function changerMotDePasse(evenement: FormEvent) {
    evenement.preventDefault();
    setErreur(null);
    try {
      const resultat = await appelerApi<{ message: string }>("/profil/mot-de-passe", {
        method: "PUT",
        body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse }),
      });
      setMessage(resultat.message);
      setMotDePasseActuel("");
      setNouveauMotDePasse("");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Mot de passe non modifié.");
    }
  }

  return (
    <MiseEnPageClient>
      <BarriereCompte
        titre="Profil client"
        description="Le profil, la photo et le mot de passe sont liés à votre compte MateMedical."
      >
        <EnTetePage titre="Mon profil" description="Photo, informations et sécurité du compte." />

        {message && <p className="mb-4 text-sm text-emerald-600">{message}</p>}
        {erreur && <p className="mb-4 text-sm text-rose-600">{erreur}</p>}

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={enregistrer} className="space-y-4 rounded-2xl border border-bleu-hero bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">Informations</h2>
            <label className="flex w-fit cursor-pointer flex-col items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => lirePhoto(e.target.files?.[0])}
              />
              {formulaire.photoProfil ? (
                <img
                  src={formulaire.photoProfil}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-bleu-hero"
                />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-full bg-violet-marque text-xl text-white">
                  {(formulaire.prenom[0] || "C") + (formulaire.nom[0] || "")}
                </span>
              )}
              <span className="text-xs text-slate-500">Changer ma photo</span>
            </label>

            {(
              [
                ["prenom", "Prénom"],
                ["nom", "Nom"],
                ["telephone", "Téléphone"],
                ["nomSociete", "Société"],
                ["adresse", "Adresse"],
                ["ville", "Ville"],
              ] as const
            ).map(([cle, libelle]) => (
              <label key={cle} className="block text-sm font-medium text-slate-700">
                {libelle}
                <input
                  value={formulaire[cle] ?? ""}
                  onChange={(e) => setFormulaire((actuel) => ({ ...actuel, [cle]: e.target.value }))}
                  className={champ}
                />
              </label>
            ))}
            <p className="text-sm text-slate-400">Email : {utilisateur?.email}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white"
              >
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
          </form>

          <form
            onSubmit={changerMotDePasse}
            className="h-fit space-y-4 rounded-2xl border border-bleu-hero bg-white p-6"
          >
            <h2 className="text-base font-semibold text-slate-900">Mot de passe</h2>
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
            <button
              type="submit"
              className="rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white"
            >
              Changer le mot de passe
            </button>
          </form>
        </div>
      </BarriereCompte>
    </MiseEnPageClient>
  );
}
