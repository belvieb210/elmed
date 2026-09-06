"use client";

import Link from "next/link";
import {
  FlaskConical,
  Layers,
  Microscope,
  Package,
  Pill,
  ShieldCheck,
} from "lucide-react";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { CarteProduit } from "@/composants/client/CarteProduit";
import { IllustrationLaboratoire } from "@/composants/accueil/IllustrationLaboratoire";
import { classeBadgePaiement } from "@/composants/commandes/suivi";
import { classeStatut, formaterDate, formaterMontant, libelleStatutCommande } from "@/lib/formatage";
import { useClient } from "@/store/contexteClient";

const iconesCategories: Record<string, typeof FlaskConical> = {
  flask: FlaskConical,
  microscope: Microscope,
  package: Package,
  pill: Pill,
  shield: ShieldCheck,
  layers: Layers,
};

export function PageAccueil() {
  const { tableauDeBord, utilisateur, compteReel } = useClient();
  if (!tableauDeBord) return null;

  const prenomNom = utilisateur?.nomComplet ?? "Client";
  const { statistiques, categories, produitsPopulaires, dernieresCommandes } = tableauDeBord;

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4f74ff] to-[#5b63f5] px-6 py-7 text-white shadow-sm xl:col-span-8">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              {compteReel ? `Bienvenue ${prenomNom}` : "Fournitures médicales professionnelles"}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/90 sm:text-base">
              {compteReel
                ? "Nous sommes là pour vous fournir les meilleurs produits médicaux et de laboratoire."
                : "Parcourez le catalogue, commandez et payez sans créer de compte. Un compte sert uniquement au suivi et à la messagerie."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/produits"
                className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#4f6bff] shadow-sm transition hover:bg-slate-50"
              >
                Voir les produits
              </Link>
              {!compteReel && (
                <Link
                  href="/inscription"
                  className="inline-flex rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Créer un compte
                </Link>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-2 bottom-0 hidden sm:block">
            <IllustrationLaboratoire />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-2">
          {compteReel ? (
            <>
              <CarteStat
                titre="Mes commandes"
                valeur={statistiques.nombreCommandes}
                lien="/commandes"
                libelleLien="Voir toutes"
              />
              <CarteStat
                titre="En attente"
                valeur={statistiques.nombreEnAttente}
                lien="/commandes?statut=EN_ATTENTE"
                libelleLien="Voir toutes"
              />
              <CarteStat
                titre="Commandes validées"
                valeur={statistiques.nombreValidees}
                lien="/commandes?statut=VALIDEE"
                libelleLien="Voir toutes"
              />
              <CarteStat
                titre="Payées"
                valeur={statistiques.nombrePayees ?? 0}
                lien="/commandes"
                libelleLien="Voir toutes"
              />
            </>
          ) : (
            <>
              <article className="rounded-2xl border border-slate-100 bg-white px-5 py-4 sm:col-span-2">
                <p className="text-sm font-semibold text-slate-800">Commander sans compte</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ajoutez des produits au panier, passez commande et payez. Pour retrouver l&apos;historique et
                  écrire à l&apos;équipe, créez un compte ensuite.
                </p>
                <Link href="/panier" className="mt-3 inline-block text-sm font-medium text-violet-marque hover:underline">
                  Ouvrir le panier
                </Link>
              </article>
              <article className="rounded-2xl border border-slate-100 bg-white px-5 py-4 sm:col-span-2">
                <p className="text-sm font-semibold text-slate-800">Compte client</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Messagerie, notifications et liste de commandes : réservées aux comptes.
                </p>
                <Link href="/connexion" className="mt-3 inline-block text-sm font-medium text-violet-marque hover:underline">
                  Se connecter
                </Link>
              </article>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 xl:col-span-8">
          <h2 className="text-base font-semibold text-slate-800">Catégories populaires</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((categorie) => {
              const Icone = iconesCategories[categorie.icone] ?? Package;
              return (
                <Link
                  key={categorie.id}
                  href={`/produits?categorie=${categorie.slug}`}
                  className="group flex flex-col items-center text-center"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-violet-clair text-violet-marque transition group-hover:bg-[#e4dcff]">
                    <Icone className="h-7 w-7" />
                  </span>
                  <span className="mt-2 text-xs font-medium text-slate-700">{categorie.nom}</span>
                  <span className="text-[11px] text-slate-400">{categorie.nombreProduits} produits</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 xl:col-span-4 xl:row-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              {compteReel ? "Mes dernières commandes" : "Suivi des commandes"}
            </h2>
            {compteReel && (
              <Link href="/commandes" className="text-sm font-medium text-violet-marque hover:underline">
                Voir toutes
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {!compteReel && (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm leading-6 text-slate-500">
                Connectez-vous pour voir l&apos;historique de vos commandes. Après un paiement sans compte, conservez
                le lien de confirmation pour suivre cette commande.
                <Link href="/connexion?suivant=%2Fcommandes" className="mt-3 block font-medium text-violet-marque hover:underline">
                  Accéder à mes commandes
                </Link>
              </div>
            )}
            {compteReel && dernieresCommandes.length === 0 && (
              <p className="text-sm text-slate-500">Aucune commande pour le moment.</p>
            )}
            {compteReel && dernieresCommandes.map((commande) => (
              <Link
                key={commande.id}
                href={`/commandes/${commande.id}`}
                className="block rounded-xl border border-slate-100 px-3 py-3 transition hover:border-violet-200 hover:bg-violet-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">#{commande.numeroCommande}</p>
                    <p className="mt-1 text-xs text-slate-400">{formaterDate(commande.dateCommande)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formaterMontant(commande.montantTotal)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${classeStatut(commande.statut)}`}
                    >
                      {libelleStatutCommande(commande.statut)}
                    </span>
                    {commande.paiement && (
                      <span
                        className={`mt-1 ml-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${classeBadgePaiement(commande.paiement.statut)}`}
                      >
                        {commande.paiement.libelleStatut}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 xl:col-span-8">
          <h2 className="text-base font-semibold text-slate-800">Produits populaires</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {produitsPopulaires.map((produit) => (
              <CarteProduit key={produit.id} produit={produit} />
            ))}
          </div>
        </section>
      </div>

      <BandeauMessagerie />
    </div>
  );
}

function CarteStat({
  titre,
  valeur,
  lien,
  libelleLien,
}: {
  titre: string;
  valeur: number;
  lien: string;
  libelleLien: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white px-5 py-4">
      <p className="text-sm text-slate-500">{titre}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{valeur}</p>
      <Link href={lien} className="mt-2 inline-block text-sm font-medium text-violet-marque hover:underline">
        {libelleLien}
      </Link>
    </article>
  );
}
