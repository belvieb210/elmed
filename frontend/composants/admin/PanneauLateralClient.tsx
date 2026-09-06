"use client";

import { CalendarPlus, Printer, Search } from "lucide-react";

export type ApercuClient = {
  id?: string;
  nom: string;
  prenom: string;
  postNom: string;
  sexe: string;
  age: string;
  telephone: string;
  nomSociete: string;
  photo: string | null;
  numeroClient: string;
  dateEnregistrement: string;
  email?: string;
  ville?: string;
};

export function PanneauLateralClient({
  apercu,
  enregistrePar,
  onRechercher,
  onImprimer,
  onFacturer,
}: {
  apercu: ApercuClient;
  enregistrePar: string;
  onRechercher: () => void;
  onImprimer: () => void;
  onFacturer: () => void;
}) {
  const nomComplet = [apercu.nom, apercu.postNom, apercu.prenom].filter(Boolean).join(" ").trim() || "Nouveau client";
  const initials = nomComplet
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join("")
    .toUpperCase();

  const lignes = [
    { label: "Âge", valeur: apercu.age ? `${apercu.age} ans${apercu.sexe ? ` / ${apercu.sexe.toUpperCase()}` : ""}` : apercu.sexe || "—" },
    { label: "Post-nom", valeur: apercu.postNom || "—" },
    { label: "Téléphone", valeur: apercu.telephone || "—" },
    { label: "Email", valeur: apercu.email || "—" },
    { label: "Établissement", valeur: apercu.nomSociete || "—" },
    { label: "Ville", valeur: apercu.ville || "—" },
    { label: "N° client", valeur: apercu.numeroClient || "—" },
    { label: "Enregistrement", valeur: apercu.dateEnregistrement || "—" },
    { label: "Enregistré par", valeur: enregistrePar },
  ];

  return (
    <aside className="space-y-4">
      <article className="rounded-2xl border border-bleu-hero bg-white p-5 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Résumé du client</h2>
        {apercu.photo ? (
          <img src={apercu.photo} alt="" className="mx-auto mt-4 h-24 w-24 rounded-full object-cover" />
        ) : (
          <span className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full bg-[#1e3a8a] text-xl font-semibold text-white">
            {initials || "CL"}
          </span>
        )}
        <p className="mt-3 text-base font-semibold uppercase text-[#1e3a8a]">{nomComplet}</p>
        <p className="mt-1 text-sm text-slate-400">{apercu.numeroClient || "N° en cours"}</p>
        <dl className="mt-5 space-y-2.5 text-left text-sm">
          {lignes.map((ligne) => (
            <div key={ligne.label} className="flex items-start justify-between gap-3">
              <dt className="text-slate-400">{ligne.label}</dt>
              <dd className="text-right font-medium text-[#1e3a8a]">{ligne.valeur}</dd>
            </div>
          ))}
        </dl>
      </article>

      <article className="rounded-2xl border border-bleu-hero bg-white p-5">
        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Actions rapides</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <BoutonAction icone={Search} libelle="Rechercher client" onClick={onRechercher} />
          <BoutonAction icone={Printer} libelle="Imprimer fiche" onClick={onImprimer} />
          <BoutonAction icone={CalendarPlus} libelle="Établir facture" onClick={onFacturer} />
        </div>
      </article>
    </aside>
  );
}

function BoutonAction({
  icone: Icone,
  libelle,
  onClick,
}: {
  icone: typeof Search;
  libelle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-bleu-hero bg-slate-50 px-2 py-3 text-center text-xs font-semibold text-[#1e3a8a] hover:bg-white"
    >
      <Icone className="h-5 w-5" />
      {libelle}
    </button>
  );
}

