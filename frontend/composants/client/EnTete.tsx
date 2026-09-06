"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, MessageCircle, Search, ShoppingCart } from "lucide-react";
import { useClient } from "@/store/contexteClient";

export function EnTete() {
  const routeur = useRouter();
  const { utilisateur, badges, definirMenuMobileOuvert } = useClient();
  const [texteRecherche, setTexteRecherche] = useState("");

  function soumettreRecherche(evenement: FormEvent) {
    evenement.preventDefault();
    const terme = texteRecherche.trim();
    routeur.push(terme ? `/produits?recherche=${encodeURIComponent(terme)}` : "/produits");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur sm:px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
          onClick={() => definirMenuMobileOuvert(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={soumettreRecherche} className="masque-recherche flex min-w-0 flex-1 items-center">
          <div className="flex w-full items-center overflow-hidden rounded-full border border-slate-200 bg-white">
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
          href="/messagerie"
          className="relative rounded-full p-2 text-slate-600 hover:bg-slate-50"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5" />
          {badges.messagesNonLus > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-violet-marque text-[10px] font-semibold text-white">
              {badges.messagesNonLus}
            </span>
          )}
        </Link>

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
      </div>
    </header>
  );
}
