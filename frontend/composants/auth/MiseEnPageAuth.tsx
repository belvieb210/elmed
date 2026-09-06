import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, MessageSquareText, PackageSearch, ShoppingBag } from "lucide-react";
import { LogoMateMedical } from "@/composants/LogoMateMedical";

const argumentsGauche = [
  {
    icone: PackageSearch,
    titre: "Parcourir le catalogue",
    texte: "Consultez les produits médicaux sans créer de compte.",
  },
  {
    icone: ShoppingBag,
    titre: "Commander et payer",
    texte: "Ajoutez au panier, commandez et réglez en quelques minutes.",
  },
  {
    icone: MessageSquareText,
    titre: "Compte pour le suivi",
    texte: "L’historique des commandes et la messagerie restent liés à votre compte.",
  },
];

export function MiseEnPageAuth({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#2b2a7a_0%,#4f46c7_48%,#5b4fe8_100%)] px-10 py-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-sky-300/10 blur-3xl" />
        <Link href="/" className="relative z-10 inline-flex items-center gap-2 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-lg font-semibold">M</span>
          <span className="text-xl font-semibold tracking-tight">MateMedical</span>
        </Link>
        <div className="relative z-10 mt-16 max-w-md">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">Espace professionnel</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">Fournitures médicales, commande simplifiée</h1>
          <p className="mt-4 text-sm leading-6 text-white/80">
            Achetez comme sur une grande plateforme B2B : le catalogue est ouvert, le compte sert à suivre et à
            échanger avec notre équipe.
          </p>
        </div>
        <ul className="relative z-10 mt-10 space-y-4">
          {argumentsGauche.map((item) => {
            const Icone = item.icone;
            return (
              <li key={item.titre} className="flex gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.titre}</span>
                  <span className="mt-1 block text-sm leading-5 text-white/75">{item.texte}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="relative z-10 mt-auto flex items-center gap-2 pt-10 text-sm text-white/70">
          <Lock className="h-4 w-4" />
          Session sécurisée · mot de passe jamais affiché par défaut
        </p>
      </aside>

      <main className="flex flex-col bg-fond-page px-4 py-6 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden">
            <LogoMateMedical />
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-500 transition hover:text-violet-marque">
            Continuer sans compte
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
          <div className="rounded-3xl border border-bleu-hero bg-white p-6 shadow-[0_20px_50px_rgba(31,41,55,0.08)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{titre}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{sousTitre}</p>
            {children}
          </div>
          <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-400">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-marque" />
            En commandant, vous acceptez nos conditions de vente. Un compte n’est demandé que pour l’historique et la
            messagerie.
          </p>
        </div>
      </main>
    </div>
  );
}
