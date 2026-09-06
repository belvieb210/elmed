"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { LogoMateMedical } from "@/composants/LogoMateMedical";
import { libelleRole } from "@/lib/formatage";
import { useClient } from "@/store/contexteClient";

const liens = [
  { href: "/admin", libelle: "Tableau de bord", icone: LayoutDashboard },
  { href: "/admin/commandes", libelle: "Commandes", icone: ClipboardList, badge: "commandes" as const },
  { href: "/admin/messagerie", libelle: "Messagerie", icone: MessageCircle, badge: "messages" as const },
  { href: "/admin/clients", libelle: "Clients", icone: UserRound },
  { href: "/admin/produits", libelle: "Produits", icone: Package },
  { href: "/admin/documents", libelle: "Documents", icone: FileText },
  { href: "/admin/utilisateurs", libelle: "Utilisateurs", icone: Users },
  { href: "/admin/parametres", libelle: "Paramètres", icone: Settings },
];

export function BarreLateraleAdmin({
  commandesAujourdhui = 0,
  messagesNonLus = 0,
}: {
  commandesAujourdhui?: number;
  messagesNonLus?: number;
}) {
  const chemin = usePathname();
  const { utilisateur, menuMobileOuvert, definirMenuMobileOuvert, deconnecter } = useClient();

  function valeurBadge(type?: "commandes" | "messages") {
    if (type === "commandes") return commandesAujourdhui;
    if (type === "messages") return messagesNonLus;
    return 0;
  }

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
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(300px,88vw)] flex-col overflow-hidden border-2 border-bleu-hero bg-white px-4 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-[8px_0_32px_rgba(79,116,255,0.16)] transition-transform duration-200 lg:w-[280px] lg:border-y-0 lg:border-l-0 lg:border-r-2 lg:shadow-none ${
          menuMobileOuvert ? "translate-x-0" : "-translate-x-full"
        } rounded-r-[2rem] lg:translate-x-0 lg:rounded-none`}
      >
        <div className="mb-5 flex items-start justify-between px-1">
          <div>
            <LogoMateMedical />
            <p className="mt-1 pl-[3.25rem] text-xs font-medium text-slate-400">Administration</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 lg:hidden"
            onClick={() => definirMenuMobileOuvert(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <img
            src={utilisateur?.photoProfil ?? "https://i.pravatar.cc/80?img=12"}
            alt={utilisateur?.nomComplet ?? "Gestionnaire"}
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {utilisateur?.nomComplet ?? "Équipe ELMED"}
            </p>
            <p className="text-xs text-slate-400">{libelleRole(utilisateur?.role)}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {liens.map((lien) => {
            const actif = lien.href === "/admin" ? chemin === "/admin" : chemin.startsWith(lien.href);
            const Icone = lien.icone;
            const compteur = valeurBadge(lien.badge);

            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
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
                  <span className="grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                    {compteur}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={deconnecter}
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Déconnexion
        </button>
      </aside>
    </>
  );
}
