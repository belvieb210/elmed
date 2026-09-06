"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, MessageCircle, TrendingUp, Users } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { classeStatut, formaterMontant, formaterRelatif, libelleStatutCommande } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { useClient } from "@/store/contexteClient";
import type { TableauAdmin } from "@/types/modeles";

export function PageTableauDeBordAdmin() {
  const { utilisateur } = useClient();
  const [tableau, setTableau] = useState<TableauAdmin | null>(null);

  useEffect(() => {
    appelerApi<{ tableau: TableauAdmin }>("/admin/tableau")
      .then((donnees) => setTableau(donnees.tableau))
      .catch(() => undefined);
  }, []);

  const prenom = utilisateur?.prenom ?? "l'équipe";

  return (
    <MiseEnPageAdmin titre="Tableau de bord" sousTitre={`Bienvenue, ${prenom}`}>
      {!tableau ? (
        <p className="text-sm text-slate-500">Chargement des indicateurs...</p>
      ) : (
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CarteStat
              titre="Commandes"
              valeur={String(tableau.statistiques.commandesAujourdhui)}
              detail="Aujourd'hui"
              icone={ClipboardList}
              couleur="bg-blue-50 text-blue-600"
            />
            <CarteStat
              titre="Clients"
              valeur={String(tableau.statistiques.clientsTotal)}
              detail="Total"
              icone={Users}
              couleur="bg-emerald-50 text-emerald-600"
            />
            <CarteStat
              titre="Messages"
              valeur={String(tableau.statistiques.messagesNonLus)}
              detail="Non lus"
              icone={MessageCircle}
              couleur="bg-violet-clair text-violet-marque"
            />
            <CarteStat
              titre="Chiffre d'affaires"
              valeur={formaterMontant(tableau.statistiques.chiffreAffaires)}
              detail="Ce mois"
              icone={TrendingUp}
              couleur="bg-rose-50 text-rose-600"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-12">
            <article className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5 xl:col-span-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Commandes récentes</h2>
                <Link href="/admin/commandes" className="text-sm font-medium text-violet-marque hover:underline">
                  Voir toutes
                </Link>
              </div>
              <div className="-mx-1 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-slate-400">
                    <tr>
                      <th className="px-2 py-2 font-medium">N°</th>
                      <th className="px-2 py-2 font-medium">Client</th>
                      <th className="px-2 py-2 font-medium">Montant</th>
                      <th className="px-2 py-2 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableau.commandesRecentes.map((commande) => (
                      <tr key={commande.id} className="border-t border-bleu-hero">
                        <td className="px-2 py-3">
                          <Link href={`/admin/commandes/${commande.id}`} className="font-medium text-slate-800">
                            #{commande.numeroCommande}
                          </Link>
                        </td>
                        <td className="px-2 py-3 text-slate-600">{commande.nomClient}</td>
                        <td className="px-2 py-3 font-medium">{formaterMontant(commande.montantTotal)}</td>
                        <td className="px-2 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${classeStatut(commande.statut)}`}>
                            {commande.libelleStatut || libelleStatutCommande(commande.statut)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5 xl:col-span-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Messages non lus</h2>
                <Link href="/admin/messagerie" className="text-sm font-medium text-violet-marque hover:underline">
                  Voir tous
                </Link>
              </div>
              <div className="space-y-3">
                {tableau.messages.length === 0 && (
                  <p className="text-sm text-slate-400">Aucun message pour le moment.</p>
                )}
                {tableau.messages.map((message) => (
                  <Link
                    key={message.conversationId}
                    href={`/admin/messagerie?conversation=${message.conversationId}`}
                    className="flex items-start gap-3 rounded-xl p-2 hover:bg-slate-50"
                  >
                    <img
                      src={message.photoProfil ?? "https://i.pravatar.cc/80?img=15"}
                      alt={message.nomClient}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-800">{message.nomClient}</p>
                        <span className="shrink-0 text-[11px] text-slate-400">{formaterRelatif(message.date)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{message.extrait}</p>
                    </div>
                    {message.nonLus > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-marque text-[10px] font-semibold text-white">
                        {message.nonLus}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5 xl:col-span-3">
              <h2 className="mb-4 text-base font-semibold text-slate-800">Statistiques des ventes</h2>
              <p className="mb-3 text-xs text-slate-400">7 derniers jours</p>
              <GraphiqueVentes points={tableau.ventes} />
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-12">
            <article className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5 lg:col-span-7">
              <h2 className="mb-4 text-base font-semibold text-slate-800">Activité récente</h2>
              <ol className="space-y-3">
                {tableau.activites.map((activite) => (
                  <li key={activite.id} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-marque" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{activite.titre}</p>
                      <p className="text-xs text-slate-500">{activite.detail}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{formaterRelatif(activite.date)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>

            <article className="rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5 lg:col-span-5">
              <h2 className="mb-4 text-base font-semibold text-slate-800">Répartition des commandes</h2>
              <RepartitionCommandes repartition={tableau.repartition} />
            </article>
          </section>
        </div>
      )}
    </MiseEnPageAdmin>
  );
}

function CarteStat({
  titre,
  valeur,
  detail,
  icone: Icone,
  couleur,
}: {
  titre: string;
  valeur: string;
  detail: string;
  icone: typeof ClipboardList;
  couleur: string;
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-bleu-hero bg-white px-4 py-4">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${couleur}`}>
        <Icone className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{titre}</p>
        <p className="text-2xl font-semibold tracking-tight text-slate-900">{valeur}</p>
        <p className="text-xs text-slate-400">{detail}</p>
      </div>
    </article>
  );
}

function GraphiqueVentes({ points }: { points: Array<{ libelle: string; montant: number }> }) {
  const max = Math.max(...points.map((point) => point.montant), 1);
  const largeur = 280;
  const hauteur = 140;
  const pas = largeur / Math.max(points.length - 1, 1);
  const coords = points.map((point, index) => {
    const x = index * pas;
    const y = hauteur - (point.montant / max) * 110 - 10;
    return `${x},${y}`;
  });

  return (
    <div>
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="h-36 w-full">
        <polyline fill="none" stroke="#5b4fe8" strokeWidth="3" points={coords.join(" ")} />
        {points.map((point, index) => (
          <circle key={point.libelle} cx={index * pas} cy={hauteur - (point.montant / max) * 110 - 10} r="4" fill="#5b4fe8" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        {points.map((point) => (
          <span key={point.libelle}>{point.libelle}</span>
        ))}
      </div>
    </div>
  );
}

function RepartitionCommandes({
  repartition,
}: {
  repartition: { total: number; enAttente: number; validees: number; annulees: number };
}) {
  const total = Math.max(repartition.total, 1);
  const segments = [
    { libelle: "En attente", valeur: repartition.enAttente, couleur: "#34d399" },
    { libelle: "Validées", valeur: repartition.validees, couleur: "#86efac" },
    { libelle: "Annulées", valeur: repartition.annulees, couleur: "#f87171" },
  ];
  let angle = 0;
  const arcs = segments.map((segment) => {
    const portion = segment.valeur / total;
    const debut = angle;
    angle += portion * 360;
    return { ...segment, debut, fin: angle };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 120 120" className="h-40 w-40">
        {arcs.map((arc) => (
          <circle
            key={arc.libelle}
            cx="60"
            cy="60"
            r="42"
            fill="transparent"
            stroke={arc.couleur}
            strokeWidth="16"
            strokeDasharray={`${(arc.fin - arc.debut) * 2.64} 264`}
            strokeDashoffset={-arc.debut * 2.64}
            transform="rotate(-90 60 60)"
          />
        ))}
        <text x="60" y="56" textAnchor="middle" className="fill-slate-900" fontSize="18" fontWeight="700">
          {repartition.total}
        </text>
        <text x="60" y="72" textAnchor="middle" className="fill-slate-400" fontSize="8">
          commandes
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.libelle} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: segment.couleur }} />
            <span className="text-slate-600">{segment.libelle}</span>
            <span className="font-semibold text-slate-800">{segment.valeur}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
