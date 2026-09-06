"use client";

import { useEffect, useState } from "react";
import { MiseEnPageAdmin } from "@/composants/admin/MiseEnPageAdmin";
import { libelleRole } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";

export default function PageUtilisateursAdmin() {
  const [utilisateurs, setUtilisateurs] = useState<
    Array<{
      id: string;
      nomComplet: string;
      email: string;
      telephone: string | null;
      role: string;
      photoProfil: string | null;
      actif: boolean;
    }>
  >([]);

  useEffect(() => {
    appelerApi<{ utilisateurs: typeof utilisateurs }>("/admin/utilisateurs")
      .then((donnees) => setUtilisateurs(donnees.utilisateurs))
      .catch(() => setUtilisateurs([]));
  }, []);

  return (
    <MiseEnPageAdmin titre="Utilisateurs" sousTitre="Équipe et comptes clients">
      <div className="overflow-hidden rounded-2xl border border-bleu-hero bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((utilisateur) => (
                <tr key={utilisateur.id} className="border-t border-bleu-hero">
                  <td className="px-4 py-3 font-medium text-slate-800">{utilisateur.nomComplet}</td>
                  <td className="px-4 py-3 text-slate-500">{utilisateur.email}</td>
                  <td className="px-4 py-3">{libelleRole(utilisateur.role)}</td>
                  <td className="px-4 py-3">
                    <span className={utilisateur.actif ? "text-emerald-600" : "text-slate-400"}>
                      {utilisateur.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MiseEnPageAdmin>
  );
}
