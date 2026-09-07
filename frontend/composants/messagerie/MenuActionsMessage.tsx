"use client";

import { Copy, Forward, Pencil, Pin, Reply, Trash2 } from "lucide-react";

export function MenuActionsMessage({
  peutModifier,
  epingle,
  onRepondre,
  onCopier,
  onTransferer,
  onEpingler,
  onModifier,
  onSupprimer,
}: {
  peutModifier: boolean;
  epingle?: boolean;
  onRepondre: () => void;
  onCopier: () => void;
  onTransferer: () => void;
  onEpingler: () => void;
  onModifier: () => void;
  onSupprimer: () => void;
}) {
  const actions = [
    { id: "repondre", label: "Répondre", icone: Reply, onClick: onRepondre },
    { id: "copier", label: "Copier", icone: Copy, onClick: onCopier },
    { id: "transferer", label: "Transférer", icone: Forward, onClick: onTransferer },
    { id: "epingler", label: epingle ? "Désépingler" : "Épingler", icone: Pin, onClick: onEpingler },
    ...(peutModifier ? [{ id: "modifier", label: "Modifier", icone: Pencil, onClick: onModifier }] : []),
    { id: "supprimer", label: "Supprimer", icone: Trash2, onClick: onSupprimer, danger: true },
  ];

  return (
    <div className="absolute z-20 w-48 overflow-hidden rounded-2xl border border-bleu-hero bg-white py-1 shadow-lg">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onClick}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
            action.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          <action.icone className="h-4 w-4" />
          {action.label}
        </button>
      ))}
    </div>
  );
}
