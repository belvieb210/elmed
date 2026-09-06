"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, Upload, UserRound, X } from "lucide-react";
import { appelerApi } from "@/lib/api";
import type { ApercuClient } from "@/composants/admin/PanneauLateralClient";
import type { ClientAdmin } from "@/types/modeles";

const parcoursClients = ["Nouveau client", "Ancien client", "Commande urgente", "Rendez-vous"] as const;

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
  clientsExistants,
  clientAModifier,
  parcoursForce,
  onAnnuler,
  onCree,
  onModifie,
  onSelectionnerAncien,
  onApercu,
}: {
  clientsExistants: ClientAdmin[];
  clientAModifier?: ClientAdmin | null;
  parcoursForce?: (typeof parcoursClients)[number] | null;
  onAnnuler: () => void;
  onCree: (client: ClientAdmin, motDePasseTemporaire: string) => void;
  onModifie: (client: ClientAdmin) => void;
  onSelectionnerAncien: (client: ClientAdmin) => void;
  onApercu: (apercu: ApercuClient) => void;
}) {
  const maintenant = useMemo(() => new Date(), []);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [parcours, setParcours] = useState<(typeof parcoursClients)[number]>("Nouveau client");
  const [listeParcoursOuverte, setListeParcoursOuverte] = useState(false);
  const [rechercheAncien, setRechercheAncien] = useState("");
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
  const [clientSelectionneId, setClientSelectionneId] = useState<string | undefined>();

  const numeroApercu = `${maintenant.getFullYear()}${String(maintenant.getMonth() + 1).padStart(2, "0")}${String(maintenant.getDate()).padStart(2, "0")}…`;
  const dateTexte = maintenant.toLocaleDateString("fr-FR");
  const heureTexte = maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const anciens = useMemo(() => {
    const terme = rechercheAncien.trim().toLowerCase();
    if (terme.length < 2) return [];
    return clientsExistants
      .filter((client) =>
        [client.nomComplet, client.prenom, client.nom, client.telephone, client.numeroClient, client.nomSociete]
          .filter(Boolean)
          .some((valeur) => String(valeur).toLowerCase().includes(terme)),
      )
      .slice(0, 8);
  }, [clientsExistants, rechercheAncien]);

  const ancienClient = parcours === "Ancien client";
  const enModification = Boolean(clientAModifier);

  useEffect(() => {
    if (!parcoursForce) return;
    setParcours(parcoursForce);
  }, [parcoursForce]);

  useEffect(() => {
    if (!clientAModifier) return;
    const ficheExistante = ficheDepuisClient(clientAModifier);
    setIdentite({
      nom: (clientAModifier.nom ?? clientAModifier.nomComplet).toUpperCase(),
      prenom: clientAModifier.prenom ?? "",
      email: clientAModifier.email.includes("@clients.elmed.local") ? "" : clientAModifier.email,
      telephone: clientAModifier.telephone ?? "",
      nomSociete: clientAModifier.nomSociete ?? "",
      adresse: clientAModifier.adresse ?? "",
      ville: clientAModifier.ville ?? "",
    });
    setFiche(ficheExistante);
    setPhoto(clientAModifier.photoProfil);
    setClientSelectionneId(clientAModifier.id);
    const type = ficheExistante.typeClient;
    if (type === "Commande urgente" || type === "Rendez-vous") {
      setParcours(type);
    } else {
      setParcours("Nouveau client");
    }
  }, [clientAModifier]);

  useEffect(() => {
    onApercu({
      id: clientSelectionneId,
      nom: identite.nom,
      prenom: identite.prenom,
      postNom: fiche.postNom,
      sexe: fiche.sexe,
      age: fiche.age,
      telephone: identite.telephone,
      nomSociete: identite.nomSociete,
      photo,
      numeroClient:
        clientsExistants.find((client) => client.id === clientSelectionneId)?.numeroClient ?? numeroApercu,
      dateEnregistrement: `${dateTexte} ${heureTexte}`,
    });
  }, [identite, fiche, photo, numeroApercu, dateTexte, heureTexte, clientSelectionneId, onApercu]);

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
    if (fichier.size > 10 * 1024 * 1024) {
      setErreur("La photo ne doit pas dépasser 10 Mo.");
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
    const corps = {
      prenom: identite.prenom,
      nom: identite.nom,
      email: identite.email || undefined,
      telephone: identite.telephone || undefined,
      nomSociete: identite.nomSociete || fiche.typeClient || undefined,
      adresse: identite.adresse || undefined,
      ville: identite.ville || undefined,
      photoProfil: photo || undefined,
      fiche: { ...fiche, typeClient: parcours },
    };
    try {
      if (clientAModifier) {
        const donnees = await appelerApi<{ client: ClientAdmin }>(`/admin/clients/${clientAModifier.id}`, {
          method: "PUT",
          body: JSON.stringify(corps),
        });
        setClientSelectionneId(donnees.client.id);
        onModifie(donnees.client);
        setEnCours(false);
        return;
      }
      const donnees = await appelerApi<{ client: ClientAdmin; motDePasseTemporaire: string }>("/admin/clients", {
        method: "POST",
        body: JSON.stringify(corps),
      });
      setClientSelectionneId(donnees.client.id);
      onCree(donnees.client, donnees.motDePasseTemporaire);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : "Enregistrement impossible.");
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-5 rounded-2xl border border-bleu-hero bg-white p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-[#1e3a8a]">Informations personnelles</h2>
        <p className="mt-1 text-sm text-violet-marque">{enModification ? "Modifier le client" : parcours}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ChampLecture
          label="N° client (permanent)"
          valeur={clientAModifier?.numeroClient || numeroApercu}
        />
        <ChampLecture label="Date" valeur={dateTexte} />
        <ChampLecture label="Heure" valeur={heureTexte} />
      </div>

      <div className={`grid gap-4 ${ancienClient ? "" : "md:grid-cols-3"}`}>
        <div className="relative">
          <p className={label}>Type de client</p>
          {ancienClient ? (
            <div className="mt-1.5">
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={rechercheAncien}
                  onChange={(e) => setRechercheAncien(e.target.value)}
                  placeholder="Rechercher client (nom, n° client, téléphone)"
                  className={`${champ} pl-9 pr-10`}
                />
                {rechercheAncien && (
                  <button
                    type="button"
                    onClick={() => setRechercheAncien("")}
                    className="absolute right-3 top-3 text-slate-400"
                    aria-label="Effacer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </span>
              {anciens.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {anciens.map((client) => (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectionnerAncien(client);
                          setRechercheAncien("");
                          setClientSelectionneId(client.id);
                          setIdentite({
                            nom: (client.nom ?? client.nomComplet).toUpperCase(),
                            prenom: client.prenom ?? "",
                            email: client.email,
                            telephone: client.telephone ?? "",
                            nomSociete: client.nomSociete ?? "",
                            adresse: client.adresse ?? "",
                            ville: client.ville ?? "",
                          });
                          setPhoto(client.photoProfil);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-bleu-hero bg-white px-3 py-2.5 text-left hover:bg-slate-50"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold uppercase text-slate-800">
                            {client.nomComplet}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {client.numeroClient || "Sans n°"} · {client.telephone || "Sans téléphone"}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {rechercheAncien.trim().length >= 2 && anciens.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">Aucun ancien client trouvé.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setParcours("Nouveau client");
                  setRechercheAncien("");
                }}
                className="mt-2 text-sm font-semibold text-[#1e3a8a]"
              >
                Nouveau client
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setListeParcoursOuverte((actuel) => !actuel)}
                className={`${champ} flex items-center justify-between text-left`}
              >
                <span>{parcours}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {listeParcoursOuverte && (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-bleu-hero bg-white shadow-lg">
                  {parcoursClients.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        onClick={() => {
                          setParcours(option);
                          setListeParcoursOuverte(false);
                        }}
                        className={`block w-full px-3 py-2.5 text-left text-sm ${
                          parcours === option ? "bg-bleu-hero text-white" : "text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        {!ancienClient && (
          <>
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
          </>
        )}
      </div>

      {!ancienClient && (
      <>
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
                <span className="mt-1 text-xs text-slate-400">PNG, JPG — max 10 Mo</span>
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
          {enCours ? "Enregistrement..." : enModification ? "Enregistrer les modifications" : "Enregistrer le client"}
        </button>
      </div>
      </>
      )}
    </form>
  );
}

function ficheDepuisClient(client: ClientAdmin): Fiche {
  const fiche = client.fiche ?? {};
  return {
    typeClient: String(fiche.typeClient ?? ""),
    postNom: String(fiche.postNom ?? ""),
    sexe: fiche.sexe === "Féminin" || fiche.sexe === "Masculin" ? fiche.sexe : "",
    jourNaissance: String(fiche.jourNaissance ?? ""),
    moisNaissance: String(fiche.moisNaissance ?? ""),
    anneeNaissance: String(fiche.anneeNaissance ?? ""),
    age: String(fiche.age ?? ""),
    telephoneSecondaire: String(fiche.telephoneSecondaire ?? ""),
    etatCivil: String(fiche.etatCivil ?? "Célibataire"),
    commune: String(fiche.commune ?? ""),
    pays: String(fiche.pays ?? "RDC"),
    contactPro: String(fiche.contactPro ?? ""),
    telPro: String(fiche.telPro ?? ""),
    fonction: String(fiche.fonction ?? ""),
    secteur: String(fiche.secteur ?? ""),
    numeroRccm: String(fiche.numeroRccm ?? ""),
    numeroPiece: String(fiche.numeroPiece ?? ""),
    observations: String(fiche.observations ?? ""),
  };
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
