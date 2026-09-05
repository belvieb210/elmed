"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  FolderTree,
  HelpCircle,
  Home,
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { LogoMateMedical } from "@/composants/LogoMateMedical";
import { useClient } from "@/store/contexteClient";

const liens = [
  { href: "/", libelle: "Accueil", icone: Home },
  { href: "/produits", libelle: "Produits", icone: Package },
  { href: "/categories", libelle: "Catégories", icone: FolderTree },
  { href: "/panier", libelle: "Panier", icone: ShoppingCart, badge: "panier" as const },
  { href: "/commandes", libelle: "Mes commandes", icone: ClipboardList },
  { href: "/messagerie", libelle: "Messagerie", icone: MessageCircle, badge: "messages" as const },
  { href: "/notifications", libelle: "Notifications", icone: Bell, badge: "notifications" as const },
  { href: "/profil", libelle: "Mon profil", icone: UserRound },
  { href: "/parametres", libelle: "Paramètres", icone: Settings },
  { href: "/aide", libelle: "Aide & Contact", icone: HelpCircle },
];

export function BarreLaterale() {
  const chemin = usePathname();
  const { badges, menuMobileOuvert, definirMenuMobileOuvert } = useClient();

  const valeurBadge = (type?: "panier" | "messages" | "notifications") => {
    if (type === "panier") return badges.nombreArticlesPanier;
    if (type === "messages") return badges.messagesNonLus;
    if (type === "notifications") return badges.notificationsNonLues;
    return 0;
  };

  return (
    <>
      {menuMobileOuvert && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => definirMenuMobileOuvert(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-100 bg-white px-4 py-5 transition-transform duration-200 lg:static lg:translate-x-0 ${
          menuMobileOuvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-1">
          <LogoMateMedical />
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 lg:hidden"
            onClick={() => definirMenuMobileOuvert(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {liens.map((lien) => {
            const actif = chemin === lien.href;
            const Icone = lien.icone;
            const compteur = valeurBadge(lien.badge);

            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  actif
                    ? "bg-violet-clair text-violet-marque"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icone className="h-[18px] w-[18px]" />
                  {lien.libelle}
                </span>
                {compteur > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-full bg-violet-marque px-1.5 text-[10px] font-semibold text-white">
                    {compteur}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-2xl bg-[#f4f1ff] p-4">
          <p className="text-sm font-semibold text-slate-800">Besoin d&apos;aide ?</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Notre équipe vous répond en direct pour vos commandes et documents.
          </p>
          <Link
            href="/messagerie"
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-violet-marque px-3 py-2.5 text-sm font-medium text-white transition hover:bg-violet-fonce"
          >
            Ouvrir le chat
          </Link>
        </div>
      </aside>
    </>
  );
}
