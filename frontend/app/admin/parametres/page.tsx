"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, ImagePlus, KeyRound, Plus, Shield, Trash2, UserRound } from "lucide-react";
import { ChampMotDePasse } from "@/composants/auth/ChampMotDePasse";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { IllustrationLaboratoire } from "@/composants/accueil/IllustrationLaboratoire";
import { appelerApi } from "@/lib/api";
import { libelleRole } from "@/lib/formatage";
import { estSuperAdmin } from "@/lib/roles";
import { useClient } from "@/store/contexteClient";
import type { ParametreEntreprise, Utilisateur } from "@/types/modeles";

const champ =
  "mt-1.5 w-full rounded-2xl border border-bleu-hero bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none";
const label = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";
const MAX_IMAGES_ACCUEIL = 6;
const IMAGES_ACCUEIL_DEFAUT = [
  "/medias/logo-microscope.png",
  "/medias/hero-accueil-produits.png",
  "/medias/logo-microscope.png",
];

/** Compresse une image pour éviter un PUT trop lourd (logo + plusieurs photos). */
function compresserImageFichier(fichier: File, maxCote = 900, qualite = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error("Lecture image impossible."));
    lecteur.onload = () => {
      const dataUrl = lecteur.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Lecture image impossible."));
        return;
      }
      if (!fichier.type.startsWith("image/") || fichier.type === "image/svg+xml") {
        resolve(dataUrl);
        return;
      }
      const image = new Image();
      image.onload = () => {
        const ratio = Math.min(1, maxCote / Math.max(image.width, image.height));
        const largeur = Math.max(1, Math.round(image.width * ratio));
        const hauteur = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = largeur;
        canvas.height = hauteur;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(image, 0, 0, largeur, hauteur);
        try {
          resolve(canvas.toDataURL("image/jpeg", qualite));
        } catch {
          resolve(dataUrl);
        }
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    };
    lecteur.readAsDataURL(fichier);
  });
}

const entrepriseVide: ParametreEntreprise = {
  nomCommercial: "",
  raisonSociale: "",
  activite1: "",
  activite2: "",
  rccm: "",
  idNational: "",
  adresse: "",
  telephone: "",
  ville: "",
  emailContact: "",
  siteWeb: "",
  messagePied: "",
  logoUrl: "",
  imageAccueilUrl: "",
  imagesAccueil: [],
};

export default function PageParametresAdmin() {
  const { utilisateur, chargerTableauDeBord } = useClient();
  const peutModifierEntreprise = estSuperAdmin(utilisateur?.role) || utilisateur?.role === "ADMIN";

  const [onglet, setOnglet] = useState<"entreprise" | "profil" | "securite">("entreprise");
  const [entreprise, setEntreprise] = useState<ParametreEntreprise>(entrepriseVide);
  const [profil, setProfil] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    photoProfil: "" as string | null,
  });
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    appelerApi<{ entreprise: ParametreEntreprise }>("/admin/parametres/entreprise")
      .then((donnees) =>
        setEntreprise({
          ...donnees.entreprise,
          emailContact: donnees.entreprise.emailContact ?? "",
          siteWeb: donnees.entreprise.siteWeb ?? "",
          logoUrl: donnees.entreprise.logoUrl ?? "",
          imageAccueilUrl: donnees.entreprise.imageAccueilUrl ?? "",
          imagesAccueil:
            donnees.entreprise.imagesAccueil?.length
              ? donnees.entreprise.imagesAccueil
              : donnees.entreprise.imageAccueilUrl
                ? [donnees.entreprise.imageAccueilUrl]
                : [],
        }),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!utilisateur) return;
    setProfil({
      prenom: utilisateur.prenom,
      nom: utilisateur.nom,
      telephone: utilisateur.telephone ?? "",
      photoProfil: utilisateur.photoProfil,
    });
  }, [utilisateur]);

  function lireLogo(fichier?: File) {
    if (!fichier) return;
    if (fichier.size > 2 * 1024 * 1024) {
      setErreur("Le logo ne doit pas dépasser 2 Mo.");
      return;
    }
    void compresserImageFichier(fichier, 512, 0.88)
      .then((logoUrl) => setEntreprise((actuel) => ({ ...actuel, logoUrl })))
      .catch(() => setErreur("Impossible de lire le logo."));
  }

  function lireImageAccueil(fichier?: File, index?: number) {
    if (!fichier) return;
    if (fichier.size > 4 * 1024 * 1024) {
      setErreur("Chaque image d’accueil ne doit pas dépasser 4 Mo.");
      return;
    }
    void compresserImageFichier(fichier, 900, 0.82)
      .then((dataUrl) => {
        setEntreprise((actuel) => {
          const images = [...(actuel.imagesAccueil ?? [])];
          if (typeof index === "number") {
            images[index] = dataUrl;
          } else if (images.length < MAX_IMAGES_ACCUEIL) {
            images.push(dataUrl);
          }
          return {
            ...actuel,
            imagesAccueil: images,
            imageAccueilUrl: images[0] ?? "",
          };
        });
      })
      .catch(() => setErreur("Impossible de lire l’image d’accueil."));
  }

  function retirerImageAccueil(index: number) {
    setEntreprise((actuel) => {
      const images = (actuel.imagesAccueil ?? []).filter((_, i) => i !== index);
      return {
        ...actuel,
        imagesAccueil: images,
        imageAccueilUrl: images[0] ?? "",
      };
    });
  }

  function lirePhoto(fichier?: File) {
    if (!fichier) return;
    if (fichier.size > 3 * 1024 * 1024) {
      setErreur("La photo ne doit pas dépasser 3 Mo.");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      if (typeof lecteur.result === "string") {
        setProfil((actuel) => ({ ...actuel, photoProfil: lecteur.result as string }));
      }
    };
    lecteur.readAsDataURL(fichier);
  }

  async function enregistrerEntreprise(evenement: FormEvent) {
    evenement.preventDefault();
    if (!peutModifierEntreprise) {
      setErreur("Seul Admin / Super Admin peut modifier l’entreprise.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await appelerApi<{ entreprise: ParametreEntreprise; message: string }>(
        "/admin/parametres/entreprise",
        { method: "PUT", body: JSON.stringify(entreprise) },
      );
      setEntreprise({
        ...reponse.entreprise,
        emailContact: reponse.entreprise.emailContact ?? "",
        siteWeb: reponse.entreprise.siteWeb ?? "",
        logoUrl: reponse.entreprise.logoUrl ?? "",
        imageAccueilUrl: reponse.entreprise.imageAccueilUrl ?? "",
        imagesAccueil: reponse.entreprise.imagesAccueil ?? [],
      });
      setMessage(
        `Paramètres enregistrés. L’application s’affiche désormais sous « ${reponse.entreprise.nomCommercial} ».`,
      );
      window.dispatchEvent(new Event("mm-entreprise-maj"));
      if (typeof document !== "undefined") {
        document.title = `Administration — ${reponse.entreprise.nomCommercial || "MateMedical"}`;
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrerProfil(evenement: FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      await appelerApi<{ utilisateur: Utilisateur }>("/profil", {
        method: "PUT",
        body: JSON.stringify(profil),
      });
      await chargerTableauDeBord();
      setMessage("Profil mis à jour.");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Profil non enregistré.");
    } finally {
      setEnCours(false);
    }
  }

  async function changerMotDePasse(evenement: FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await appelerApi<{ message: string }>("/profil/mot-de-passe", {
        method: "PUT",
        body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse }),
      });
      setMessage(resultat.message);
      setMotDePasseActuel("");
      setNouveauMotDePasse("");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Mot de passe non modifié.");
    } finally {
      setEnCours(false);
    }
  }

  const onglets = [
    { id: "entreprise" as const, libelle: "Entreprise", icone: Building2 },
    { id: "profil" as const, libelle: "Mon profil", icone: UserRound },
    { id: "securite" as const, libelle: "Sécurité", icone: Shield },
  ];

  return (
    <MiseEnPageAdmin
      titre="Paramètres"
      sousTitre="Identité Elmed, sécurité et profil gestionnaire"
    >
      {message && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {erreur && (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {erreur}
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {onglets.map((item) => {
          const Icone = item.icone;
          const actif = onglet === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setOnglet(item.id);
                setMessage(null);
                setErreur(null);
              }}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold ${
                actif
                  ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                  : "border-bleu-hero bg-white text-slate-600"
              }`}
            >
              <Icone className="h-4 w-4" />
              {item.libelle}
            </button>
          );
        })}
      </div>

      {onglet === "entreprise" && (
        <form
          onSubmit={enregistrerEntreprise}
          className="grid gap-6 xl:grid-cols-12"
        >
          <div className="space-y-4 rounded-2xl border border-bleu-hero bg-white p-5 xl:col-span-8">
            <div>
              <h2 className="text-lg font-semibold text-[#1e3a8a]">Identité de l’entreprise</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ces informations alimentent les factures, proformas, filigranes et l’interface.
                Tous les champs sont optionnels : un champ vide conserve la valeur déjà enregistrée.
              </p>
            </div>

            <div className="rounded-2xl border border-violet-marque/30 bg-violet-marque/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-marque">
                Nom de l’application
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Affiché dans le menu, la connexion et l’aperçu « App ». Ex. MateMedical, Elmed Shop…
              </p>
              <label className="mt-3 block">
                <span className={label}>App (nom commercial)</span>
                <input
                  className={champ}
                  disabled={!peutModifierEntreprise}
                  value={entreprise.nomCommercial}
                  placeholder="MateMedical"
                  onChange={(e) =>
                    setEntreprise((actuel) => ({ ...actuel, nomCommercial: e.target.value }))
                  }
                />
              </label>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-bleu-hero bg-white px-3 py-2.5">
                {entreprise.logoUrl ? (
                  <img src={entreprise.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-marque text-xs font-bold text-white">
                    {(entreprise.nomCommercial || "MM").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-violet-marque">
                    {entreprise.nomCommercial || "MateMedical"}
                  </p>
                  <p className="text-[11px] text-slate-400">Aperçu menu latéral</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["raisonSociale", "Raison sociale (factures)", "ELMED"],
                  ["activite1", "Activité 1", "Vente des Matériels Médicaux"],
                  ["activite2", "Activité 2", "Réactifs de Labo…"],
                  ["rccm", "RCCM", "CD/KNG/RCCM/…"],
                  ["idNational", "Identifiant national", "01-Q8601…"],
                  ["adresse", "Adresse", "Av. du commerce…"],
                  ["telephone", "Téléphone", "0913…"],
                  ["ville", "Ville (documents)", "Kin"],
                  ["emailContact", "Email contact", "contact@…"],
                  ["siteWeb", "Site web", "https://…"],
                  ["messagePied", "Message pied de page", "Merci de nous avoir choisi"],
                ] as const
              ).map(([cle, libelleChamp, placeholder]) => (
                <label key={cle} className={`block ${cle === "adresse" || cle === "messagePied" ? "md:col-span-2" : ""}`}>
                  <span className={label}>{libelleChamp}</span>
                  <input
                    className={champ}
                    disabled={!peutModifierEntreprise}
                    value={String(entreprise[cle] ?? "")}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setEntreprise((actuel) => ({ ...actuel, [cle]: e.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
            {peutModifierEntreprise && (
              <button
                type="submit"
                disabled={enCours}
                className="rounded-2xl bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {enCours ? "Enregistrement..." : "Enregistrer l’entreprise"}
              </button>
            )}
          </div>

          <aside className="space-y-4 xl:col-span-4">
            <article className="rounded-2xl border border-bleu-hero bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Logo factures (microscope)
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Image affichée en en-tête des factures et proformas (à la place du pictogramme trait).
                PNG ou JPG recommandé, fond clair.
              </p>
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-bleu-hero bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={!peutModifierEntreprise}
                  onChange={(e) => lireLogo(e.target.files?.[0])}
                />
                {entreprise.logoUrl ? (
                  <img src={entreprise.logoUrl} alt="Logo facture" className="max-h-28 object-contain" />
                ) : (
                  <>
                    <ImagePlus className="mb-2 h-6 w-6 text-bleu-hero" />
                    Déposer le logo microscope (PNG/JPG — 2 Mo)
                  </>
                )}
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!peutModifierEntreprise}
                  onClick={() =>
                    setEntreprise((actuel) => ({
                      ...actuel,
                      logoUrl: "/medias/logo-microscope.png",
                    }))
                  }
                  className="rounded-xl border border-bleu-hero px-3 py-2 text-xs font-semibold uppercase text-slate-600 disabled:opacity-50"
                >
                  Logo microscope par défaut
                </button>
                {entreprise.logoUrl && (
                  <button
                    type="button"
                    disabled={!peutModifierEntreprise}
                    onClick={() => setEntreprise((actuel) => ({ ...actuel, logoUrl: "" }))}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold uppercase text-rose-700 disabled:opacity-50"
                  >
                    Retirer
                  </button>
                )}
              </div>
              <input
                className={`${champ} mt-3`}
                disabled={!peutModifierEntreprise}
                value={entreprise.logoUrl?.startsWith("data:") ? "" : entreprise.logoUrl ?? ""}
                onChange={(e) => setEntreprise((a) => ({ ...a, logoUrl: e.target.value }))}
                placeholder="Ou coller une URL de logo…"
              />
            </article>

            <article className="rounded-2xl border border-bleu-hero bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Images d’accueil (hero)
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Ajoutez au moins 3 images (microscope, boîtes, tubes…) puis cliquez sur
                « Enregistrer » en bas du formulaire — sinon l’accueil ne les reçoit pas.
                Maximum {MAX_IMAGES_ACCUEIL}.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(entreprise.imagesAccueil ?? []).map((src, index) => (
                  <div
                    key={`${index}-${src.slice(0, 24)}`}
                    className="relative rounded-xl border border-bleu-hero bg-slate-50 p-2"
                  >
                    <img src={src} alt="" className="mx-auto h-24 w-full object-contain" />
                    <p className="mt-1 text-center text-[10px] font-semibold uppercase text-slate-400">
                      Image {index + 1}
                    </p>
                    {peutModifierEntreprise && (
                      <div className="mt-2 flex gap-1">
                        <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-bleu-hero px-2 py-1.5 text-[10px] font-semibold uppercase text-slate-600">
                          Remplacer
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              lireImageAccueil(e.target.files?.[0], index);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => retirerImageAccueil(index)}
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700"
                          aria-label={`Retirer image ${index + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {(entreprise.imagesAccueil?.length ?? 0) < MAX_IMAGES_ACCUEIL &&
                  peutModifierEntreprise && (
                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-bleu-hero bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          lireImageAccueil(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                      <Plus className="mb-1 h-5 w-5 text-bleu-hero" />
                      Ajouter une image
                    </label>
                  )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!peutModifierEntreprise}
                  onClick={() =>
                    setEntreprise((actuel) => ({
                      ...actuel,
                      imagesAccueil: [...IMAGES_ACCUEIL_DEFAUT],
                      imageAccueilUrl: IMAGES_ACCUEIL_DEFAUT[0],
                    }))
                  }
                  className="rounded-xl border border-bleu-hero px-3 py-2 text-xs font-semibold uppercase text-slate-600 disabled:opacity-50"
                >
                  Reprendre les 3 images par défaut
                </button>
                {(entreprise.imagesAccueil?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    disabled={!peutModifierEntreprise}
                    onClick={() =>
                      setEntreprise((actuel) => ({
                        ...actuel,
                        imagesAccueil: [],
                        imageAccueilUrl: "",
                      }))
                    }
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold uppercase text-rose-700 disabled:opacity-50"
                  >
                    Tout retirer
                  </button>
                )}
              </div>

              <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-r from-[#4f74ff] to-[#5b63f5] p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                  Aperçu bandeau ({entreprise.imagesAccueil?.length ?? 0} image
                  {(entreprise.imagesAccueil?.length ?? 0) > 1 ? "s" : ""})
                </p>
                <div className="flex justify-end">
                  <IllustrationLaboratoire
                    images={
                      entreprise.imagesAccueil?.length
                        ? entreprise.imagesAccueil
                        : IMAGES_ACCUEIL_DEFAUT
                    }
                  />
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-bleu-hero bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Aperçu application & facture
              </h3>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-bleu-hero bg-slate-50 px-3 py-3">
                {entreprise.logoUrl ? (
                  <img src={entreprise.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-marque text-sm font-bold text-white">
                    {(entreprise.nomCommercial || "MM").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">App</p>
                  <p className="text-base font-semibold text-violet-marque">
                    {entreprise.nomCommercial || "MateMedical"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold text-[#2B6CB0]">
                    {entreprise.raisonSociale || "ELMED"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{entreprise.activite1}</p>
                  <p className="text-xs text-slate-500">{entreprise.activite2}</p>
                  <p className="mt-3 text-xs text-slate-600">RCCM : {entreprise.rccm || "—"}</p>
                  <p className="text-xs text-slate-600">Id. Nat. {entreprise.idNational || "—"}</p>
                  <p className="text-xs text-slate-600">{entreprise.adresse || "—"}</p>
                </div>
                <img
                  src={entreprise.logoUrl || "/medias/logo-microscope.png"}
                  alt=""
                  className="h-24 w-24 shrink-0 object-contain"
                />
              </div>
            </article>
          </aside>
        </form>
      )}

      {onglet === "profil" && (
        <div className="grid gap-4 xl:grid-cols-12">
          <form
            onSubmit={enregistrerProfil}
            className="space-y-5 rounded-2xl border border-bleu-hero bg-white p-5 sm:p-6 xl:col-span-8"
          >
            <div>
              <h2 className="text-lg font-semibold text-[#1e3a8a]">Mon profil</h2>
              <p className="mt-1 text-sm text-slate-500">
                Identité visible dans l’administration, la messagerie et l’audit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex cursor-pointer flex-col items-center gap-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => lirePhoto(e.target.files?.[0])}
                />
                {profil.photoProfil ? (
                  <img
                    src={profil.photoProfil}
                    alt=""
                    className="h-28 w-28 rounded-full object-cover ring-2 ring-bleu-hero"
                  />
                ) : (
                  <span className="grid h-28 w-28 place-items-center rounded-full bg-[#1e3a8a] text-2xl font-semibold text-white">
                    {(profil.prenom[0] || "U") + (profil.nom[0] || "")}
                  </span>
                )}
                <span className="text-xs font-medium text-violet-marque">Changer la photo</span>
              </label>
              <div className="min-w-0 space-y-1 text-sm text-slate-500">
                <p>
                  <span className="font-medium text-slate-700">Compte :</span> {utilisateur?.email}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Rôle :</span>{" "}
                  {libelleRole(utilisateur?.role)}
                </p>
                <p className="text-xs text-slate-400">PNG ou JPG — max 3 Mo</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Prénom *</span>
                <input
                  className={champ}
                  value={profil.prenom}
                  onChange={(e) => setProfil((a) => ({ ...a, prenom: e.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className={label}>Nom *</span>
                <input
                  className={champ}
                  value={profil.nom}
                  onChange={(e) => setProfil((a) => ({ ...a, nom: e.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className={label}>Téléphone</span>
                <input
                  className={champ}
                  value={profil.telephone}
                  onChange={(e) => setProfil((a) => ({ ...a, telephone: e.target.value }))}
                  placeholder="+243 …"
                />
              </label>
              <label className="block">
                <span className={label}>Email (lecture seule)</span>
                <input className={`${champ} bg-slate-50 text-slate-500`} value={utilisateur?.email ?? ""} readOnly />
              </label>
              <label className="block">
                <span className={label}>Rôle (lecture seule)</span>
                <input
                  className={`${champ} bg-slate-50 text-slate-500`}
                  value={libelleRole(utilisateur?.role)}
                  readOnly
                />
              </label>
              <label className="block">
                <span className={label}>Identifiant interne</span>
                <input
                  className={`${champ} bg-slate-50 font-mono text-xs text-slate-500`}
                  value={utilisateur?.id ?? ""}
                  readOnly
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-bleu-hero pt-5">
              <button
                type="submit"
                disabled={enCours}
                className="rounded-2xl bg-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Enregistrer le profil
              </button>
              <button
                type="button"
                onClick={() => setOnglet("securite")}
                className="inline-flex items-center gap-2 rounded-2xl border border-bleu-hero px-5 py-2.5 text-sm font-semibold text-slate-600"
              >
                <KeyRound className="h-4 w-4" />
                Changer le mot de passe
              </button>
            </div>
          </form>

          <aside className="space-y-4 xl:sticky xl:top-[calc(var(--hauteur-en-tete)+1rem)] xl:col-span-4 xl:self-start">
            <article className="rounded-2xl border border-bleu-hero bg-white p-5 text-center">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Résumé du compte
              </h3>
              {profil.photoProfil ? (
                <img
                  src={profil.photoProfil}
                  alt=""
                  className="mx-auto mt-4 h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <span className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full bg-[#1e3a8a] text-xl font-semibold text-white">
                  {(profil.prenom[0] || "U") + (profil.nom[0] || "")}
                </span>
              )}
              <p className="mt-3 text-base font-semibold uppercase text-[#1e3a8a]">
                {[profil.prenom, profil.nom].filter(Boolean).join(" ") || "Gestionnaire"}
              </p>
              <p className="mt-1 text-sm text-violet-marque">{libelleRole(utilisateur?.role)}</p>
              <dl className="mt-5 space-y-2.5 text-left text-sm">
                {[
                  { label: "Email", valeur: utilisateur?.email || "—" },
                  { label: "Téléphone", valeur: profil.telephone || "—" },
                  { label: "Rôle", valeur: libelleRole(utilisateur?.role) },
                  {
                    label: "Statut",
                    valeur: "Compte actif",
                  },
                  {
                    label: "Espace",
                    valeur: "Administration MateMedical",
                  },
                ].map((ligne) => (
                  <div key={ligne.label} className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">{ligne.label}</dt>
                    <dd className="text-right font-medium text-[#1e3a8a]">{ligne.valeur}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="rounded-2xl border border-bleu-hero bg-white p-5">
              <h3 className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Actions rapides
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOnglet("securite")}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-bleu-hero bg-slate-50 px-2 py-3 text-center text-xs font-semibold text-[#1e3a8a] hover:bg-white"
                >
                  <Shield className="h-5 w-5" />
                  Sécurité
                </button>
                <button
                  type="button"
                  onClick={() => setOnglet("entreprise")}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-bleu-hero bg-slate-50 px-2 py-3 text-center text-xs font-semibold text-[#1e3a8a] hover:bg-white"
                >
                  <Building2 className="h-5 w-5" />
                  Entreprise
                </button>
              </div>
            </article>
          </aside>
        </div>
      )}

      {onglet === "securite" && (
        <form
          onSubmit={changerMotDePasse}
          className="max-w-lg space-y-4 rounded-2xl border border-bleu-hero bg-white p-6"
        >
          <h2 className="text-lg font-semibold text-[#1e3a8a]">Sécurité du compte</h2>
          <p className="text-sm text-slate-500">
            Changez le mot de passe temporaire reçu à la création du compte.
          </p>
          <ChampMotDePasse
            label="Mot de passe actuel"
            value={motDePasseActuel}
            onChange={setMotDePasseActuel}
            autoComplete="current-password"
          />
          <ChampMotDePasse
            label="Nouveau mot de passe"
            value={nouveauMotDePasse}
            onChange={setNouveauMotDePasse}
            autoComplete="new-password"
            aide="Au moins 8 caractères, une majuscule et un chiffre."
          />
          <button
            type="submit"
            disabled={enCours}
            className="rounded-2xl bg-violet-marque px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Mettre à jour le mot de passe
          </button>
        </form>
      )}
    </MiseEnPageAdmin>
  );
}
