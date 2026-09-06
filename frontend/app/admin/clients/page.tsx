"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, SlidersHorizontal } from "lucide-react";
import { FormulaireNouveauClient } from "@/composants/admin/FormulaireNouveauClient";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import {
  filtresVides,
  nombreFiltresActifs,
  PanneauFiltresClients,
  type FiltresClients,
} from "@/composants/admin/PanneauFiltresClients";
import { PanneauLateralClient, type ApercuClient } from "@/composants/admin/PanneauLateralClient";
import { formaterDateHeure, formaterHeure } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { useClient } from "@/store/contexteClient";
import type { ClientAdmin } from "@/types/modeles";

const apercuVide: ApercuClient = {
  nom: "",
  prenom: "",
  postNom: "",
  sexe: "",
  age: "",
  telephone: "",
  nomSociete: "",
  photo: null,
  numeroClient: "",
  dateEnregistrement: "",
  email: "",
  ville: "",
};

export default function PageClientsAdmin() {
  const routeur = useRouter();
  const { utilisateur } = useClient();
  const [clients, setClients] = useState<ClientAdmin[]>([]);
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [filtres, setFiltres] = useState<FiltresClients>(filtresVides);
  const [filtresAppliques, setFiltresAppliques] = useState<FiltresClients>(filtresVides);
  const [recentsSession, setRecentsSession] = useState<ClientAdmin[]>([]);
  const [apercu, setApercu] = useState<ApercuClient>(apercuVide);
  const [clientAfficheId, setClientAfficheId] = useState<string | null>(null);
  const [parcoursForce, setParcoursForce] = useState<"Ancien client" | null>(null);
  const [cleFormulaire, setCleFormulaire] = useState(0);

  const enregistrerApercu = useCallback((suivant: ApercuClient) => {
    setApercu((actuel) => (actuel.id ? actuel : suivant));
  }, []);

  function afficherClient(client: ClientAdmin) {
    setClientAfficheId(client.id);
    setApercu(apercuDepuisClient(client));
  }

  useEffect(() => {
    appelerApi<{ clients: ClientAdmin[] }>("/admin/clients")
      .then((donnees) => setClients(donnees.clients))
      .catch(() => setClients([]));
  }, []);

  const recents = useMemo(() => {
    const fusion = [...recentsSession, ...clients.filter((client) => !recentsSession.some((item) => item.id === client.id))];
    return fusion
      .filter((client) => correspondFiltres(client, filtresAppliques, recentsSession.some((item) => item.id === client.id)))
      .slice(0, 12);
  }, [clients, recentsSession, filtresAppliques]);

  const actifs = nombreFiltresActifs(filtresAppliques);

  function ajouterRecent(client: ClientAdmin) {
    setRecentsSession((actuels) => [client, ...actuels.filter((item) => item.id !== client.id)]);
  }

  return (
    <MiseEnPageAdmin titre="Clients" sousTitre="Enregistrer un client et établir sa facture">
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <FormulaireNouveauClient
            key={cleFormulaire}
            clientsExistants={clients}
            parcoursForce={parcoursForce}
            onApercu={enregistrerApercu}
            onAnnuler={() => {
              setCleFormulaire((actuel) => actuel + 1);
              setApercu(apercuVide);
              setClientAfficheId(null);
              setParcoursForce(null);
            }}
            onCree={(client, motDePasse) => {
              sessionStorage.setItem("mm_mdp_client", motDePasse);
              ajouterRecent(client);
              setClients((actuels) => [client, ...actuels.filter((item) => item.id !== client.id)]);
              afficherClient(client);
            }}
            onSelectionnerAncien={(client) => {
              ajouterRecent(client);
              afficherClient(client);
            }}
          />
        </div>
        <div className="xl:col-span-4">
          <PanneauLateralClient
            apercu={apercu}
            enregistrePar={utilisateur?.nomComplet || "Équipe ELMED"}
            onRechercher={() => {
              setParcoursForce(null);
              requestAnimationFrame(() => setParcoursForce("Ancien client"));
            }}
            onImprimer={() => window.print()}
            onFacturer={() => {
              if (apercu.id) routeur.push(`/admin/clients/${apercu.id}`);
            }}
          />
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-bleu-hero bg-white">
        <div className="flex items-center justify-between border-b border-bleu-hero px-4 py-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Clients récemment enregistrés
            </h2>
            <p className="mt-1 text-xs text-slate-400">{recents.length} client(s) dans le registre</p>
          </div>
          <button
            type="button"
            onClick={() => setFiltresOuverts((actuel) => !actuel)}
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-bleu-hero text-slate-500"
            aria-label="Filtrer les clients"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-violet-marque text-[10px] text-white">
              {actifs}
            </span>
          </button>
        </div>
        {filtresOuverts && (
          <PanneauFiltresClients
            filtres={filtres}
            onChange={setFiltres}
            onRechercher={() => {
              setFiltresAppliques(filtres);
              setFiltresOuverts(false);
            }}
            onReinitialiser={() => {
              setFiltres(filtresVides);
              setFiltresAppliques(filtresVides);
            }}
          />
        )}
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
              {recents.map((client) => {
                const selectionne = recentsSession.some((item) => item.id === client.id);
                const affiche = clientAfficheId === client.id;
                return (
                  <tr
                    key={client.id}
                    onClick={() => afficherClient(client)}
                    className={`cursor-pointer border-t border-bleu-hero ${affiche ? "bg-sky-50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-3 text-slate-500">{client.numeroClient || "—"}</td>
                    <td className="px-4 py-3 font-semibold uppercase text-slate-800">{client.nomComplet}</td>
                    <td className="px-4 py-3 text-slate-500">{client.telephone || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{client.nomSociete || "Client"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          selectionne || affiche ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {affiche ? "Affiché" : selectionne ? "Sélectionné" : "Enregistré"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formaterHeure(client.dateCreation)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            afficherClient(client);
                          }}
                          className="rounded-lg border border-bleu-hero p-1.5 text-slate-600"
                          aria-label="Voir le résumé"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/admin/clients/${client.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-slate-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Facturer
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {recents.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-400">Aucun client ne correspond à ces filtres.</p>
        )}
      </section>
    </MiseEnPageAdmin>
  );
}

function apercuDepuisClient(client: ClientAdmin): ApercuClient {
  const fiche = client.fiche ?? {};
  return {
    id: client.id,
    nom: client.nom ?? client.nomComplet,
    prenom: client.prenom ?? "",
    postNom: String(fiche.postNom ?? ""),
    sexe: String(fiche.sexe ?? ""),
    age: String(fiche.age ?? ""),
    telephone: client.telephone ?? "",
    nomSociete: client.nomSociete ?? "",
    photo: client.photoProfil,
    numeroClient: client.numeroClient ?? client.numeroDossier ?? "",
    dateEnregistrement: formaterDateHeure(client.dateCreation),
    email: client.email,
    ville: client.ville ?? "",
  };
}

function correspondFiltres(client: ClientAdmin, filtres: FiltresClients, selectionne: boolean) {
  const nom = (client.nom ?? client.nomComplet.split(" ").slice(-1)[0] ?? "").toLowerCase();
  const prenom = (client.prenom ?? client.nomComplet.split(" ")[0] ?? "").toLowerCase();
  if (filtres.nom && !nom.includes(filtres.nom.trim().toLowerCase())) return false;
  if (filtres.prenom && !prenom.includes(filtres.prenom.trim().toLowerCase())) return false;
  if (filtres.telephone && !(client.telephone ?? "").includes(filtres.telephone.trim())) return false;
  if (filtres.numeroClient && !(client.numeroClient ?? "").toLowerCase().includes(filtres.numeroClient.trim().toLowerCase())) {
    return false;
  }
  if (
    filtres.etablissement !== "Toutes" &&
    !(client.nomSociete ?? "").toLowerCase().includes(filtres.etablissement.toLowerCase())
  ) {
    return false;
  }
  const date = new Date(client.dateCreation);
  if (filtres.du && date < new Date(`${filtres.du}T00:00:00`)) return false;
  if (filtres.au && date > new Date(`${filtres.au}T23:59:59`)) return false;
  if (filtres.statut === "Sélectionné" && !selectionne) return false;
  if (filtres.statut === "Enregistré" && selectionne) return false;
  return true;
}
