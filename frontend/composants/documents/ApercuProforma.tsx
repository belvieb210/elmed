"use client";

import { useEffect, useState } from "react";
import { formaterDate, formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import type { ParametreEntreprise } from "@/types/modeles";

const defaut: ParametreEntreprise = {
  nomCommercial: "MateMedical",
  raisonSociale: "ELMED",
  activite1: "Vente des Matériels Médicaux",
  activite2: "Réactifs de Labo & Produits chimiques",
  rccm: "CD/KNG/RCCM/25-A-00642",
  idNational: "01-Q8601 -N60892Q",
  adresse: "Av. du commerce N°35 Kinshasa-Gombe",
  telephone: "0913553866 - 0813553866",
  ville: "Kin",
  messagePied: "Merci de nous avoir choisi",
  logoUrl: "/medias/logo-microscope.png",
};

export function ApercuProforma({
  articles,
  montantTotal,
  nomClient,
  numero,
  dateTexte,
  titreDocument = "PROFORMA",
  paiement,
}: {
  articles: Array<{
    id: string;
    nomProduit: string;
    quantite: number;
    prixUnitaire: number;
    sousTotal: number;
  }>;
  montantTotal: number;
  nomClient: string;
  numero?: string;
  dateTexte?: string;
  titreDocument?: string;
  paiement?: { statut: string; libelleStatut: string; libelleMode: string } | null;
}) {
  const [entreprise, setEntreprise] = useState<ParametreEntreprise>(defaut);
  const aujourdHui = dateTexte ?? formaterDate(new Date().toISOString());
  const numeroDocument =
    numero ??
    `PRO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;
  const vides = Math.max(0, 4 - articles.length);
  const payee = paiement?.statut === "PAYE";

  useEffect(() => {
    function charger() {
      appelerApi<{ entreprise: ParametreEntreprise }>("/entreprise")
        .then((donnees) => setEntreprise({ ...defaut, ...donnees.entreprise }))
        .catch(() => undefined);
    }
    charger();
    window.addEventListener("mm-entreprise-maj", charger);
    return () => window.removeEventListener("mm-entreprise-maj", charger);
  }, []);

  return (
    <section className="w-full overflow-x-auto rounded-2xl border border-bleu-hero bg-white p-2 sm:p-5">
      <div className="relative mx-auto w-full max-w-3xl border-[3px] border-[#2B6CB0] bg-white px-3 py-4 text-[#1E4B8A] sm:px-6 sm:py-5">
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center -rotate-[28deg] select-none text-4xl font-bold tracking-widest text-[#8FB8DC]/30 sm:text-7xl">
          {entreprise.raisonSociale}
        </p>

        <div className="relative flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-start">
          <div>
            <p className="text-2xl font-bold tracking-wide text-[#2B6CB0] sm:text-3xl">
              {entreprise.raisonSociale}
            </p>
            <p className="mt-1 text-[10px] leading-4 sm:text-[11px]">{entreprise.activite1}</p>
            <p className="text-[10px] leading-4 sm:text-[11px]">{entreprise.activite2}</p>
            <p className="mt-2 text-[10px] sm:text-[11px]">RCCM : {entreprise.rccm}</p>
            <p className="text-[10px] sm:text-[11px]">Id. Nat. {entreprise.idNational}</p>
            <p className="text-[10px] sm:text-[11px]">{entreprise.adresse}</p>
            <p className="text-[10px] sm:text-[11px]">Tél. : {entreprise.telephone}</p>
          </div>
          <div className="hidden sm:block">
            <img
              src={entreprise.logoUrl || "/medias/logo-microscope.png"}
              alt=""
              className="h-16 w-16 object-contain"
            />
          </div>
          <div className="sm:text-right">
            <p className="text-xs sm:text-sm">
              {entreprise.ville} , le {aujourdHui}
            </p>
            <p className="mt-2 inline-block bg-[#2B6CB0] px-4 py-1 text-xs font-bold tracking-wide text-white sm:px-6 sm:py-1.5 sm:text-sm">
              {titreDocument}
            </p>
            <p className="mt-2 text-xs sm:text-sm">N° {numeroDocument}</p>
            {paiement && (
              <p
                className={`mt-2 text-xs font-semibold sm:text-sm ${
                  payee ? "text-emerald-700" : "text-orange-600"
                }`}
              >
                {paiement.libelleStatut}
                {paiement.libelleMode ? ` · ${paiement.libelleMode}` : ""}
              </p>
            )}
          </div>
        </div>

        <p className="relative mt-4 border-b border-[#2B6CB0] pb-1 text-xs sm:mt-5 sm:text-sm">
          Client (e) <span className="font-medium">{nomClient}</span>
        </p>
        <p className="relative mt-2 text-center text-xs italic sm:text-sm">doit pour ce qui suit :</p>

        <table className="relative mt-3 w-full border-collapse border-2 border-[#2B6CB0] text-[11px] sm:text-sm">
          <thead>
            <tr className="text-center font-semibold">
              <th className="w-10 border border-[#2B6CB0] px-1 py-1.5 sm:w-16 sm:px-2">Qté</th>
              <th className="border border-[#2B6CB0] px-1 py-1.5 sm:px-2">Désignation</th>
              <th className="w-20 border border-[#2B6CB0] px-1 py-1.5 sm:w-32 sm:px-2">Prix Unit</th>
              <th className="w-20 border border-[#2B6CB0] px-1 py-1.5 sm:w-32 sm:px-2">Prix Total</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="h-8">
                <td className="border border-[#2B6CB0] px-1 text-center sm:px-2">{article.quantite}</td>
                <td className="border border-[#2B6CB0] px-1 sm:px-2">{article.nomProduit}</td>
                <td className="border border-[#2B6CB0] px-1 text-right sm:px-2">
                  {formaterMontant(article.prixUnitaire)}
                </td>
                <td className="border border-[#2B6CB0] px-1 text-right sm:px-2">
                  {formaterMontant(article.sousTotal)}
                </td>
              </tr>
            ))}
            {Array.from({ length: vides }, (_item, index) => (
              <tr key={`vide-${index}`} className="h-8">
                <td className="border border-[#2B6CB0]" />
                <td className="border border-[#2B6CB0]" />
                <td className="border border-[#2B6CB0]" />
                <td className="border border-[#2B6CB0]" />
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={3} className="border border-[#2B6CB0] px-2 py-2 text-right sm:px-3">
                TOTAL GENERAL →
              </td>
              <td className="border border-[#2B6CB0] px-1 py-2 text-right sm:px-2">
                {formaterMontant(montantTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {payee && (
          <p className="pointer-events-none absolute bottom-24 right-6 rotate-[-18deg] rounded border-4 border-emerald-600 px-5 py-1 text-2xl font-extrabold tracking-widest text-emerald-600 sm:text-3xl">
            PAYÉ
          </p>
        )}

        <p className="relative mt-5 text-center text-xs italic sm:mt-6 sm:text-sm">
          {entreprise.messagePied}
        </p>
      </div>
    </section>
  );
}
