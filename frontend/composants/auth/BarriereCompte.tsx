"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { lienConnexion, lienInscription } from "@/lib/compte";
import { useClient } from "@/store/contexteClient";

export function BarriereCompte({
  titre,
  description,
  children,
}: {
  titre: string;
  description: string;
  children?: ReactNode;
}) {
  const { compteReel, chargement } = useClient();
  const chemin = typeof window === "undefined" ? "/" : window.location.pathname;

  if (chargement) return null;
  if (compteReel && children) return children;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-clair text-violet-marque">
        <LockKeyhole className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-slate-900">{titre}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={lienConnexion(chemin)}
          className="rounded-xl bg-violet-marque px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce"
        >
          Se connecter
        </Link>
        <Link
          href={lienInscription(chemin)}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Créer un compte
        </Link>
      </div>
      <Link href="/produits" className="mt-5 inline-block text-sm font-medium text-violet-marque hover:underline">
        Continuer à parcourir le catalogue
      </Link>
    </div>
  );
}
