"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MessageCircle, Search, ShoppingCart } from "lucide-react";
import { lienConnexion, lienInscription, lienMessagerie } from "@/lib/compte";
import { useClient } from "@/store/contexteClient";

export function EnTete() {
  const routeur = useRouter();
  const chemin = usePathname();
  const { utilisateur, compteReel, badges, definirMenuMobileOuvert } = useClient();
  const [texteRecherche, setTexteRecherche] = useState("");

  function soumettreRecherche(evenement: FormEvent) {
    evenement.preventDefault();
    const terme = texteRecherche.trim();
    routeur.push(terme ? `/produits?recherche=${encodeURIComponent(terme)}` : "/produits");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[var(--hauteur-en-tete)] border-b-2 border-bleu-hero bg-white px-3 pt-[env(safe-area-inset-top)] sm:px-4 lg:left-[270px] lg:px-6">
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          className="rounded-xl border border-bleu-hero p-2 text-bleu-hero lg:hidden"
          onClick={() => definirMenuMobileOuvert(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={soumettreRecherche} className="masque-recherche flex min-w-0 flex-1 items-center">
          <div className="flex w-full items-center overflow-hidden rounded-full border border-bleu-hero bg-white">
            <Search className="ml-4 hidden h-4 w-4 text-slate-400 sm:block" />
            <input
              value={texteRecherche}
              onChange={(e) => setTexteRecherche(e.target.value)}
              placeholder="Rechercher un produit..."
              className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-400 sm:h-11"
            />
            <button
              type="submit"
              className="m-1 rounded-full bg-violet-marque px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-fonce sm:px-5 sm:py-2"
            >
              <span className="sm:hidden">OK</span>
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </div>
        </form>

        <Link
          href="/panier"
          className="relative rounded-full p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Panier"
        >
          <ShoppingCart className="h-5 w-5" />
          {badges.nombreArticlesPanier > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-violet-marque text-[10px] font-semibold text-white">
              {badges.nombreArticlesPanier}
            </span>
          )}
        </Link>

        <Link
          href={lienMessagerie(compteReel)}
          className="relative rounded-full p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5" />
          {compteReel && badges.messagesNonLus > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-violet-marque text-[10px] font-semibold text-white">
              {badges.messagesNonLus}
            </span>
          )}
        </Link>

        {compteReel ? (
          <Link href="/profil" className="hidden items-center gap-2 pl-1 sm:flex">
            <img
              src={utilisateur?.photoProfil ?? "https://i.pravatar.cc/80?img=12"}
              alt={utilisateur?.nomComplet ?? "Client"}
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="hidden leading-tight md:block">
              <span className="block text-sm font-semibold text-slate-800">
                {utilisateur?.nomComplet ?? "Client"}
              </span>
              <span className="block text-xs text-slate-400">Client</span>
            </span>
          </Link>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href={lienConnexion(chemin)}
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Connexion
            </Link>
            <Link
              href={lienInscription(chemin)}
              className="rounded-full bg-violet-marque px-3.5 py-2 text-sm font-semibold text-white hover:bg-violet-fonce"
            >
              S&apos;inscrire
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
