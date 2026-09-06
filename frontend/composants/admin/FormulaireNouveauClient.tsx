"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search, Upload } from "lucide-react";
import { appelerApi } from "@/lib/api";
import type { ClientAdmin } from "@/types/modeles";

const typesClient = [
  "Hôpital",
  "Clinique",
  "Pharmacie",
  "Laboratoire",
  "Cabinet médical",
  "ONG / Projet",
  "Grossiste",
  "Centre de santé",
  "Autre",
];

const etatsCivils = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"];
const secteurs = ["Hôpital public", "Clinique privée", "Pharmacie", "Laboratoire", "ONG", "Grossiste", "Autre"];
const paysListe = ["RDC", "Congo", "Rwanda", "Ouganda", "Angola", "Autre"];

const champ =
  "mt-1.5 w-full rounded-2xl border border-bleu-hero bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400";
const label = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

type Fiche = {
  typeClient: string;
  postNom: string;
  sexe: "Masculin" | "Féminin" | "";
  jourNaissance: string;
  moisNaissance: string;
  anneeNaissance: string;
  age: string;
  telephoneSecondaire: string;
  etatCivil: string;
  commune: string;
  pays: string;
  contactPro: string;
  telPro: string;
  fonction: string;
  secteur: string;
  numeroRccm: string;
  numeroPiece: string;
  observations: string;
};

const ficheVide: Fiche = {
  typeClient: "",
  postNom: "",
  sexe: "",
  jourNaissance: "",
  moisNaissance: "",
  anneeNaissance: "",
  age: "",
  telephoneSecondaire: "",
  etatCivil: "Célibataire",
  commune: "",
  pays: "RDC",
  contactPro: "",
  telPro: "",
  fonction: "",
  secteur: "",
  numeroRccm: "",
  numeroPiece: "",
  observations: "",
};

export function FormulaireNouveauClient({
  onAnnuler,
  onCree,
}: {
  onAnnuler: () => void;
  onCree: (client: ClientAdmin, motDePasseTemporaire: string) => void;
}) {
  const maintenant = useMemo(() => new Date(), []);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [rechercheType, setRechercheType] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [identite, setIdentite] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    nomSociete: "",
    adresse: "",
    ville: "",
  });
  const [fiche, setFiche] = useState<Fiche>(ficheVide);

  const numeroApercu = `${maintenant.getFullYear()}${String(maintenant.getMonth() + 1).padStart(2, "0")}${String(maintenant.getDate()).padStart(2, "0")}…`;
  const dateTexte = maintenant.toLocaleDateString("fr-FR");
  const heureTexte = maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const typesFiltres = typesClient.filter((type) => type.toLowerCase().includes(rechercheType.toLowerCase()));

  function mettreFiche<K extends keyof Fiche>(cle: K, valeur: Fiche[K]) {
    setFiche((actuelle) => {
      const suivante = { ...actuelle, [cle]: valeur };
      if (cle === "jourNaissance" || cle === "moisNaissance" || cle === "anneeNaissance") {
        const jour = Number(cle === "jourNaissance" ? valeur : actuelle.jourNaissance);
        const mois = Number(cle === "moisNaissance" ? valeur : actuelle.moisNaissance);
        const annee = Number(cle === "anneeNaissance" ? valeur : actuelle.anneeNaissance);
        if (jour && mois && annee >= 1900) {
          const naissance = new Date(annee, mois - 1, jour);
          const age = maintenant.getFullYear() - naissance.getFullYear();
          suivante.age = String(Math.max(0, age));
        }
      }
      return suivante;
    });
  }

  function chargerPhoto(fichier?: File) {
    if (!fichier) return;
    if (fichier.size > 2 * 1024 * 1024) {
      setErreur("La photo ne doit pas dépasser 2 Mo.");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => setPhoto(typeof lecteur.result === "string" ? lecteur.result : null);
    lecteur.readAsDataURL(fichier);
  }

  async function soumettre(evenement: FormEvent) {
    evenement.preventDefault();
    if (!fiche.sexe) {
      setErreur("Sélectionnez le sexe du contact.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const donnees = await appelerApi<{ client: ClientAdmin; motDePasseTemporaire: string }>("/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          prenom: identite.prenom,
          nom: identite.nom,
          email: identite.email || undefined,
          telephone: identite.telephone || undefined,
          nomSociete: identite.nomSociete || fiche.typeClient || undefined,
          adresse: identite.adresse || undefined,
          ville: identite.ville || undefined,
          photoProfil: photo || undefined,
          fiche,
        }),
      });
      onCree(donnees.client, donnees.motDePasseTemporaire);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Enregistrement impossible.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="mb-6 space-y-5 rounded-2xl border border-bleu-hero bg-white p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1e3a8a]">Informations personnelles</h2>
        <p className="mt-1 text-sm text-violet-marque">Nouveau client</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ChampLecture label="N° client (permanent)" valeur={numeroApercu} />
        <ChampLecture label="Date" valeur={dateTexte} />
        <ChampLecture label="Heure" valeur={heureTexte} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className={label}>Type de client</span>
          <span className="relative mt-1.5 block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              list="types-client"
              value={rechercheType || fiche.typeClient}
              onChange={(e) => {
                setRechercheType(e.target.value);
                mettreFiche("typeClient", e.target.value);
              }}
              placeholder="Rechercher un type..."
              className={`${champ} pl-9`}
            />
            <datalist id="types-client">
              {typesFiltres.map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </span>
        </label>
        <Champ
          label="Nom"
          requis
          value={identite.nom}
          placeholder="KABAMBA"
          onChange={(valeur) => setIdentite({ ...identite, nom: valeur.toUpperCase() })}
        />
        <Champ
          label="Prénom"
          requis
          value={identite.prenom}
          placeholder="Grâce"
          onChange={(valeur) => setIdentite({ ...identite, prenom: valeur })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Champ label="Post-nom" value={fiche.postNom} onChange={(valeur) => mettreFiche("postNom", valeur)} />
        <div>
          <p className={label}>
            Sexe<span className="text-red-500">*</span>
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(["Masculin", "Féminin"] as const).map((sexe) => (
              <button
                key={sexe}
                type="button"
                onClick={() => mettreFiche("sexe", sexe)}
                className={`rounded-2xl border px-3 py-2.5 text-sm ${
                  fiche.sexe === sexe
                    ? "border-2 border-bleu-hero font-semibold text-slate-900"
                    : "border-bleu-hero text-slate-500"
                }`}
              >
                {sexe}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={label}>Date de naissance</p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <input value={fiche.jourNaissance} onChange={(e) => mettreFiche("jourNaissance", e.target.value)} placeholder="Jour" className={champ} />
            <input value={fiche.moisNaissance} onChange={(e) => mettreFiche("moisNaissance", e.target.value)} placeholder="Mois" className={champ} />
            <input value={fiche.anneeNaissance} onChange={(e) => mettreFiche("anneeNaissance", e.target.value)} placeholder="Année" className={champ} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Champ label="Âge (années)" value={fiche.age} placeholder="Ex. 32" onChange={(valeur) => mettreFiche("age", valeur)} />
        <Champ label="Téléphone" value={identite.telephone} placeholder="+243..." onChange={(valeur) => setIdentite({ ...identite, telephone: valeur })} />
        <Champ label="Téléphone secondaire" value={fiche.telephoneSecondaire} placeholder="+243..." onChange={(valeur) => mettreFiche("telephoneSecondaire", valeur)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Champ label="Email" type="email" value={identite.email} placeholder="email@exemple.com" onChange={(valeur) => setIdentite({ ...identite, email: valeur })} />
        <label className="block">
          <span className={label}>État civil</span>
          <select value={fiche.etatCivil} onChange={(e) => mettreFiche("etatCivil", e.target.value)} className={champ}>
            {etatsCivils.map((etat) => (
              <option key={etat}>{etat}</option>
            ))}
          </select>
        </label>
      </div>

      <Champ
        label="Adresse"
        value={identite.adresse}
        placeholder="123, Avenue de la Paix..."
        onChange={(valeur) => setIdentite({ ...identite, adresse: valeur })}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Champ label="Commune" value={fiche.commune} onChange={(valeur) => mettreFiche("commune", valeur)} />
        <Champ label="Ville" value={identite.ville} onChange={(valeur) => setIdentite({ ...identite, ville: valeur })} />
        <label className="block">
          <span className={label}>Pays</span>
          <select value={fiche.pays} onChange={(e) => mettreFiche("pays", e.target.value)} className={champ}>
            {paysListe.map((pays) => (
              <option key={pays}>{pays}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="pt-2">
        <h3 className="text-base font-semibold text-[#1e3a8a]">Informations complémentaires</h3>
        <p className="mt-1 text-sm text-slate-400">Tous les champs ci-dessous sont optionnels.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Champ label="Contact professionnel" value={fiche.contactPro} onChange={(valeur) => mettreFiche("contactPro", valeur)} />
        <Champ label="Tél. professionnel" value={fiche.telPro} onChange={(valeur) => mettreFiche("telPro", valeur)} />
        <Champ label="Fonction" value={fiche.fonction} onChange={(valeur) => mettreFiche("fonction", valeur)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Champ
          label="Établissement / société"
          value={identite.nomSociete}
          onChange={(valeur) => setIdentite({ ...identite, nomSociete: valeur })}
        />
        <label className="block">
          <span className={label}>Secteur d&apos;activité</span>
          <select value={fiche.secteur} onChange={(e) => mettreFiche("secteur", e.target.value)} className={champ}>
            <option value="">Sélectionner</option>
            {secteurs.map((secteur) => (
              <option key={secteur}>{secteur}</option>
            ))}
          </select>
        </label>
        <Champ label="N° RCCM / Id. nat." value={fiche.numeroRccm} onChange={(valeur) => mettreFiche("numeroRccm", valeur)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Champ label="N° pièce d'identité" value={fiche.numeroPiece} onChange={(valeur) => mettreFiche("numeroPiece", valeur)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className={label}>Photo / logo du client</span>
          <span className="mt-1.5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-bleu-hero bg-slate-50 px-4 text-center text-sm text-slate-500">
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => chargerPhoto(e.target.files?.[0])} />
            {photo ? (
              <img src={photo} alt="Aperçu" className="h-24 w-24 rounded-xl object-cover" />
            ) : (
              <>
                <Upload className="mb-2 h-6 w-6 text-bleu-hero" />
                Glisser-déposer ou cliquer
                <span className="mt-1 text-xs text-slate-400">PNG, JPG — max 2 Mo</span>
              </>
            )}
          </span>
        </label>
        <label className="block">
          <span className={label}>Observations</span>
          <textarea
            value={fiche.observations}
            onChange={(e) => mettreFiche("observations", e.target.value)}
            placeholder="Notes complémentaires..."
            rows={6}
            className={champ}
          />
        </label>
      </div>

      {erreur && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onAnnuler}
          className="rounded-xl border border-bleu-hero px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-xl bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {enCours ? "Enregistrement..." : "Enregistrer le client"}
        </button>
      </div>
    </form>
  );
}

function ChampLecture({ label: libelle, valeur }: { label: string; valeur: string }) {
  return (
    <label className="block">
      <span className={label}>{libelle}</span>
      <input readOnly value={valeur} className={`${champ} bg-slate-50`} />
    </label>
  );
}

function Champ({
  label: libelle,
  value,
  onChange,
  placeholder,
  type = "text",
  requis = false,
}: {
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  type?: string;
  requis?: boolean;
}) {
  return (
    <label className="block">
      <span className={label}>
        {libelle}
        {requis && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        required={requis}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={champ}
      />
    </label>
  );
}
