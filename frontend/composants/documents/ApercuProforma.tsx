import { formaterDate, formaterMontant } from "@/lib/formatage";
import type { ArticlePanier } from "@/types/modeles";

function IconeMicroscope() {
  return (
    <svg viewBox="0 0 64 72" className="h-10 w-9 text-[#2B6CB0] sm:h-16 sm:w-14" fill="none" aria-hidden>
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
  const vides = Math.max(0, 4 - articles.length);

  return (
    <section className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 sm:p-5">
      <div className="relative mx-auto w-full max-w-3xl border-[3px] border-[#2B6CB0] bg-white px-3 py-4 text-[#1E4B8A] sm:px-6 sm:py-5">
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center -rotate-[28deg] select-none text-4xl font-bold tracking-widest text-[#8FB8DC]/30 sm:text-7xl">
          ELMED
        </p>

        <div className="relative flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-start">
          <div>
            <p className="text-2xl font-bold tracking-wide text-[#2B6CB0] sm:text-3xl">ELMED</p>
            <p className="mt-1 text-[10px] leading-4 sm:text-[11px]">Vente des Matériels Médicaux</p>
            <p className="text-[10px] leading-4 sm:text-[11px]">Réactifs de Labo & Produits chimiques</p>
            <p className="mt-2 text-[10px] sm:text-[11px]">RCCM : CD/KNG/RCCM/25-A-00642</p>
            <p className="text-[10px] sm:text-[11px]">Id. Nat. 01-Q8601 -N60892Q</p>
            <p className="text-[10px] sm:text-[11px]">Av. du commerce N°35 Kinshasa-Gombe</p>
            <p className="text-[10px] sm:text-[11px]">Tél. : 0913553866 - 0813553866</p>
          </div>
          <div className="hidden sm:block">
            <IconeMicroscope />
          </div>
          <div className="sm:text-right">
            <p className="text-xs sm:text-sm">Kin , le {aujourdHui}</p>
            <p className="mt-2 inline-block bg-[#2B6CB0] px-4 py-1 text-xs font-bold tracking-wide text-white sm:px-6 sm:py-1.5 sm:text-sm">
              PROFORMA
            </p>
            <p className="mt-2 text-xs sm:text-sm">N° {numero}</p>
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
              <td className="border border-[#2B6CB0] px-1 py-2 text-right sm:px-2">{formaterMontant(montantTotal)}</td>
            </tr>
          </tbody>
        </table>

        <p className="relative mt-5 text-center text-xs italic sm:mt-6 sm:text-sm">Merci de nous avoir choisi</p>
      </div>
    </section>
  );
}
