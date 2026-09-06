import { formaterDate, formaterMontant } from "@/lib/formatage";
import type { ArticlePanier } from "@/types/modeles";

const lignesVides = 12;

function IconeMicroscope() {
  return (
    <svg viewBox="0 0 64 72" className="h-16 w-14 text-[#2B6CB0]" fill="none" aria-hidden>
      <circle cx="32" cy="12" r="7" stroke="currentColor" strokeWidth="2.4" />
      <path d="M32 19v18M18 37h28M32 37L20 60M16 60h32" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="12" y="60" width="40" height="8" rx="2" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="20" cy="50" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ApercuProforma({
  articles,
  montantTotal,
  nomClient,
}: {
  articles: ArticlePanier[];
  montantTotal: number;
  nomClient: string;
}) {
  const aujourdHui = formaterDate(new Date().toISOString());
  const numero = `PRO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;
  const lignesAffichees = [
    ...articles,
    ...Array.from({ length: Math.max(0, lignesVides - articles.length) }, () => null),
  ];

  return (
    <section className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-3 sm:p-5">
      <div className="relative mx-auto min-w-[720px] max-w-3xl border-[3px] border-[#2B6CB0] bg-white px-6 py-5 text-[#1E4B8A]">
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center -rotate-[28deg] select-none text-7xl font-bold tracking-widest text-[#8FB8DC]/30">
          ELMED
        </p>

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div>
            <p className="text-3xl font-bold tracking-wide text-[#2B6CB0]">ELMED</p>
            <p className="mt-1 text-[11px] leading-4">Vente des Matériels Médicaux</p>
            <p className="text-[11px] leading-4">Réactifs de Labo & Produits chimiques</p>
            <p className="mt-2 text-[11px]">RCCM : CD/KNG/RCCM/25-A-00642</p>
            <p className="text-[11px]">Id. Nat. 01-Q8601 -N60892Q</p>
            <p className="text-[11px]">Av. du commerce N°35 Kinshasa-Gombe</p>
            <p className="text-[11px]">Tél. : 0913553866 - 0813553866</p>
          </div>
          <IconeMicroscope />
          <div className="text-right">
            <p className="text-sm">Kin , le {aujourdHui}</p>
            <p className="mt-2 inline-block bg-[#2B6CB0] px-6 py-1.5 text-sm font-bold tracking-wide text-white">
              PROFORMA
            </p>
            <p className="mt-2 text-sm">N° {numero}</p>
          </div>
        </div>

        <p className="relative mt-5 border-b border-[#2B6CB0] pb-1 text-sm">
          Client (e) <span className="font-medium">{nomClient}</span>
        </p>
        <p className="relative mt-2 text-center text-sm italic">doit pour ce qui suit :</p>

        <table className="relative mt-3 w-full border-collapse border-2 border-[#2B6CB0] text-sm">
          <thead>
            <tr className="text-center font-semibold">
              <th className="w-16 border border-[#2B6CB0] px-2 py-1.5">Qté</th>
              <th className="border border-[#2B6CB0] px-2 py-1.5">Désignation</th>
              <th className="w-32 border border-[#2B6CB0] px-2 py-1.5">Prix Unit</th>
              <th className="w-32 border border-[#2B6CB0] px-2 py-1.5">Prix Total</th>
            </tr>
          </thead>
          <tbody>
            {lignesAffichees.map((article, index) => (
              <tr key={article?.id ?? `vide-${index}`} className="h-8">
                <td className="border border-[#2B6CB0] px-2 text-center">{article?.quantite ?? ""}</td>
                <td className="border border-[#2B6CB0] px-2">{article?.nomProduit ?? ""}</td>
                <td className="border border-[#2B6CB0] px-2 text-right">
                  {article ? formaterMontant(article.prixUnitaire) : ""}
                </td>
                <td className="border border-[#2B6CB0] px-2 text-right">
                  {article ? formaterMontant(article.sousTotal) : ""}
                </td>
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={3} className="border border-[#2B6CB0] px-3 py-2 text-right">
                TOTAL GENERAL →
              </td>
              <td className="border border-[#2B6CB0] px-2 py-2 text-right">{formaterMontant(montantTotal)}</td>
            </tr>
          </tbody>
        </table>

        <p className="relative mt-6 text-center text-sm italic">Merci de nous avoir choisi</p>
      </div>
    </section>
  );
}
