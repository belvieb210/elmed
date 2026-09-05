"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { MiseEnPageClient } from "@/composants/client/MiseEnPageClient";
import { EnTetePage } from "@/composants/client/EnTetePage";
import { BandeauMessagerie } from "@/composants/client/BandeauMessagerie";
import { formaterMontant } from "@/lib/formatage";
import { appelerApi } from "@/lib/api";
import { useClient } from "@/store/contexteClient";

export default function PagePanier() {
  const routeur = useRouter();
  const { panier, chargerPanier, chargerTableauDeBord } = useClient();
  const [notes, setNotes] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    chargerPanier();
  }, [chargerPanier]);

  async function changerQuantite(id: string, quantite: number) {
    await appelerApi(`/panier/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantite }),
    });
    await Promise.all([chargerPanier(), chargerTableauDeBord()]);
  }

  async function envoyerCommande() {
    setEnCours(true);
    setMessage(null);
    try {
      const resultat = await appelerApi<{ message: string }>("/commandes", {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      setMessage(resultat.message);
      await Promise.all([chargerPanier(), chargerTableauDeBord()]);
      routeur.push("/commandes");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <MiseEnPageClient>
      <EnTetePage titre="Panier" description="Vérifiez vos articles avant d'envoyer la commande." />

      {!panier || panier.articles.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-sm text-slate-500">
          Votre panier est vide.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {panier.articles.map((article) => (
              <article
                key={article.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center"
              >
                <img
                  src={article.image ?? ""}
                  alt={article.nomProduit}
                  className="h-20 w-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h2 className="font-medium text-slate-800">{article.nomProduit}</h2>
                  <p className="text-sm text-slate-500">{formaterMontant(article.prixUnitaire)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border p-1"
                    onClick={() => changerQuantite(article.id, article.quantite - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{article.quantite}</span>
                  <button
                    type="button"
                    className="rounded-lg border p-1"
                    onClick={() => changerQuantite(article.id, article.quantite + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-red-500"
                    onClick={() => changerQuantite(article.id, 0)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-semibold">{formaterMontant(article.sousTotal)}</p>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-semibold">{formaterMontant(panier.montantTotal)}</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Message ou fichier à préciser pour l'entreprise..."
              className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none"
              rows={4}
            />
            <button
              type="button"
              onClick={envoyerCommande}
              disabled={enCours}
              className="mt-4 w-full rounded-xl bg-violet-marque py-3 text-sm font-semibold text-white hover:bg-violet-fonce disabled:opacity-60"
            >
              {enCours ? "Envoi..." : "Envoyer la commande"}
            </button>
            {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
          </aside>
        </div>
      )}
      <BandeauMessagerie />
    </MiseEnPageClient>
  );
}
