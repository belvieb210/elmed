"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { appelerApi } from "@/lib/api";
import { classeStatut, formaterDate, formaterMontant, libelleStatutCommande } from "@/lib/formatage";
import type { CommandeResume } from "@/types/modeles";

function ListeCommandes() {
  const params = useSearchParams();
  const statutFiltre = params.get("statut") ?? "";
  const [commandes, setCommandes] = useState<CommandeResume[]>([]);

  useEffect(() => {
    appelerApi<{ commandes: CommandeResume[] }>("/commandes")
      .then((donnees) => setCommandes(donnees.commandes))
      .catch(async () => {
        const { tableauDeBordDemo } = await import("@/lib/donneesDemo");
        setCommandes(tableauDeBordDemo.dernieresCommandes);
      });
  }, []);

  const commandesFiltrees = useMemo(() => {
    if (!statutFiltre) return commandes;
    if (statutFiltre === "VALIDEE") {
      return commandes.filter((commande) =>
        ["VALIDEE", "EN_PREPARATION", "PRET_RETRAIT", "LIVREE", "CLOTUREE"].includes(commande.statut),
      );
    }
    return commandes.filter((commande) => commande.statut === statutFiltre);
  }, [commandes, statutFiltre]);

  return (
    <>
      <EnTetePage titre="Mes commandes" description="Suivez le statut de chaque commande en temps réel." />
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {commandesFiltrees.map((commande) => (
          <Link
            key={commande.id}
            href={`/commandes/${commande.id}`}
            className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-slate-800">#{commande.numeroCommande}</p>
              <p className="text-sm text-slate-400">{formaterDate(commande.dateCommande)}</p>
            </div>
            <p className="font-semibold">{formaterMontant(commande.montantTotal)}</p>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${classeStatut(commande.statut)}`}>
              {commande.libelleStatut ?? libelleStatutCommande(commande.statut)}
            </span>
          </Link>
        ))}
      </div>
      <BandeauMessagerie />
    </>
  );
}

export default function PageCommandes() {
  return (
    <MiseEnPageClient>
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement...</p>}>
        <ListeCommandes />
      </Suspense>
    </MiseEnPageClient>
  );
}
