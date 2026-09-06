"use client";

import { Search } from "lucide-react";

export type FiltresClients = {
  du: string;
  au: string;
  nom: string;
  prenom: string;
  telephone: string;
  numeroClient: string;
  etablissement: string;
  statut: string;
};

export const filtresVides: FiltresClients = {
  du: "",
  au: "",
  nom: "",
  prenom: "",
  telephone: "",
  numeroClient: "",
  etablissement: "Toutes",
  statut: "Tous",
};

const champ =
  "mt-1.5 w-full rounded-xl border border-bleu-hero bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400";
const label = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

export function nombreFiltresActifs(filtres: FiltresClients) {
  return [
    filtres.du,
    filtres.au,
    filtres.nom,
    filtres.prenom,
    filtres.telephone,
    filtres.numeroClient,
    filtres.etablissement !== "Toutes" ? filtres.etablissement : "",
    filtres.statut !== "Tous" ? filtres.statut : "",
  ].filter(Boolean).length;
}

export function PanneauFiltresClients({
  filtres,
  onChange,
  onRechercher,
  onReinitialiser,
}: {
  filtres: FiltresClients;
  onChange: (filtres: FiltresClients) => void;
  onRechercher: () => void;
  onReinitialiser: () => void;
}) {
  function champTexte(cle: keyof FiltresClients, valeur: string) {
    onChange({ ...filtres, [cle]: valeur });
  }

  return (
    <div className="border-b border-bleu-hero bg-white px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className={label}>Du (date)</span>
          <input type="date" value={filtres.du} onChange={(e) => champTexte("du", e.target.value)} className={champ} />
        </label>
        <label className="block">
          <span className={label}>Au (date)</span>
          <input type="date" value={filtres.au} onChange={(e) => champTexte("au", e.target.value)} className={champ} />
        </label>
        <label className="block">
          <span className={label}>Nom</span>
          <input value={filtres.nom} onChange={(e) => champTexte("nom", e.target.value)} placeholder="Ex. KABILA" className={champ} />
        </label>
        <label className="block">
          <span className={label}>Prénom</span>
          <input value={filtres.prenom} onChange={(e) => champTexte("prenom", e.target.value)} placeholder="Ex. Joseph" className={champ} />
        </label>
        <label className="block">
          <span className={label}>Téléphone</span>
          <input value={filtres.telephone} onChange={(e) => champTexte("telephone", e.target.value)} placeholder="Ex. 089..." className={champ} />
        </label>
        <label className="block">
          <span className={label}>N° client</span>
          <input value={filtres.numeroClient} onChange={(e) => champTexte("numeroClient", e.target.value)} placeholder="Ex. 20260906..." className={champ} />
        </label>
        <label className="block">
          <span className={label}>Type d&apos;établissement</span>
          <select value={filtres.etablissement} onChange={(e) => champTexte("etablissement", e.target.value)} className={champ}>
            <option>Toutes</option>
            <option>Hôpital</option>
            <option>Clinique</option>
            <option>Pharmacie</option>
            <option>Laboratoire</option>
            <option>Grossiste</option>
            <option>ONG / Projet</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Statut</span>
          <select value={filtres.statut} onChange={(e) => champTexte("statut", e.target.value)} className={champ}>
            <option>Tous</option>
            <option>Enregistré</option>
            <option>Sélectionné</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onReinitialiser}
          className="rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-medium text-[#1e3a8a]"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={onRechercher}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Search className="h-4 w-4" />
          Rechercher
        </button>
      </div>
    </div>
  );
}
