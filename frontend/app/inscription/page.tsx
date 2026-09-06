"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChampMotDePasse } from "@/composants/auth/ChampMotDePasse";
import { MiseEnPageAuth } from "@/composants/auth/MiseEnPageAuth";
import { lienConnexion, normaliserSuivant } from "@/lib/compte";
import { useClient } from "@/store/contexteClient";

function FormulaireInscription() {
  const routeur = useRouter();
  const params = useSearchParams();
  const suivant = normaliserSuivant(params.get("suivant"));
  const { inscrire } = useClient();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [nomSociete, setNomSociete] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(evenement: FormEvent) {
    evenement.preventDefault();
    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      await inscrire({
        prenom,
        nom,
        email,
        motDePasse,
        telephone: telephone.trim() || undefined,
        nomSociete: nomSociete.trim() || undefined,
      });
      routeur.push(suivant);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <MiseEnPageAuth
      titre="Créer un compte"
      sousTitre="Facultatif pour commander. Indispensable pour suivre vos commandes et écrire à l’équipe."
    >
      <form onSubmit={soumettre} className="mt-7 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Prénom
            <input
              value={prenom}
              autoComplete="given-name"
              onChange={(e) => setPrenom(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-marque focus:ring-4 focus:ring-violet-marque/10"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Nom
            <input
              value={nom}
              autoComplete="family-name"
              onChange={(e) => setNom(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-marque focus:ring-4 focus:ring-violet-marque/10"
              required
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Email professionnel
          <input
            type="email"
            value={email}
            autoComplete="email"
            placeholder="nina.v@example.com"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-marque focus:ring-4 focus:ring-violet-marque/10"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Téléphone <span className="font-normal text-slate-400">(optionnel)</span>
            <input
              value={telephone}
              autoComplete="tel"
              onChange={(e) => setTelephone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-marque focus:ring-4 focus:ring-violet-marque/10"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Société <span className="font-normal text-slate-400">(optionnel)</span>
            <input
              value={nomSociete}
              autoComplete="organization"
              onChange={(e) => setNomSociete(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-violet-marque focus:ring-4 focus:ring-violet-marque/10"
            />
          </label>
        </div>

        <ChampMotDePasse
          label="Mot de passe"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="new-password"
          placeholder="8 caractères, une lettre et un chiffre"
          aide="Minimum 8 caractères, avec au moins une lettre et un chiffre."
        />
        <ChampMotDePasse
          label="Confirmer le mot de passe"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
        />

        {erreur && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-xl bg-violet-marque py-3 text-sm font-semibold text-white transition hover:bg-violet-fonce disabled:opacity-60"
        >
          {enCours ? "Création du compte..." : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà client ?{" "}
        <Link href={lienConnexion(suivant)} className="font-semibold text-violet-marque hover:underline">
          Se connecter
        </Link>
      </p>
    </MiseEnPageAuth>
  );
}

export default function PageInscription() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500">Chargement...</div>}>
      <FormulaireInscription />
    </Suspense>
  );
}
