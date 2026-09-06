"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChampMotDePasse } from "@/composants/auth/ChampMotDePasse";
import { MiseEnPageAuth } from "@/composants/auth/MiseEnPageAuth";
import { lienInscription, normaliserSuivant } from "@/lib/compte";
import { estPersonnel } from "@/lib/roles";
import { useClient } from "@/store/contexteClient";

function FormulaireConnexion() {
  const routeur = useRouter();
  const params = useSearchParams();
  const suivant = normaliserSuivant(params.get("suivant"));
  const { connecter } = useClient();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(evenement: FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const utilisateur = await connecter(email, motDePasse);
      routeur.push(estPersonnel(utilisateur.role) ? "/admin" : suivant);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <MiseEnPageAuth
      titre="Connexion"
      sousTitre="Retrouvez vos commandes, factures et conversations avec l’équipe MateMedical."
    >
      <form onSubmit={soumettre} className="mt-7 space-y-4">
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

        <ChampMotDePasse
          label="Mot de passe"
          value={motDePasse}
          onChange={setMotDePasse}
          autoComplete="current-password"
          placeholder="Votre mot de passe"
        />

        {erreur && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-xl bg-violet-marque py-3 text-sm font-semibold text-white transition hover:bg-violet-fonce disabled:opacity-60"
        >
          {enCours ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href={lienInscription(suivant)} className="font-semibold text-violet-marque hover:underline">
          Créer un compte
        </Link>
      </p>
    </MiseEnPageAuth>
  );
}

export default function PageConnexion() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-slate-500">Chargement...</div>}>
      <FormulaireConnexion />
    </Suspense>
  );
}
