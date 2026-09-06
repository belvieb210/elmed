"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { TableauFacturesEnAttente } from "@/composants/admin/TableauFacturesEnAttente";
import { formaterDate } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import type { ClientAdmin } from "@/types/modeles";

export default function PageClientsAdmin() {
  const routeur = useRouter();
  const [clients, setClients] = useState<ClientAdmin[]>([]);
  const [recherche, setRecherche] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [motDePasseTemporaire, setMotDePasseTemporaire] = useState<string | null>(null);
  const [formulaire, setFormulaire] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    nomSociete: "",
    ville: "",
    adresse: "",
  });

  useEffect(() => {
    appelerApi<{ clients: ClientAdmin[] }>("/admin/clients")
      .then((donnees) => setClients(donnees.clients))
      .catch(() => setClients([]));
  }, []);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return clients;
    return clients.filter((client) =>
      [client.nomComplet, client.nomSociete, client.email, client.telephone, client.ville]
        .filter(Boolean)
        .some((valeur) => String(valeur).toLowerCase().includes(terme)),
    );
  }, [clients, recherche]);

  async function creerClient(evenement: FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const donnees = await appelerApi<{ client: ClientAdmin; motDePasseTemporaire: string }>("/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          ...formulaire,
          telephone: formulaire.telephone || undefined,
          nomSociete: formulaire.nomSociete || undefined,
          ville: formulaire.ville || undefined,
          adresse: formulaire.adresse || undefined,
        }),
      });
      setMotDePasseTemporaire(donnees.motDePasseTemporaire);
      sessionStorage.setItem("mm_mdp_client", donnees.motDePasseTemporaire);
      routeur.push(`/admin/clients/${donnees.client.id}`);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Création impossible.");
      setEnCours(false);
    }
  }

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
          onClick={() => setFormulaireOuvert((actuel) => !actuel)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-fonce"
        >
          <Plus className="h-4 w-4" />
          Nouveau client
        </button>
      </div>

      {formulaireOuvert && (
        <form onSubmit={creerClient} className="mb-5 rounded-2xl border border-bleu-hero bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Nouveau client</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Champ label="Prénom" value={formulaire.prenom} onChange={(valeur) => setFormulaire({ ...formulaire, prenom: valeur })} requis />
            <Champ label="Nom" value={formulaire.nom} onChange={(valeur) => setFormulaire({ ...formulaire, nom: valeur })} requis />
            <Champ label="Email" type="email" value={formulaire.email} onChange={(valeur) => setFormulaire({ ...formulaire, email: valeur })} requis />
            <Champ label="Téléphone" value={formulaire.telephone} onChange={(valeur) => setFormulaire({ ...formulaire, telephone: valeur })} />
            <Champ label="Société" value={formulaire.nomSociete} onChange={(valeur) => setFormulaire({ ...formulaire, nomSociete: valeur })} />
            <Champ label="Ville" value={formulaire.ville} onChange={(valeur) => setFormulaire({ ...formulaire, ville: valeur })} />
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
              Adresse
              <input
                value={formulaire.adresse}
                onChange={(e) => setFormulaire({ ...formulaire, adresse: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-bleu-hero px-3 py-2.5 text-sm outline-none"
              />
            </label>
          </div>
          {erreur && <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}
          {motDePasseTemporaire && (
            <p className="mt-3 text-sm text-slate-600">
              Mot de passe temporaire : <strong>{motDePasseTemporaire}</strong>
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={enCours}
              className="rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {enCours ? "Création..." : "Créer et facturer"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtres.map((client) => (
          <article key={client.id} className="rounded-2xl border border-bleu-hero bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1e3a8a] text-sm font-semibold text-white">
                {initials(client.nomComplet)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">{client.nomSociete || client.nomComplet}</p>
                <p className="truncate text-xs text-slate-500">{client.email}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>
                <dt>Commandes</dt>
                <dd className="text-sm font-semibold text-slate-800">{client.nombreCommandes ?? 0}</dd>
              </div>
              <div>
                <dt>Inscrit le</dt>
                <dd className="text-sm font-semibold text-slate-800">{formaterDate(client.dateCreation)}</dd>
              </div>
              {client.telephone && (
                <div className="col-span-2">
                  <dt>Téléphone</dt>
                  <dd>{client.telephone}</dd>
                </div>
              )}
            </dl>
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
    </MiseEnPageAdmin>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = "text",
  requis = false,
}: {
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  type?: string;
  requis?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        required={requis}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-bleu-hero px-3 py-2.5 text-sm outline-none"
      />
    </label>
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
