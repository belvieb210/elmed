"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMateMedical } from "@/composants/LogoMateMedical";
import { useClient } from "@/store/contexteClient";

export default function PageConnexion() {
  const routeur = useRouter();
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
      await connecter(email, motDePasse);
      routeur.push("/");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-fond-page px-4">
      <form
        onSubmit={soumettre}
        className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8"
      >
        <LogoMateMedical />
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">Connexion client</h1>
        <p className="mt-2 text-sm text-slate-500">
          Accédez à vos commandes, factures et à la messagerie MateMedical.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-marque"
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          Mot de passe
          <input
            type="password"
            value={motDePasse}
            autoComplete="current-password"
            onChange={(e) => setMotDePasse(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-marque"
            required
          />
        </label>

        {erreur && <p className="mt-3 text-sm text-red-600">{erreur}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="mt-6 w-full rounded-xl bg-violet-marque py-3 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
        >
          {enCours ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
