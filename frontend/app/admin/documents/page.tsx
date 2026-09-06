"use client";

import { useEffect, useState } from "react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { formaterDate } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";

export default function PageDocumentsAdmin() {
  const [documents, setDocuments] = useState<
    Array<{
      id: string;
      typeDocument: string;
      numeroDocument: string;
      dateCreation: string;
      numeroCommande: string | null;
      nomClient: string;
    }>
  >([]);

  useEffect(() => {
    appelerApi<{ documents: typeof documents }>("/admin/documents")
      .then((donnees) => setDocuments(donnees.documents))
      .catch(() => setDocuments([]));
  }, []);

  return (
    <MiseEnPageAdmin titre="Documents" sousTitre="Factures, proformas et pièces liées">
      <div className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Commande</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-t border-bleu-hero">
                  <td className="px-4 py-3 font-medium">{document.numeroDocument}</td>
                  <td className="px-4 py-3 text-slate-500">{document.typeDocument}</td>
                  <td className="px-4 py-3 text-slate-600">{document.nomClient}</td>
                  <td className="px-4 py-3 text-slate-500">{document.numeroCommande ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formaterDate(document.dateCreation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {documents.length === 0 && <p className="p-6 text-sm text-slate-400">Aucun document pour le moment.</p>}
      </div>
    </MiseEnPageAdmin>
  );
}
