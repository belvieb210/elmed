import Link from "next/link";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
export default function PageAide() {
  return (
    <MiseEnPageClient>
      <EnTetePage titre="Aide & Contact" description="MateMedical vous accompagne pour vos commandes B2B." />
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-bleu-hero bg-white p-6">
          <h2 className="font-semibold text-slate-800">Service commercial</h2>
          <p className="mt-2 text-sm text-slate-500">Téléphone : +243 890 000 100</p>
          <p className="text-sm text-slate-500">Email : support@matemedical.cd</p>
          <p className="text-sm text-slate-500">Horaires : 08h00 - 17h00</p>
        </article>
        <article className="rounded-2xl border border-bleu-hero bg-white p-6">
          <h2 className="font-semibold text-slate-800">Entrepôt Central Kinshasa</h2>
          <p className="mt-2 text-sm text-slate-500">Avenue des Poids Lourds, Kinshasa</p>
          <p className="mt-4 text-sm text-slate-500">
            Pour une question sur un produit, utilisez « Discuter ici » sur sa fiche. L’historique complet des
            conversations nécessite un compte.
          </p>
        </article>
      </div>
    </MiseEnPageClient>
  );
}
