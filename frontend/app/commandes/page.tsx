"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BarriereCompte } from "@/composants/auth/BarriereCompte";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { CarteCommande } from "@/composants/commandes/CarteCommande";
import {
  commandeDansOnglet,
  ongletDepuisStatutUrl,
  type OngletCommandes,
} from "@/composants/commandes/suivi";
import { appelerApi } from "@/lib/api";
import { useEvenementTempsReel } from "@/lib/temps-reel";
import type { CommandeResume } from "@/types/modeles";

const parPage = 5;

function ListeCommandes() {
  const params = useSearchParams();
  const statutUrl = params.get("statut") ?? "";
  const [commandes, setCommandes] = useState<CommandeResume[]>([]);
  const [onglet, setOnglet] = useState<OngletCommandes>(ongletDepuisStatutUrl(statutUrl));
  const [tri, setTri] = useState("recentes");
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<string[]>([]);

  useEffect(() => {
    setOnglet(ongletDepuisStatutUrl(statutUrl));
  }, [statutUrl]);

  const charger = useCallback(() => {
    appelerApi<{ commandes: CommandeResume[] }>("/commandes")
      .then((donnees) => setCommandes(donnees.commandes))
      .catch(() => setCommandes([]));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEvenementTempsReel("commande", charger);

  const compteurs = useMemo(
    () => ({
      toutes: commandes.length,
      en_cours: commandes.filter((commande) => commandeDansOnglet(commande.statut, "en_cours")).length,
      livrees: commandes.filter((commande) => commandeDansOnglet(commande.statut, "livrees")).length,
      annulees: commandes.filter((commande) => commandeDansOnglet(commande.statut, "annulees")).length,
    }),
    [commandes],
  );

  const commandesFiltrees = useMemo(() => {
    const liste = commandes.filter((commande) => commandeDansOnglet(commande.statut, onglet));
    const copie = [...liste];
    copie.sort((a, b) => {
      if (tri === "anciennes") return new Date(a.dateCommande).getTime() - new Date(b.dateCommande).getTime();
      if (tri === "montant_desc") return b.montantTotal - a.montantTotal;
      if (tri === "montant_asc") return a.montantTotal - b.montantTotal;
      return new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime();
    });
    return copie;
  }, [commandes, onglet, tri]);

  const nombrePages = Math.max(1, Math.ceil(commandesFiltrees.length / parPage));
  const pageCourante = Math.min(page, nombrePages);
  const debut = (pageCourante - 1) * parPage;
  const pageCommandes = commandesFiltrees.slice(debut, debut + parPage);

  function changerOnglet(suivant: OngletCommandes) {
    setOnglet(suivant);
    setPage(1);
    setSelection([]);
  }

  const onglets: { id: OngletCommandes; libelle: string; compte: number }[] = [
    { id: "toutes", libelle: "Toutes", compte: compteurs.toutes },
    { id: "en_cours", libelle: "En cours", compte: compteurs.en_cours },
    { id: "livrees", libelle: "Livrées", compte: compteurs.livrees },
    { id: "annulees", libelle: "Annulées", compte: compteurs.annulees },
  ];

  return (
    <>
      <EnTetePage titre="Mes commandes" description="Suivez le statut de chaque commande en temps réel." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {onglets.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changerOnglet(item.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium ${
                onglet === item.id
                  ? "bg-bleu-hero text-white"
                  : "border border-bleu-hero bg-white text-slate-600"
              }`}
            >
              {item.libelle} ({item.compte})
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Trier par :
          <select
            value={tri}
            onChange={(evenement) => {
              setTri(evenement.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-bleu-hero bg-white px-3 py-1.5 text-sm text-slate-700 outline-none"
          >
            <option value="recentes">Plus récentes</option>
            <option value="anciennes">Plus anciennes</option>
            <option value="montant_desc">Montant décroissant</option>
            <option value="montant_asc">Montant croissant</option>
          </select>
        </label>
      </div>

      {pageCommandes.length === 0 ? (
        <div className="rounded-2xl border border-bleu-hero bg-white p-8 text-sm text-slate-500">
          Aucune commande dans cet onglet.
        </div>
      ) : (
        <div className="space-y-3">
          {pageCommandes.map((commande) => (
            <CarteCommande
              key={commande.id}
              commande={commande}
              selectionnee={selection.includes(commande.id)}
              onSelection={(id, cochee) =>
                setSelection((actuel) => (cochee ? [...actuel, id] : actuel.filter((item) => item !== id)))
              }
            />
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
        <p>
          Affichage de {commandesFiltrees.length === 0 ? 0 : debut + 1} à{" "}
          {Math.min(debut + parPage, commandesFiltrees.length)} sur {commandesFiltrees.length} commandes
        </p>
        <div className="flex items-center gap-1">
          {Array.from({ length: nombrePages }, (_item, index) => index + 1).map((numero) => (
            <button
              key={numero}
              type="button"
              onClick={() => setPage(numero)}
              className={`h-8 w-8 rounded-full text-sm font-medium ${
                numero === pageCourante ? "bg-bleu-hero text-white" : "text-slate-600 hover:bg-white"
              }`}
            >
              {numero}
            </button>
          ))}
          {pageCourante < nombrePages && (
            <button
              type="button"
              onClick={() => setPage(pageCourante + 1)}
              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-white"
              aria-label="Page suivante"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function PageCommandes() {
  return (
    <MiseEnPageClient>
      <BarriereCompte
        titre="Historique des commandes"
        description="Créez un compte ou connectez-vous pour retrouver toutes vos commandes, factures et statuts. Commander et payer reste possible sans inscription."
      >
        <Suspense fallback={<p className="text-sm text-slate-500">Chargement...</p>}>
          <ListeCommandes />
        </Suspense>
      </BarriereCompte>
    </MiseEnPageClient>
  );
}
