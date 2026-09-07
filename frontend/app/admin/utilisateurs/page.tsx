"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Pencil, Power, Upload, UserPlus } from "lucide-react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { libelleRole } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { estSuperAdmin } from "@/lib/roles";
import { useClient } from "@/store/contexteClient";
import type { PersonnelAdmin } from "@/types/modeles";

const champ =
  "mt-1.5 w-full rounded-2xl border border-bleu-hero bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none";
const label = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

const rolesBase = [
  { valeur: "ADMIN", libelle: "Admin" },
  { valeur: "SUPPORT", libelle: "Support" },
  { valeur: "DIRECTEUR", libelle: "Directeur" },
  { valeur: "COMMERCIAL", libelle: "Commercial" },
  { valeur: "COMPTABLE", libelle: "Comptable" },
  { valeur: "MAGASINIER", libelle: "Magasinier" },
  { valeur: "LIVREUR", libelle: "Livreur" },
] as const;

type FormPersonnel = {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  role: string;
  photoProfil: string;
  motDePasse: string;
};

const formVide: FormPersonnel = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  role: "SUPPORT",
  photoProfil: "",
  motDePasse: "",
};

export default function PageUtilisateursAdmin() {
  const { utilisateur } = useClient();
  const superAdmin = estSuperAdmin(utilisateur?.role);
  const peutGerer = superAdmin || utilisateur?.role === "ADMIN";

  const [utilisateurs, setUtilisateurs] = useState<PersonnelAdmin[]>([]);
  const [formulaire, setFormulaire] = useState<FormPersonnel>(formVide);
  const [aModifier, setAModifier] = useState<PersonnelAdmin | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [motDePasseAffiche, setMotDePasseAffiche] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const rolesDisponibles = useMemo(() => {
    const liste = [...rolesBase];
    if (superAdmin) {
      return [{ valeur: "SUPER_ADMIN", libelle: "Super Admin" }, ...liste];
    }
    return liste;
  }, [superAdmin]);

  const charger = useCallback(() => {
    appelerApi<{ utilisateurs: PersonnelAdmin[] }>("/admin/utilisateurs")
      .then((donnees) => setUtilisateurs(donnees.utilisateurs))
      .catch(() => setUtilisateurs([]));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function lirePhoto(fichier?: File) {
    if (!fichier) return;
    if (fichier.size > 3 * 1024 * 1024) {
      setErreur("La photo ne doit pas dépasser 3 Mo.");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      if (typeof lecteur.result === "string") {
        setFormulaire((actuel) => ({ ...actuel, photoProfil: lecteur.result as string }));
      }
    };
    lecteur.readAsDataURL(fichier);
  }

  function preparerEdition(personne: PersonnelAdmin) {
    setAModifier(personne);
    setFormulaire({
      prenom: personne.prenom,
      nom: personne.nom,
      email: personne.email,
      telephone: personne.telephone ?? "",
      role: personne.role,
      photoProfil: personne.photoProfil ?? "",
      motDePasse: "",
    });
    setMotDePasseAffiche(null);
    setErreur(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reinitialiser() {
    setAModifier(null);
    setFormulaire(formVide);
    setMotDePasseAffiche(null);
    setErreur(null);
  }

  async function soumettre(evenement: FormEvent) {
    evenement.preventDefault();
    if (!peutGerer) {
      setErreur("Seuls Admin et Super Admin peuvent gérer le personnel.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      if (aModifier) {
        const reponse = await appelerApi<{ utilisateur: PersonnelAdmin }>(
          `/admin/utilisateurs/${aModifier.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              prenom: formulaire.prenom,
              nom: formulaire.nom,
              email: formulaire.email,
              telephone: formulaire.telephone,
              role: formulaire.role,
              photoProfil: formulaire.photoProfil,
              actif: aModifier.actif,
            }),
          },
        );
        setUtilisateurs((actuels) =>
          actuels.map((item) => (item.id === reponse.utilisateur.id ? reponse.utilisateur : item)),
        );
        setMessage("Compte personnel mis à jour.");
        reinitialiser();
      } else {
        const reponse = await appelerApi<{
          utilisateur: PersonnelAdmin;
          motDePasseTemporaire: string;
          message: string;
        }>("/admin/utilisateurs", {
          method: "POST",
          body: JSON.stringify({
            prenom: formulaire.prenom,
            nom: formulaire.nom,
            email: formulaire.email,
            telephone: formulaire.telephone,
            role: formulaire.role,
            photoProfil: formulaire.photoProfil,
            motDePasse: formulaire.motDePasse || undefined,
          }),
        });
        setUtilisateurs((actuels) => [reponse.utilisateur, ...actuels]);
        setMotDePasseAffiche(reponse.motDePasseTemporaire);
        setMessage(reponse.message);
        setFormulaire(formVide);
        setAModifier(null);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  async function resetMotDePasse(personne: PersonnelAdmin) {
    if (!peutGerer) return;
    if (!window.confirm(`Réinitialiser le mot de passe de ${personne.nomComplet} ?`)) return;
    try {
      const reponse = await appelerApi<{ motDePasseTemporaire: string; message: string }>(
        `/admin/utilisateurs/${personne.id}/mot-de-passe`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setMotDePasseAffiche(reponse.motDePasseTemporaire);
      setMessage(`${reponse.message} (${personne.email})`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Réinitialisation impossible.");
    }
  }

  async function basculerActif(personne: PersonnelAdmin) {
    if (!peutGerer) return;
    try {
      const reponse = await appelerApi<{ utilisateur: PersonnelAdmin; message: string }>(
        `/admin/utilisateurs/${personne.id}/actif`,
        { method: "PATCH", body: JSON.stringify({}) },
      );
      setUtilisateurs((actuels) =>
        actuels.map((item) => (item.id === reponse.utilisateur.id ? reponse.utilisateur : item)),
      );
      setMessage(reponse.message);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Action impossible.");
    }
  }

  return (
    <MiseEnPageAdmin
      titre="Utilisateurs"
      sousTitre="Comptes personnel MateMedical (pas les clients)"
    >
      {(message || motDePasseAffiche) && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message && <p>{message}</p>}
          {motDePasseAffiche && (
            <p className="mt-2 font-mono text-base font-semibold">
              Mot de passe à communiquer : {motDePasseAffiche}
            </p>
          )}
          <p className="mt-1 text-xs text-emerald-700">
            L’utilisateur le changera ensuite dans Profil / Paramètres.
          </p>
        </div>
      )}
      {erreur && (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {erreur}
        </p>
      )}

      {peutGerer ? (
        <form
          onSubmit={soumettre}
          className="mb-6 space-y-4 rounded-2xl border border-bleu-hero bg-white p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[#1e3a8a]">
                {aModifier ? "Modifier le personnel" : "Ajouter un membre de l’équipe"}
              </h2>
              <p className="mt-1 text-sm text-violet-marque">
                Rôles : Admin, Super Admin, Support (et autres postes)
              </p>
            </div>
            <UserPlus className="h-5 w-5 text-bleu-hero" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={label}>Prénom *</span>
              <input
                className={champ}
                required
                value={formulaire.prenom}
                onChange={(e) => setFormulaire((a) => ({ ...a, prenom: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={label}>Nom *</span>
              <input
                className={champ}
                required
                value={formulaire.nom}
                onChange={(e) => setFormulaire((a) => ({ ...a, nom: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={label}>Email *</span>
              <input
                className={champ}
                type="email"
                required
                value={formulaire.email}
                onChange={(e) => setFormulaire((a) => ({ ...a, email: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={label}>Téléphone</span>
              <input
                className={champ}
                value={formulaire.telephone}
                onChange={(e) => setFormulaire((a) => ({ ...a, telephone: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className={label}>Rôle *</span>
              <select
                className={champ}
                value={formulaire.role}
                onChange={(e) => setFormulaire((a) => ({ ...a, role: e.target.value }))}
              >
                {rolesDisponibles.map((role) => (
                  <option key={role.valeur} value={role.valeur}>
                    {role.libelle}
                  </option>
                ))}
              </select>
            </label>
            {!aModifier && (
              <label className="block">
                <span className={label}>Mot de passe initial (optionnel)</span>
                <input
                  className={champ}
                  type="text"
                  value={formulaire.motDePasse}
                  onChange={(e) => setFormulaire((a) => ({ ...a, motDePasse: e.target.value }))}
                  placeholder="Sinon généré automatiquement"
                />
              </label>
            )}
          </div>

          <label className="flex max-w-xs cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-bleu-hero bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => lirePhoto(e.target.files?.[0])}
            />
            {formulaire.photoProfil ? (
              <img
                src={formulaire.photoProfil}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <>
                <Upload className="mb-2 h-5 w-5 text-bleu-hero" />
                Photo de profil
              </>
            )}
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={enCours}
              className="rounded-2xl bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {enCours ? "Enregistrement..." : aModifier ? "Mettre à jour" : "Créer le compte"}
            </button>
            {aModifier && (
              <button
                type="button"
                onClick={reinitialiser}
                className="rounded-2xl border border-bleu-hero px-5 py-2.5 text-sm font-semibold text-slate-600"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Consultation seule. La création de personnel est réservée aux Admin / Super Admin.
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
        <div className="border-b border-bleu-hero px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Équipe ({utilisateurs.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                {peutGerer && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((personne) => (
                <tr key={personne.id} className="border-t border-bleu-hero">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {personne.photoProfil ? (
                        <img
                          src={personne.photoProfil}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a8a] text-xs text-white">
                          {personne.prenom[0]}
                          {personne.nom[0]}
                        </span>
                      )}
                      <span className="font-medium text-slate-800">{personne.nomComplet}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{personne.email}</td>
                  <td className="px-4 py-3">{libelleRole(personne.role)}</td>
                  <td className="px-4 py-3">
                    <span className={personne.actif ? "text-emerald-600" : "text-slate-400"}>
                      {personne.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  {peutGerer && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => preparerEdition(personne)}
                          className="inline-flex items-center gap-1 rounded-lg border border-bleu-hero px-2 py-1.5 text-xs font-semibold uppercase text-slate-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => void resetMotDePasse(personne)}
                          className="inline-flex items-center gap-1 rounded-lg border border-bleu-hero px-2 py-1.5 text-xs font-semibold uppercase text-slate-600"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          MDP
                        </button>
                        <button
                          type="button"
                          onClick={() => void basculerActif(personne)}
                          className="inline-flex items-center gap-1 rounded-lg border border-bleu-hero px-2 py-1.5 text-xs font-semibold uppercase text-slate-600"
                        >
                          <Power className="h-3.5 w-3.5" />
                          {personne.actif ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MiseEnPageAdmin>
  );
}
