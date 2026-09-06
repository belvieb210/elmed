"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, SlidersHorizontal } from "lucide-react";
import { FormulaireNouveauClient } from "@/composants/admin/FormulaireNouveauClient";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { TableauFacturesEnAttente } from "@/composants/admin/TableauFacturesEnAttente";
import { formaterHeure } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import type { ClientAdmin } from "@/types/modeles";

export default function PageClientsAdmin() {
  const routeur = useRouter();
  const [clients, setClients] = useState<ClientAdmin[]>([]);
  const [recherche, setRecherche] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);

  useEffect(() => {
    appelerApi<{ clients: ClientAdmin[] }>("/admin/clients")
      .then((donnees) => setClients(donnees.clients))
      .catch(() => setClients([]));
  }, []);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return clients;
    return clients.filter((client) =>
      [client.nomComplet, client.nomSociete, client.email, client.telephone, client.ville, client.numeroClient]
        .filter(Boolean)
        .some((valeur) => String(valeur).toLowerCase().includes(terme)),
    );
  }, [clients, recherche]);

  const recents = clients.slice(0, 8);

  return (
    <MiseEnPageAdmin titre="Clients" sousTitre="Ajouter un client et établir sa facture">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un client, une société, un email..."
          className="w-full rounded-xl border border-bleu-hero bg-white px-3 py-2.5 text-sm outline-none sm:max-w-md"
        />
        <button
          type="button"
          onClick={() => setFormulaireOuvert(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce"
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </button>
      </div>

      {formulaireOuvert && (
        <FormulaireNouveauClient
          onAnnuler={() => setFormulaireOuvert(false)}
          onCree={(client, motDePasse) => {
            sessionStorage.setItem("mm_mdp_client", motDePasse);
            routeur.push(`/admin/clients/${client.id}`);
          }}
        />
      )}

      {formulaireOuvert && (
        <section className="mb-6 overflow-hidden rounded-2xl border border-bleu-hero bg-white">
          <div className="flex items-center justify-between border-b border-bleu-hero px-4 py-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Clients récemment enregistrés
              </h2>
              <p className="mt-1 text-xs text-slate-400">{recents.length} client(s) dans le registre</p>
            </div>
            <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-bleu-hero text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-violet-marque text-[10px] text-white">
                0
              </span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">N° client</th>
                  <th className="px-4 py-3 font-medium">Nom complet</th>
                  <th className="px-4 py-3 font-medium">Téléphone</th>
                  <th className="px-4 py-3 font-medium">Établissement</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Heure</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recents.map((client) => (
                  <tr key={client.id} className="border-t border-bleu-hero">
                    <td className="px-4 py-3 text-slate-500">{client.numeroClient || "—"}</td>
                    <td className="px-4 py-3 font-semibold uppercase text-slate-800">{client.nomComplet}</td>
                    <td className="px-4 py-3 text-slate-500">{client.telephone || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{client.nomSociete || "Client"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                        Enregistré
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formaterHeure(client.dateCreation)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="rounded-lg border border-bleu-hero p-1.5 text-slate-600"
                          aria-label="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-slate-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Facturer
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recents.length === 0 && <p className="px-4 py-6 text-sm text-slate-400">Aucun client enregistré pour le moment.</p>}
        </section>
      )}

      {!formulaireOuvert && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtres.map((client) => (
              <article key={client.id} className="rounded-2xl border border-bleu-hero bg-white p-4">
                <div className="flex items-center gap-3">
                  {client.photoProfil ? (
                    <img src={client.photoProfil} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white">
                      {initials(client.nomComplet)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{client.nomSociete || client.nomComplet}</p>
                    <p className="truncate text-xs text-slate-500">{client.email}</p>
                  </div>
                </div>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-violet-marque px-3 py-2 text-sm font-semibold text-white hover:bg-violet-fonce"
                >
                  Établir une facture
                </Link>
              </article>
            ))}
          </div>
          {filtres.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucun client trouvé.</p>}
          <div className="mt-8">
            <TableauFacturesEnAttente />
          </div>
        </>
      )}
    </MiseEnPageAdmin>
  );
}

function initials(nom: string) {
  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();
}
