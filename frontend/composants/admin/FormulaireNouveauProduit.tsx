"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, Trash2, Upload, Video, X } from "lucide-react";
import type { ApercuProduit } from "@/composants/admin/PanneauLateralProduit";
import { appelerApi } from "@/lib/api";
import type { Categorie, ProduitAdmin } from "@/types/modeles";

const champ =
  "mt-1.5 w-full rounded-2xl border border-bleu-hero bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400";
const label = "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";

const suggestionsCaracteristiques = [
  "Norme",
  "Filtration",
  "Certification",
  "Public",
  "Usage",
  "Stockage",
  "Emballage",
  "MOQ",
  "Type",
  "Matière",
  "Garantie",
  "Origine",
];

type LigneCaracteristique = { id: string; libelle: string; valeur: string };
type SlotImage = string | null;

function idLigne() {
  return `c-${Math.random().toString(36).slice(2, 9)}`;
}

function lireFichier(fichier: File, maxMo: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (fichier.size > maxMo * 1024 * 1024) {
      reject(new Error(`Le fichier ne doit pas dépasser ${maxMo} Mo.`));
      return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      if (typeof lecteur.result === "string") resolve(lecteur.result);
      else reject(new Error("Lecture du fichier impossible."));
    };
    lecteur.onerror = () => reject(new Error("Lecture du fichier impossible."));
    lecteur.readAsDataURL(fichier);
  });
}

export function FormulaireNouveauProduit({
  categories,
  produitAModifier,
  peutModifier = false,
  onApercu,
  onAnnuler,
  onCree,
  onModifie,
}: {
  categories: Categorie[];
  produitAModifier?: ProduitAdmin | null;
  peutModifier?: boolean;
  onApercu: (apercu: ApercuProduit) => void;
  onAnnuler: () => void;
  onCree: (produit: ProduitAdmin) => void;
  onModifie: (produit: ProduitAdmin) => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("0");
  const [categorieId, setCategorieId] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [populaire, setPopulaire] = useState(false);
  const [images, setImages] = useState<SlotImage[]>([null, null, null, null]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoCouverture, setVideoCouverture] = useState<string | null>(null);
  const [urlImageManuelle, setUrlImageManuelle] = useState("");
  const [urlVideoManuelle, setUrlVideoManuelle] = useState("");
  const [caracteristiques, setCaracteristiques] = useState<LigneCaracteristique[]>([
    { id: idLigne(), libelle: "Norme", valeur: "" },
    { id: idLigne(), libelle: "Certification", valeur: "" },
    { id: idLigne(), libelle: "Emballage", valeur: "" },
    { id: idLigne(), libelle: "MOQ", valeur: "" },
  ]);

  const enModification = Boolean(produitAModifier);
  const lectureSeule = enModification && !peutModifier;
  const categorieActive = useMemo(
    () => categories.find((categorie) => categorie.id === categorieId),
    [categories, categorieId],
  );

  useEffect(() => {
    if (!produitAModifier) return;
    setNom(produitAModifier.nom);
    setSku(produitAModifier.sku);
    setDescription(produitAModifier.description ?? "");
    setPrix(String(produitAModifier.prix));
    setStock(String(produitAModifier.quantiteStock));
    setCategorieId(produitAModifier.categorieId ?? "");
    setDisponible(produitAModifier.disponible);
    setPopulaire(Boolean(produitAModifier.populaire));

    const imagesProduit = (produitAModifier.images?.length
      ? produitAModifier.images
      : produitAModifier.medias?.filter((m) => m.type === "IMAGE").map((m) => m.url) ?? []
    ).slice(0, 4);
    setImages([0, 1, 2, 3].map((i) => imagesProduit[i] ?? null));

    const video = produitAModifier.medias?.find((m) => m.type === "VIDEO");
    setVideoUrl(video?.url ?? null);
    setVideoCouverture(video?.urlCouverture ?? null);

    const specs = produitAModifier.caracteristiques ?? [];
    setCaracteristiques(
      specs.length > 0
        ? specs.map((item) => ({ id: idLigne(), libelle: item.libelle, valeur: item.valeur }))
        : [
            { id: idLigne(), libelle: "Norme", valeur: "" },
            { id: idLigne(), libelle: "Certification", valeur: "" },
            { id: idLigne(), libelle: "Emballage", valeur: "" },
            { id: idLigne(), libelle: "MOQ", valeur: "" },
          ],
    );
  }, [produitAModifier]);

  useEffect(() => {
    if (categorieId || categories.length === 0) return;
    setCategorieId(categories[0].id);
  }, [categories, categorieId]);

  useEffect(() => {
    onApercu({
      id: produitAModifier?.id,
      nom,
      sku: sku.toUpperCase(),
      description,
      prix: Number(prix) || 0,
      quantiteStock: Number(stock) || 0,
      nomCategorie: categorieActive?.nom ?? "",
      disponible,
      populaire,
      images: images.filter((url): url is string => Boolean(url)),
      videoUrl,
      videoCouverture,
      caracteristiques: caracteristiques.map((c) => ({ libelle: c.libelle, valeur: c.valeur })),
    });
  }, [
    nom,
    sku,
    description,
    prix,
    stock,
    categorieActive,
    disponible,
    populaire,
    images,
    videoUrl,
    videoCouverture,
    caracteristiques,
    produitAModifier?.id,
    onApercu,
  ]);

  async function chargerImage(index: number, fichier?: File) {
    if (!fichier) return;
    setErreur(null);
    try {
      const dataUrl = await lireFichier(fichier, 3);
      setImages((actuels) => actuels.map((item, i) => (i === index ? dataUrl : item)));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Image invalide.");
    }
  }

  async function chargerVideo(fichier?: File) {
    if (!fichier) return;
    setErreur(null);
    try {
      const dataUrl = await lireFichier(fichier, 10);
      setVideoUrl(dataUrl);
      if (!videoCouverture) {
        const premiere = images.find(Boolean);
        if (premiere) setVideoCouverture(premiere);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Vidéo invalide.");
    }
  }

  async function chargerCouverture(fichier?: File) {
    if (!fichier) return;
    setErreur(null);
    try {
      setVideoCouverture(await lireFichier(fichier, 2));
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Couverture invalide.");
    }
  }

  function ajouterImageParUrl() {
    const url = urlImageManuelle.trim();
    if (!url) return;
    const indexLibre = images.findIndex((item) => !item);
    if (indexLibre < 0) {
      setErreur("Les 4 emplacements image sont déjà remplis.");
      return;
    }
    setImages((actuels) => actuels.map((item, i) => (i === indexLibre ? url : item)));
    setUrlImageManuelle("");
    setErreur(null);
  }

  function ajouterVideoParUrl() {
    const url = urlVideoManuelle.trim();
    if (!url) return;
    setVideoUrl(url);
    setUrlVideoManuelle("");
    setErreur(null);
  }

  function reinitialiserFormulaire() {
    setNom("");
    setSku("");
    setDescription("");
    setPrix("");
    setStock("0");
    setCategorieId(categories[0]?.id ?? "");
    setDisponible(true);
    setPopulaire(false);
    setImages([null, null, null, null]);
    setVideoUrl(null);
    setVideoCouverture(null);
    setUrlImageManuelle("");
    setUrlVideoManuelle("");
    setCaracteristiques([
      { id: idLigne(), libelle: "Norme", valeur: "" },
      { id: idLigne(), libelle: "Certification", valeur: "" },
      { id: idLigne(), libelle: "Emballage", valeur: "" },
      { id: idLigne(), libelle: "MOQ", valeur: "" },
    ]);
    setErreur(null);
  }

  async function soumettre(evenement: FormEvent) {
    evenement.preventDefault();
    if (lectureSeule) {
      setErreur("Seul un Super Admin peut modifier un produit.");
      return;
    }
    if (enModification && !peutModifier) {
      setErreur("Seul un Super Admin peut modifier un produit.");
      return;
    }
    if (!nom.trim() || !sku.trim()) {
      setErreur("Le nom et le SKU sont obligatoires.");
      return;
    }
    if (!categorieId) {
      setErreur("Sélectionnez une catégorie.");
      return;
    }
    const prixNombre = Number(prix);
    const stockNombre = Number(stock);
    if (!Number.isFinite(prixNombre) || prixNombre < 0) {
      setErreur("Prix invalide.");
      return;
    }
    if (!Number.isInteger(stockNombre) || stockNombre < 0) {
      setErreur("Stock invalide.");
      return;
    }

    const imagesValides = images.filter((url): url is string => Boolean(url));
    if (imagesValides.length === 0) {
      setErreur("Ajoutez au moins une image produit.");
      return;
    }

    setEnCours(true);
    setErreur(null);

    const medias = [
      ...imagesValides.map((url) => ({ type: "IMAGE" as const, url })),
      ...(videoUrl
        ? [
            {
              type: "VIDEO" as const,
              url: videoUrl,
              urlCouverture: videoCouverture || imagesValides[0] || "",
            },
          ]
        : []),
    ];

    const corps = {
      nom: nom.trim(),
      sku: sku.trim().toUpperCase(),
      description: description.trim(),
      prix: prixNombre,
      quantiteStock: stockNombre,
      categorieId,
      disponible,
      populaire,
      medias,
      caracteristiques: caracteristiques
        .filter((item) => item.libelle.trim() && item.valeur.trim())
        .map((item) => ({ libelle: item.libelle.trim(), valeur: item.valeur.trim() })),
    };

    try {
      if (produitAModifier) {
        const reponse = await appelerApi<{ produit: ProduitAdmin }>(`/admin/produits/${produitAModifier.id}`, {
          method: "PUT",
          body: JSON.stringify(corps),
        });
        onModifie(reponse.produit);
      } else {
        const reponse = await appelerApi<{ produit: ProduitAdmin }>("/admin/produits", {
          method: "POST",
          body: JSON.stringify(corps),
        });
        onCree(reponse.produit);
        reinitialiserFormulaire();
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-5 rounded-2xl border border-bleu-hero bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1e3a8a]">
            {enModification
              ? lectureSeule
                ? "Détails du produit (lecture seule)"
                : "Modifier le produit"
              : "Publier un produit"}
          </h2>
          <p className="mt-1 text-sm text-violet-marque">
            {lectureSeule
              ? "Consultation complète — modification réservée au Super Admin"
              : "Identité, médias (4 images + vidéo) et caractéristiques — comme sur la fiche client"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              disponible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {disponible ? "Visible catalogue" : "Masqué"}
          </span>
          {populaire && (
            <span className="rounded-full bg-violet-marque/10 px-3 py-1 text-xs font-semibold text-violet-marque">
              Populaire
            </span>
          )}
        </div>
      </div>

      {erreur && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{erreur}</p>
      )}

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">1 · Identité</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className={label}>Nom du produit *</span>
            <input
              className={champ}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex. Masque N95 (Boîte de 20)"
              required
            />
          </label>
          <label className="block">
            <span className={label}>SKU *</span>
            <input
              className={`${champ} uppercase`}
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="SFC-MASQ-N95"
              required
            />
          </label>
          <label className="block">
            <span className={label}>Catégorie *</span>
            <select className={champ} value={categorieId} onChange={(e) => setCategorieId(e.target.value)} required>
              {categories.map((categorie) => (
                <option key={categorie.id} value={categorie.id}>
                  {categorie.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className={label}>Description courte</span>
            <textarea
              className={`${champ} min-h-[88px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Protection respiratoire FFP2 / N95."
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 border-t border-bleu-hero pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">2 · Prix & stock</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={label}>Prix unitaire (USD) *</span>
            <input
              className={champ}
              type="number"
              min="0"
              step="0.01"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="6.43"
              required
            />
          </label>
          <label className="block">
            <span className={label}>Stock disponible *</span>
            <input
              className={champ}
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-bleu-hero px-4 py-3">
            <input
              type="checkbox"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
              className="h-4 w-4 accent-violet-marque"
            />
            <span className="text-sm font-medium text-slate-700">Publier au catalogue</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-bleu-hero px-4 py-3">
            <input
              type="checkbox"
              checked={populaire}
              onChange={(e) => setPopulaire(e.target.checked)}
              className="h-4 w-4 accent-violet-marque"
            />
            <span className="text-sm font-medium text-slate-700">Produit populaire</span>
          </label>
        </div>
      </section>

      <section className="space-y-4 border-t border-bleu-hero pt-5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            3 · Médias (4 images + 1 vidéo)
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Galerie type Alibaba : images principales puis vidéo de présentation.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image, index) => (
            <div key={`img-${index}`} className="relative">
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-bleu-hero bg-slate-50 text-center text-xs text-slate-500 hover:bg-white">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={lectureSeule}
                  onChange={(e) => void chargerImage(index, e.target.files?.[0])}
                />
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <ImagePlus className="mb-2 h-6 w-6 text-bleu-hero" />
                    Image {index + 1}
                    <span className="mt-1 text-[10px] text-slate-400">PNG, JPG — max 3 Mo</span>
                  </>
                )}
              </label>
              {image && !lectureSeule && (
                <button
                  type="button"
                  onClick={() => setImages((actuels) => actuels.map((item, i) => (i === index ? null : item)))}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-600 shadow"
                  aria-label={`Retirer image ${index + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-full bg-[#1e3a8a] px-2 py-0.5 text-[10px] font-semibold text-white">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={champ}
            value={urlImageManuelle}
            disabled={lectureSeule}
            onChange={(e) => setUrlImageManuelle(e.target.value)}
            placeholder="Ou coller une URL d’image…"
          />
          <button
            type="button"
            disabled={lectureSeule}
            onClick={ajouterImageParUrl}
            className="mt-1.5 shrink-0 rounded-2xl border border-bleu-hero px-4 py-2.5 text-sm font-semibold text-[#1e3a8a] disabled:opacity-50"
          >
            Ajouter URL
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="relative">
            <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-bleu-hero bg-slate-50 px-4 text-center text-xs text-slate-500 hover:bg-white">
              <input
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                disabled={lectureSeule}
                onChange={(e) => void chargerVideo(e.target.files?.[0])}
              />
              {videoUrl ? (
                <video src={videoUrl} className="max-h-44 w-full object-contain" controls muted playsInline />
              ) : (
                <>
                  <Video className="mb-2 h-7 w-7 text-violet-marque" />
                  Upload vidéo
                  <span className="mt-1 text-[10px] text-slate-400">MP4 / WEBM — max 10 Mo</span>
                </>
              )}
            </label>
            {videoUrl && !lectureSeule && (
              <button
                type="button"
                onClick={() => {
                  setVideoUrl(null);
                  setVideoCouverture(null);
                }}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-600 shadow"
                aria-label="Retirer la vidéo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-bleu-hero bg-slate-50 text-center text-xs text-slate-500 hover:bg-white">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={lectureSeule}
                onChange={(e) => void chargerCouverture(e.target.files?.[0])}
              />
              {videoCouverture ? (
                <img src={videoCouverture} alt="" className="h-full max-h-28 w-full object-cover" />
              ) : (
                <>
                  <Upload className="mb-2 h-5 w-5 text-bleu-hero" />
                  Miniature / couverture vidéo
                  <span className="mt-1 text-[10px] text-slate-400">Upload image — max 2 Mo</span>
                </>
              )}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className={champ}
                value={urlVideoManuelle}
                disabled={lectureSeule}
                onChange={(e) => setUrlVideoManuelle(e.target.value)}
                placeholder="Ou coller une URL de vidéo (comme pour les photos)…"
              />
              <button
                type="button"
                disabled={lectureSeule}
                onClick={ajouterVideoParUrl}
                className="mt-1.5 shrink-0 rounded-2xl border border-bleu-hero px-4 py-2.5 text-sm font-semibold text-[#1e3a8a] disabled:opacity-50"
              >
                Ajouter URL
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-bleu-hero pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              4 · Caractéristiques du produit
            </h3>
            <p className="mt-1 text-sm text-slate-400">Tableau affiché sur la fiche détail client.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setCaracteristiques((actuels) => [...actuels, { id: idLigne(), libelle: "", valeur: "" }])
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-bleu-hero px-3 py-2 text-xs font-semibold uppercase text-[#1e3a8a]"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestionsCaracteristiques.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() =>
                setCaracteristiques((actuels) => {
                  if (actuels.some((item) => item.libelle === suggestion)) return actuels;
                  return [...actuels, { id: idLigne(), libelle: suggestion, valeur: "" }];
                })
              }
              className="rounded-full border border-bleu-hero bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-white"
            >
              + {suggestion}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {caracteristiques.map((ligne, index) => (
            <div key={ligne.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className={champ}
                value={ligne.libelle}
                onChange={(e) =>
                  setCaracteristiques((actuels) =>
                    actuels.map((item, i) => (i === index ? { ...item, libelle: e.target.value } : item)),
                  )
                }
                placeholder="Libellé (ex. Norme)"
                list="suggestions-caracteristiques"
              />
              <input
                className={champ}
                value={ligne.valeur}
                onChange={(e) =>
                  setCaracteristiques((actuels) =>
                    actuels.map((item, i) => (i === index ? { ...item, valeur: e.target.value } : item)),
                  )
                }
                placeholder="Valeur (ex. N95 / FFP2)"
              />
              <button
                type="button"
                onClick={() => setCaracteristiques((actuels) => actuels.filter((_, i) => i !== index))}
                className="mt-1.5 grid h-[42px] w-11 place-items-center rounded-2xl border border-bleu-hero text-slate-500"
                aria-label="Supprimer la caractéristique"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <datalist id="suggestions-caracteristiques">
          {suggestionsCaracteristiques.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-bleu-hero pt-5">
        {!lectureSeule && (
          <button
            type="submit"
            disabled={enCours}
            className="rounded-2xl bg-[#1e3a8a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1e3a8a]/90 disabled:opacity-60"
          >
            {enCours
              ? "Enregistrement..."
              : enModification
                ? "Mettre à jour le produit"
                : "Enregistrer le produit"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            reinitialiserFormulaire();
            onAnnuler();
          }}
          className="rounded-2xl border border-bleu-hero px-6 py-3 text-sm font-semibold text-slate-600"
        >
          {lectureSeule ? "Fermer" : "Annuler"}
        </button>
      </div>
    </form>
  );
}
