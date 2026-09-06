"use client";

import { useEffect, useState } from "react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { formaterDate } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import type { ClientAdmin } from "@/types/modeles";

export default function PageClientsAdmin() {
  const [clients, setClients] = useState<ClientAdmin[]>([]);

  useEffect(() => {
    appelerApi<{ clients: ClientAdmin[] }>("/admin/clients")
      .then((donnees) => setClients(donnees.clients))
      .catch(() => setClients([]));
  }, []);

  return (
    <MiseEnPageAdmin titre="Clients" sousTitre="Comptes clients inscrits">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
          <article key={client.id} className="rounded-2xl border border-bleu-hero bg-white p-4">
            <div className="flex items-center gap-3">
              <img
                src={client.photoProfil ?? "https://i.pravatar.cc/80?img=20"}
                alt={client.nomComplet}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">{client.nomSociete || client.nomComplet}</p>
                <p className="truncate text-xs text-slate-500">{client.email}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>
                <dt>Commandes</dt>
                <dd className="text-sm font-semibold text-slate-800">{client.nombreCommandes}</dd>
              </div>
              <div>
                <dt>Conversations</dt>
                <dd className="text-sm font-semibold text-slate-800">{client.nombreConversations}</dd>
              </div>
              <div className="col-span-2">
                <dt>Inscrit le</dt>
                <dd>{formaterDate(client.dateCreation)}</dd>
              </div>
              {client.ville && (
                <div className="col-span-2">
                  <dt>Ville</dt>
                  <dd>{client.ville}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
      </div>
      {clients.length === 0 && <p className="text-sm text-slate-400">Aucun client inscrit.</p>}
    </MiseEnPageAdmin>
  );
}
