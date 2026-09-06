export const etapesParcoursCommande = ["Panier", "Paiement", "Confirmation", "Livraison"] as const;

export function EtapesParcoursCommande({ etapeCourante }: { etapeCourante: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {etapesParcoursCommande.map((nom, index) => {
        const numero = index + 1;
        const complete = numero < etapeCourante;
        const courant = numero === etapeCourante;
        return (
          <li key={nom} className="flex items-center gap-2">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                courant
                  ? "bg-orange-paiement text-white"
                  : complete
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {numero}
            </span>
            <span className={courant ? "font-medium text-slate-900" : complete ? "text-slate-600" : "text-slate-400"}>
              {nom}
            </span>
            {index < etapesParcoursCommande.length - 1 && <span className="text-slate-300">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
