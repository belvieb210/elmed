"use client";

import { useEffect, useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Headset,
  HelpCircle,
  Landmark,
  Lock,
  MapPin,
  Package,
  Plus,
  ScanLine,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { BoutonRetourEtape, EtapesParcoursCommande } from "@/composants/panier/EtapesParcoursCommande";
import { formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import type { ArticlePanier, EntrepotResume, Utilisateur } from "@/types/modeles";
import {
  enregistrerCarteLocale,
  expirationValide,
  formaterExpiration,
  formaterNumeroCarte,
  lireCartesEnregistrees,
  marqueDepuisNumero,
  masquerNumero,
  numeroCarteValide,
  type CarteEnregistree,
} from "./cartes-locales";

type Etape =
  | "accueil"
  | "canaux"
  | "flexpaie"
  | "cartes"
  | "nouvelle-carte"
  | "virement";

type Canal = "FLEXPAIE" | "CARTE" | "VIREMENT";

type ReponsePaiement = {
  message: string;
  simulation: boolean;
  commande: { id: string; numeroCommande: string; montantTotal: number };
};

const orange = "bg-orange-paiement hover:bg-orange-paiement-fonce";

function LogoVisa({ classe = "h-6" }: { classe?: string }) {
  return (
    <svg viewBox="0 0 48 16" className={classe} aria-hidden>
      <rect width="48" height="16" rx="2" fill="#1A1F71" />
      <text x="24" y="11.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial">
        VISA
      </text>
    </svg>
  );
}

function LogoMastercard({ classe = "h-6" }: { classe?: string }) {
  return (
    <svg viewBox="0 0 36 22" className={classe} aria-hidden>
      <circle cx="13" cy="11" r="8" fill="#EB001B" />
      <circle cx="23" cy="11" r="8" fill="#F79E1B" />
    </svg>
  );
}

function BoutonPayer({
  libelle,
  enCours,
  onClick,
  desactive,
}: {
  libelle: string;
  enCours: boolean;
  onClick: () => void;
  desactive?: boolean;
}) {
  return (
    <div className="mt-auto space-y-2 pt-4">
      <button
        type="button"
        onClick={onClick}
        disabled={enCours || desactive}
        className={`flex w-full items-center justify-center gap-2 rounded-full ${orange} py-3.5 text-sm font-bold text-white shadow-sm disabled:opacity-60`}
      >
        <ShieldCheck className="h-4 w-4" />
        {enCours ? "Traitement..." : libelle}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Le fournisseur devrait recevoir les fonds en 1-2 heures
      </p>
    </div>
  );
}

export function ParcoursPaiement({
  montantCommande,
  articles,
  entrepot,
  utilisateur,
  commandeId,
  onFermer,
  onSucces,
}: {
  montantCommande: number;
  articles: ArticlePanier[];
  entrepot?: EntrepotResume | null;
  utilisateur: Utilisateur | null;
  commandeId?: string;
  onFermer: () => void;
  onSucces: (commande: ReponsePaiement["commande"]) => void;
}) {
  const [etape, setEtape] = useState<Etape>("accueil");
  const [cartes, setCartes] = useState<CarteEnregistree[]>([]);
  const [carteId, setCarteId] = useState<string>("");
  const [telephone, setTelephone] = useState(utilisateur?.telephone ?? "");
  const [numero, setNumero] = useState("");
  const [prenoms, setPrenoms] = useState(utilisateur?.prenom ?? "");
  const [nom, setNom] = useState(utilisateur?.nom ?? "");
  const [expiration, setExpiration] = useState("");
  const [cvv, setCvv] = useState("");
  const [cvvVisible, setCvvVisible] = useState(false);
  const [adresseIdentique, setAdresseIdentique] = useState(true);
  const [adresseFacture, setAdresseFacture] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [simulation, setSimulation] = useState(true);

  const tauxFrais = 0.03;
  const frais = Math.round(montantCommande * tauxFrais);
  const total = montantCommande + frais;
  const carteActive = cartes.find((carte) => carte.id === carteId) ?? cartes[0];
  const adresseLivraison = [utilisateur?.adresse, utilisateur?.ville || "Kinshasa", "RD Congo"]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    const lues = lireCartesEnregistrees();
    setCartes(lues);
    setCarteId(lues[0]?.id ?? "");
    setPrenoms(utilisateur?.prenom ?? "");
    setNom(utilisateur?.nom ?? "");
    setTelephone(utilisateur?.telephone ?? "");
    setAdresseFacture(adresseLivraison);
    appelerApi<{ configuration: { mode: string } }>("/paiements/configuration")
      .then((donnees) => setSimulation(donnees.configuration.mode !== "FLEXPAIE"))
      .catch(() => setSimulation(true));
  }, [utilisateur, adresseLivraison]);

  const titre = useMemo(() => {
    if (etape === "cartes" || etape === "nouvelle-carte") return "Sélectionner une carte";
    return "Paiement";
  }, [etape]);

  async function payer(canal: Canal, extras?: { telephone?: string; carte?: CarteEnregistree }) {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await appelerApi<ReponsePaiement>("/paiements/confirmer", {
        method: "POST",
        body: JSON.stringify({
          canal,
          commandeId,
          telephone: extras?.telephone,
          marqueCarte: extras?.carte?.marque,
          derniersChiffres: extras?.carte?.derniers,
        }),
      });
      onSucces(reponse.commande);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Paiement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  function payerCarteEnregistree() {
    if (!carteActive) {
      setEtape("canaux");
      return;
    }
    void payer("CARTE", { carte: carteActive });
  }

  function payerNouvelleCarte() {
    if (!numeroCarteValide(numero)) {
      setErreur("Numéro de carte invalide.");
      return;
    }
    if (!prenoms.trim() || !nom.trim()) {
      setErreur("Indiquez le nom figurant sur la carte.");
      return;
    }
    if (!expirationValide(expiration)) {
      setErreur("Date d'expiration invalide.");
      return;
    }
    if (cvv.replace(/\D/g, "").length < 3) {
      setErreur("CVV/CVC invalide.");
      return;
    }
    const chiffres = numero.replace(/\D/g, "");
    const carte: CarteEnregistree = {
      id: `carte-${chiffres.slice(-4)}-${Date.now()}`,
      marque: marqueDepuisNumero(numero),
      derniers: chiffres.slice(-4),
      masque: masquerNumero(numero),
    };
    enregistrerCarteLocale(carte);
    setCartes(lireCartesEnregistrees());
    void payer("CARTE", { carte });
  }

  function payerSelonEtape() {
    if (etape === "nouvelle-carte") {
      payerNouvelleCarte();
      return;
    }
    if (etape === "flexpaie") {
      const tel = telephone.replace(/\D/g, "");
      if (tel.length < 9) {
        setErreur("Indiquez un numéro FlexPaie / Mobile Money valide.");
        return;
      }
      void payer("FLEXPAIE", { telephone });
      return;
    }
    if (etape === "virement") {
      void payer("VIREMENT");
      return;
    }
    payerCarteEnregistree();
  }

  function revenir() {
    if (etape === "accueil") {
      onFermer();
      return;
    }
    if (etape === "nouvelle-carte") {
      setEtape("cartes");
      return;
    }
    if (etape === "cartes" || etape === "flexpaie" || etape === "virement") {
      setEtape("canaux");
      return;
    }
    if (etape === "canaux") {
      setEtape("accueil");
      return;
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BoutonRetourEtape
            onClick={revenir}
            libelle={etape === "accueil" ? "Retour au panier" : "Retour"}
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-orange-paiement">Paiement sécurisé</p>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{titre}</h1>
          </div>
        </div>
        <Link
          href="/messagerie"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Headset className="h-4 w-4" />
          Assistance
        </Link>
      </header>

      <div className="mb-5">
        <EtapesParcoursCommande etapeCourante={2} />
      </div>

      {simulation && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          Mode simulation — aucun débit réel tant que l&apos;API n&apos;est pas branchée
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:col-span-7 xl:col-span-8">
          {etape === "accueil" && (
            <EcranAccueil
              montantCommande={montantCommande}
              frais={frais}
              total={total}
              carte={carteActive}
              enCours={enCours}
              onPayer={payerCarteEnregistree}
              onAutres={() => setEtape("canaux")}
              onCartes={() => setEtape("cartes")}
            />
          )}

          {etape === "canaux" && (
            <EcranCanaux
              total={total}
              carte={carteActive}
              onCarte={() => setEtape("cartes")}
              onFlexPaie={() => setEtape("flexpaie")}
              onVirement={() => setEtape("virement")}
              enCours={enCours}
              onPayer={payerCarteEnregistree}
            />
          )}

          {etape === "cartes" && (
            <EcranCartes
              total={total}
              cartes={cartes}
              carteId={carteId}
              onChoisir={setCarteId}
              onNouvelle={() => {
                setErreur(null);
                setEtape("nouvelle-carte");
              }}
              enCours={enCours}
              onPayer={payerCarteEnregistree}
            />
          )}

          {etape === "nouvelle-carte" && (
            <EcranNouvelleCarte
              numero={numero}
              prenoms={prenoms}
              nom={nom}
              expiration={expiration}
              cvv={cvv}
              cvvVisible={cvvVisible}
              adresseIdentique={adresseIdentique}
              adresseLivraison={adresseLivraison}
              adresseFacture={adresseFacture}
              onNumero={(valeur) => setNumero(formaterNumeroCarte(valeur))}
              onPrenoms={setPrenoms}
              onNom={setNom}
              onExpiration={(valeur) => setExpiration(formaterExpiration(valeur))}
              onCvv={(valeur) => setCvv(valeur.replace(/\D/g, "").slice(0, 4))}
              onCvvVisible={() => setCvvVisible((actuel) => !actuel)}
              onAdresseIdentique={setAdresseIdentique}
              onAdresseFacture={setAdresseFacture}
              enCours={enCours}
              onPayer={payerNouvelleCarte}
            />
          )}

          {etape === "flexpaie" && (
            <EcranFlexPaie
              total={total}
              telephone={telephone}
              onTelephone={setTelephone}
              enCours={enCours}
              onPayer={() => {
                const tel = telephone.replace(/\D/g, "");
                if (tel.length < 9) {
                  setErreur("Indiquez un numéro FlexPaie / Mobile Money valide.");
                  return;
                }
                void payer("FLEXPAIE", { telephone });
              }}
            />
          )}

          {etape === "virement" && (
            <EcranVirement total={total} enCours={enCours} onPayer={() => void payer("VIREMENT")} />
          )}

          {erreur && <p className="mt-4 text-sm font-medium text-red-600">{erreur}</p>}
        </section>

        <PanneauResume
          articles={articles}
          entrepot={entrepot}
          utilisateur={utilisateur}
          montantCommande={montantCommande}
          frais={frais}
          total={total}
          enCours={enCours}
          onPayer={payerSelonEtape}
        />
      </div>
    </div>
  );
}

function EcranAccueil({
  montantCommande,
  frais,
  total,
  carte,
  enCours,
  onPayer,
  onAutres,
  onCartes,
}: {
  montantCommande: number;
  frais: number;
  total: number;
  carte?: CarteEnregistree;
  enCours: boolean;
  onPayer: () => void;
  onAutres: () => void;
  onCartes: () => void;
}) {
  return (
    <>
      <ResumeMontant montantCommande={montantCommande} frais={frais} total={total} />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ApercuCanal titre="Carte Visa / bancaire" onClick={onCartes}>
          <div className="flex items-center gap-2">
            <LogoVisa classe="h-5" />
            <LogoMastercard classe="h-5" />
          </div>
        </ApercuCanal>
        <ApercuCanal titre="FlexPaie" onClick={onAutres}>
          <Smartphone className="h-7 w-7 text-sky-700" />
        </ApercuCanal>
        <ApercuCanal titre="Virement T/T" onClick={onAutres}>
          <p className="text-lg font-bold text-sky-700">T/T</p>
        </ApercuCanal>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Vos cartes / comptes enregistrés</p>
        {carte ? (
          <button
            type="button"
            onClick={onCartes}
            className="flex w-full items-center gap-3 rounded-xl border-2 border-orange-paiement px-3 py-3 text-left"
          >
            <LogoVisa />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{carte.marque}</p>
              <p className="text-xs text-slate-500">{carte.masque}</p>
            </div>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-paiement text-white">
              <Check className="h-3 w-3" />
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        ) : (
          <p className="text-sm text-slate-500">Aucune carte enregistrée.</p>
        )}
      </div>
      <button type="button" onClick={onAutres} className="mt-4 text-left text-sm font-medium text-orange-paiement">
        Autres moyens de paiement
      </button>
      <BoutonPayer libelle="Payer maintenant" enCours={enCours} onClick={onPayer} />
    </>
  );
}

function EcranCanaux({
  total,
  carte,
  onCarte,
  onFlexPaie,
  onVirement,
  enCours,
  onPayer,
}: {
  total: number;
  carte?: CarteEnregistree;
  onCarte: () => void;
  onFlexPaie: () => void;
  onVirement: () => void;
  enCours: boolean;
  onPayer: () => void;
}) {
  return (
    <>
      <p className="text-3xl font-bold text-slate-900">{formaterMontant(total)}</p>
      {carte && (
        <button type="button" onClick={onCarte} className="mt-3 flex w-full items-center gap-3 text-left">
          <LogoVisa />
          <p className="flex-1 text-sm text-slate-600">{carte.masque}</p>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <CanalCarte titre="Carte de crédit/débit" onClick={onCarte}>
          <div className="flex items-center gap-2">
            <LogoVisa classe="h-5" />
            <LogoMastercard classe="h-5" />
          </div>
        </CanalCarte>
        <CanalCarte titre="FlexPaie" onClick={onFlexPaie}>
          <div className="flex items-center gap-2 text-sky-700">
            <Smartphone className="h-8 w-8" />
            <span className="text-lg font-bold">FlexPaie</span>
          </div>
        </CanalCarte>
        <CanalCarte titre="Virement bancaire T/T" onClick={onVirement}>
          <p className="text-2xl font-bold text-sky-700">T/T</p>
        </CanalCarte>
        <CanalCarte titre="Mobile Money" onClick={onFlexPaie}>
          <Landmark className="h-8 w-8 text-emerald-600" />
        </CanalCarte>
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-emerald-700">
        <Lock className="h-3.5 w-3.5" />
        Sécurité des paiements certifiée PCI
      </p>
      <BoutonPayer libelle="Payer maintenant" enCours={enCours} onClick={onPayer} />
    </>
  );
}

function ApercuCanal({
  titre,
  onClick,
  children,
}: {
  titre: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center hover:border-orange-paiement"
    >
      {children}
      <span className="text-xs font-medium text-slate-600">{titre}</span>
    </button>
  );
}

function CanalCarte({
  titre,
  onClick,
  children,
}: {
  titre: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm hover:border-orange-paiement"
    >
      {children}
      <span className="text-xs font-medium text-slate-600">{titre}</span>
    </button>
  );
}

function EcranCartes({
  total,
  cartes,
  carteId,
  onChoisir,
  onNouvelle,
  enCours,
  onPayer,
}: {
  total: number;
  cartes: CarteEnregistree[];
  carteId: string;
  onChoisir: (id: string) => void;
  onNouvelle: () => void;
  enCours: boolean;
  onPayer: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
        <p className="text-xl font-bold text-slate-900">{formaterMontant(total)}</p>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5" /> FC
        </span>
      </div>
      <button
        type="button"
        onClick={onNouvelle}
        className="mt-4 flex w-full items-center justify-between rounded-xl py-2 text-sm font-semibold text-orange-paiement"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Utilisez une nouvelle carte
        </span>
        <ChevronRight className="h-4 w-4" />
      </button>
      <div className="mt-2 space-y-3">
        {cartes.map((carte) => {
          const active = carte.id === carteId;
          return (
            <button
              key={carte.id}
              type="button"
              onClick={() => onChoisir(carte.id)}
              className={`relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left ${
                active ? "border-orange-paiement" : "border-slate-200"
              }`}
            >
              <LogoVisa />
              <div>
                <p className="text-sm font-semibold">{carte.marque}</p>
                <p className="text-xs text-slate-500">{carte.masque}</p>
              </div>
              {active && (
                <span className="absolute right-0 top-0 grid h-5 w-6 place-items-center rounded-bl-lg rounded-tr-xl bg-orange-paiement text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <BoutonPayer libelle="Payer maintenant" enCours={enCours} onClick={onPayer} />
    </>
  );
}

function EcranNouvelleCarte({
  numero,
  prenoms,
  nom,
  expiration,
  cvv,
  cvvVisible,
  adresseIdentique,
  adresseLivraison,
  adresseFacture,
  onNumero,
  onPrenoms,
  onNom,
  onExpiration,
  onCvv,
  onCvvVisible,
  onAdresseIdentique,
  onAdresseFacture,
  enCours,
  onPayer,
}: {
  numero: string;
  prenoms: string;
  nom: string;
  expiration: string;
  cvv: string;
  cvvVisible: boolean;
  adresseIdentique: boolean;
  adresseLivraison: string;
  adresseFacture: string;
  onNumero: (valeur: string) => void;
  onPrenoms: (valeur: string) => void;
  onNom: (valeur: string) => void;
  onExpiration: (valeur: string) => void;
  onCvv: (valeur: string) => void;
  onCvvVisible: () => void;
  onAdresseIdentique: (valeur: boolean) => void;
  onAdresseFacture: (valeur: string) => void;
  enCours: boolean;
  onPayer: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => document.getElementById("numero-carte-elmed")?.focus()}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-50 py-3 text-sm font-semibold text-orange-paiement"
      >
        <ScanLine className="h-4 w-4" />
        Scanner le numéro de carte
      </button>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Informations sur la carte</h3>
      <div className="space-y-3">
        <Champ
          id="numero-carte-elmed"
          valeur={numero}
          onChange={onNumero}
          placeholder="Numéro de carte"
          autoComplete="cc-number"
          inputMode="numeric"
        />
        <p className="text-[11px] text-slate-400">Simulation : 4111 1111 1111 1111 · exp. 12/28 · CVV 123</p>
        <Champ
          valeur={prenoms}
          onChange={onPrenoms}
          placeholder="Prénoms"
          autoComplete="cc-given-name"
          effacable
        />
        <Champ valeur={nom} onChange={onNom} placeholder="Nom" autoComplete="cc-family-name" effacable />
        <Champ
          valeur={expiration}
          onChange={onExpiration}
          placeholder="Date d'expiration (MM/YY)"
          autoComplete="cc-exp"
          inputMode="numeric"
          icone={<Calendar className="h-4 w-4 text-slate-400" />}
        />
        <Champ
          valeur={cvv}
          onChange={onCvv}
          placeholder="CVV/CVC"
          autoComplete="cc-csc"
          inputMode="numeric"
          type={cvvVisible ? "text" : "password"}
          icone={
            <span className="flex items-center gap-2">
              <button type="button" onClick={onCvvVisible} aria-label="Afficher le CVV">
                {cvvVisible ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </button>
              <span title="3 ou 4 chiffres au dos de la carte">
                <HelpCircle className="h-4 w-4 text-slate-400" />
              </span>
            </span>
          }
        />
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-slate-900">Adresse de facturation</h3>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="radio"
          checked={adresseIdentique}
          onChange={() => onAdresseIdentique(true)}
          className="mt-1 accent-orange-paiement"
        />
        Identique à l&apos;adresse de livraison
      </label>
      <label className="mt-2 flex items-start gap-2 text-sm text-slate-700">
        <input
          type="radio"
          checked={!adresseIdentique}
          onChange={() => onAdresseIdentique(false)}
          className="mt-1 accent-orange-paiement"
        />
        Utiliser une nouvelle adresse de facturation
      </label>
      {!adresseIdentique && (
        <textarea
          value={adresseFacture}
          onChange={(evenement) => onAdresseFacture(evenement.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          rows={3}
        />
      )}
      {adresseIdentique && <p className="mt-2 text-xs text-slate-500">{adresseLivraison}</p>}
      <p className="mt-5 text-center text-[11px] font-semibold tracking-wider text-slate-400">PCI DSS</p>
      <BoutonPayer libelle="Payer maintenant" enCours={enCours} onClick={onPayer} />
    </>
  );
}

function EcranFlexPaie({
  total,
  telephone,
  onTelephone,
  enCours,
  onPayer,
}: {
  total: number;
  telephone: string;
  onTelephone: (valeur: string) => void;
  enCours: boolean;
  onPayer: () => void;
}) {
  return (
    <>
      <p className="text-3xl font-bold text-slate-900">{formaterMontant(total)}</p>
      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
        <p className="text-sm font-semibold text-sky-800">FlexPaie · Mobile Money</p>
        <p className="mt-1 text-xs text-sky-700">
          M-Pesa, Airtel Money, Orange Money. Une demande de confirmation arrivera sur le téléphone.
        </p>
      </div>
      <label className="mt-5 block text-sm font-medium text-slate-700">
        Numéro de paiement
        <input
          value={telephone}
          onChange={(evenement) => onTelephone(evenement.target.value)}
          inputMode="tel"
          placeholder="243 8XX XXX XXX"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
      </label>
      <BoutonPayer libelle="Payer maintenant" enCours={enCours} onClick={onPayer} />
    </>
  );
}

function EcranVirement({
  total,
  enCours,
  onPayer,
}: {
  total: number;
  enCours: boolean;
  onPayer: () => void;
}) {
  return (
    <>
      <p className="text-3xl font-bold text-slate-900">{formaterMontant(total)}</p>
      <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-800">Coordonnées bancaires ELMED</p>
        <p>Banque : Rawbank — Gombe</p>
        <p>Titulaire : ELMED SARL</p>
        <p>Compte CDF : 00011 25100 123456789</p>
        <p>SWIFT : RAWBCDKI</p>
        <p className="text-xs text-slate-500">Indiquez le numéro de commande dans le motif du virement.</p>
      </div>
      <BoutonPayer libelle="J'ai effectué le virement" enCours={enCours} onClick={onPayer} />
    </>
  );
}

function ResumeMontant({
  montantCommande,
  frais,
  total,
}: {
  montantCommande: number;
  frais: number;
  total: number;
}) {
  return (
    <>
      <p className="text-3xl font-bold text-slate-900">{formaterMontant(total)}</p>
      <dl className="mt-3 space-y-1 text-sm text-slate-500">
        <div className="flex justify-between">
          <dt>Total commande</dt>
          <dd>{formaterMontant(montantCommande)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="inline-flex items-center gap-1">
            Frais de transaction
            <HelpCircle className="h-3.5 w-3.5" />
          </dt>
          <dd>{formaterMontant(frais)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Globe className="h-3.5 w-3.5" /> RD Congo
        </span>
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3.5 w-3.5" /> FC
        </span>
      </div>
    </>
  );
}

function Champ({
  id,
  valeur,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  type = "text",
  icone,
  effacable,
}: {
  id?: string;
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  icone?: ReactNode;
  effacable?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        type={type}
        className="w-full rounded-xl border border-slate-200 px-3 py-3 pr-16 text-sm outline-none focus:border-orange-paiement"
      />
      <div className="absolute inset-y-0 right-3 flex items-center gap-2">
        {effacable && valeur && (
          <button type="button" onClick={() => onChange("")} className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-slate-600" aria-label="Effacer">
            <X className="h-3 w-3" />
          </button>
        )}
        {icone}
      </div>
    </div>
  );
}

function PanneauResume({
  articles,
  entrepot,
  utilisateur,
  montantCommande,
  frais,
  total,
  enCours,
  onPayer,
}: {
  articles: ArticlePanier[];
  entrepot?: EntrepotResume | null;
  utilisateur: Utilisateur | null;
  montantCommande: number;
  frais: number;
  total: number;
  enCours: boolean;
  onPayer: () => void;
}) {
  const nombreArticles = articles.reduce((somme, article) => somme + article.quantite, 0);

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:col-span-5 xl:col-span-4">
      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Récapitulatif</h2>
          <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-paiement">
            {nombreArticles} article{nombreArticles > 1 ? "s" : ""}
          </span>
        </div>

        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {articles.map((article) => (
            <div key={article.id} className="flex gap-3">
              <img
                src={article.image ?? ""}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-slate-800">{article.nomProduit}</p>
                <p className="text-[11px] text-slate-400">
                  {article.quantite} × {formaterMontant(article.prixUnitaire)}
                  {article.sku ? ` · ${article.sku}` : ""}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{formaterMontant(article.sousTotal)}</p>
            </div>
          ))}
        </div>

        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Sous-total</dt>
            <dd>{formaterMontant(montantCommande)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>Livraison</dt>
            <dd>0 FC</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt className="inline-flex items-center gap-1">
              Frais de transaction
              <HelpCircle className="h-3.5 w-3.5" />
            </dt>
            <dd>{formaterMontant(frais)}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-end justify-between rounded-xl bg-orange-50 px-3 py-3">
          <div>
            <p className="text-xs text-slate-500">Montant à payer</p>
            <p className="text-xl font-bold text-slate-900">{formaterMontant(total)}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" /> FC
          </span>
        </div>

        <button
          type="button"
          onClick={onPayer}
          disabled={enCours}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl ${orange} py-3 text-sm font-bold text-white disabled:opacity-60`}
        >
          <ShieldCheck className="h-4 w-4" />
          {enCours ? "Traitement..." : "Payer maintenant"}
        </button>
      </article>

      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Package className="h-4 w-4 text-orange-paiement" />
          Client et livraison
        </h3>
        <p className="text-sm font-medium text-slate-800">
          {utilisateur?.nomSociete || utilisateur?.nomComplet || "Client"}
        </p>
        {utilisateur?.nomSociete && utilisateur.nomComplet && (
          <p className="text-xs text-slate-500">{utilisateur.nomComplet}</p>
        )}
        {entrepot && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              Point de retrait
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">{entrepot.nom}</p>
            <p className="text-xs text-slate-500">
              {entrepot.adresse}, {entrepot.ville}
            </p>
            {entrepot.heures && <p className="mt-1 text-[11px] text-slate-400">{entrepot.heures}</p>}
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-slate-100 bg-white p-4 text-xs text-slate-500 shadow-sm">
        <p className="inline-flex items-center gap-1 font-medium text-emerald-700">
          <Lock className="h-3.5 w-3.5" />
          Paiement chiffré · PCI DSS
        </p>
        <p className="mt-2">Les fonds sont transmis à ELMED. Le numéro de carte complet n&apos;est jamais enregistré.</p>
        <p className="mt-1">Pays : RD Congo · Devise : FC</p>
      </article>
    </aside>
  );
}
