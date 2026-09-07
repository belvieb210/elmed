"use client";

import Link from "next/link";
import { FileText, Pin } from "lucide-react";
import { formaterMontant, formaterTailleFichier, formaterHeure } from "@/lib/formatage";
import type { ClientDiscussion, CommandeDiscussion, FichierConversation } from "@/types/modeles";

export function PanneauFicheClient({
  client,
  fichiers,
  commandes,
}: {
  client: ClientDiscussion;
  fichiers: FichierConversation[];
  commandes: CommandeDiscussion[];
}) {
  const epingles = fichiers.filter((fichier) => fichier.epingle);
  const medias = fichiers.slice(0, 8);

  return (
    <aside className="flex min-h-0 flex-col overflow-y-auto border-t border-bleu-hero bg-white lg:border-l lg:border-t-0">
      <div className="px-4 py-5 text-center">
        {client.photoProfil ? (
          <img src={client.photoProfil} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-marque text-lg font-semibold text-white">
            {client.initials || client.nomComplet.slice(0, 2).toUpperCase()}
          </span>
        )}
        <h3 className="mt-3 text-sm font-semibold text-slate-900">{client.nomComplet}</h3>
        <p className="text-xs text-slate-500">{client.nomSociete || "Client"}</p>
        {client.numeroClient && <p className="mt-1 text-[11px] text-slate-400">N° {client.numeroClient}</p>}
        <p className="mt-2 text-xs text-slate-500">
          {client.email}
          {client.telephone ? ` · ${client.telephone}` : ""}
        </p>
        {client.ville && <p className="text-xs text-slate-400">{client.ville}</p>}
      </div>

      {epingles.length > 0 && (
        <section className="border-t border-bleu-hero px-4 py-3">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Pin className="h-3 w-3" /> Épinglés
          </p>
          <div className="mt-2 space-y-2">
            {epingles.map((fichier) => (
              <CarteFichier key={fichier.id} fichier={fichier} />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-bleu-hero px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Médias et fichiers</p>
          <span className="text-[11px] text-slate-400">{fichiers.length}</span>
        </div>
        {medias.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">Aucun fichier joint pour l’instant.</p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {medias.map((fichier) =>
              fichier.typeMessage === "IMAGE" && fichier.url ? (
                <a key={fichier.id} href={fichier.url} target="_blank" rel="noreferrer">
                  <img src={fichier.url} alt={fichier.nom} className="h-20 w-full rounded-xl object-cover" />
                </a>
              ) : (
                <CarteFichier key={fichier.id} fichier={fichier} />
              ),
            )}
          </div>
        )}
      </section>

      <section className="border-t border-bleu-hero px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Commandes</p>
        {commandes.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">Aucune commande pour ce client.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {commandes.map((commande) => (
              <Link
                key={commande.id}
                href={`/admin/commandes`}
                className="block overflow-hidden rounded-2xl border border-bleu-hero bg-white"
              >
                {commande.lignes[0]?.image && (
                  <img src={commande.lignes[0].image} alt="" className="h-24 w-full object-cover" />
                )}
                <div className="p-3">
                  <p className="text-xs font-semibold text-violet-marque">{commande.numeroCommande}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-800">
                    {commande.lignes[0]?.nom ?? "Commande"}
                  </p>
                  <p className="mt-1 text-base font-bold">{formaterMontant(commande.montantTotal)}</p>
                  {commande.lignes[0]?.sku && (
                    <p className="text-[11px] text-slate-400">SKU : {commande.lignes[0].sku}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">{formaterHeure(commande.dateCommande)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="mt-auto px-4 py-4 text-[11px] leading-5 text-slate-400">
        Les échanges sont réservés au personnel autorisé. Ne partagez jamais de données patient sensibles hors protocole
        établi.
      </p>
    </aside>
  );
}

function CarteFichier({ fichier }: { fichier: FichierConversation }) {
  return (
    <a
      href={fichier.url ?? "#"}
      download={fichier.nom}
      className="flex items-center gap-2 rounded-xl border border-bleu-hero bg-white px-2 py-2"
    >
      <FileText className="h-5 w-5 shrink-0 text-rose-500" />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-slate-700">{fichier.nom}</span>
        <span className="text-[10px] text-slate-400">{formaterTailleFichier(fichier.taille)}</span>
      </span>
    </a>
  );
}
