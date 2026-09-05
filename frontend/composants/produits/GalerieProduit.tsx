"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Expand, Heart } from "lucide-react";

export function GalerieProduit({ images, nomProduit }: { images: string[]; nomProduit: string }) {
  const [indexActif, setIndexActif] = useState(0);
  const [debutVignettes, setDebutVignettes] = useState(0);
  const [zoomOuvert, setZoomOuvert] = useState(false);
  const liste = images.length > 0 ? images : [""];
  const visible = 4;
  const vignettes = liste.slice(debutVignettes, debutVignettes + visible);

  function aller(index: number) {
    const suivant = (index + liste.length) % liste.length;
    setIndexActif(suivant);
    if (suivant < debutVignettes) setDebutVignettes(suivant);
    if (suivant >= debutVignettes + visible) setDebutVignettes(suivant - visible + 1);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="hidden flex-col items-center gap-2 sm:flex">
        {vignettes.map((url, index) => {
          const indexReel = debutVignettes + index;
          return (
            <button
              key={`${url}-${indexReel}`}
              type="button"
              onClick={() => setIndexActif(indexReel)}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                indexReel === indexActif ? "border-violet-marque" : "border-slate-200"
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          );
        })}
        {liste.length > visible && (
          <button
            type="button"
            onClick={() => setDebutVignettes((actuel) => Math.min(actuel + 1, Math.max(0, liste.length - visible)))}
            className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white"
            aria-label="Voir plus d'images"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-2xl bg-slate-50">
        <img
          src={liste[indexActif]}
          alt={nomProduit}
          className="h-full max-h-[460px] w-full object-contain"
        />
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm"
            aria-label="Favoris"
          >
            <Heart className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomOuvert(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm"
            aria-label="Agrandir"
          >
            <Expand className="h-4 w-4" />
          </button>
        </div>
        {liste.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => aller(indexActif - 1)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => aller(indexActif + 1)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto sm:hidden">
        {liste.map((url, index) => (
          <button
            key={`${url}-m-${index}`}
            type="button"
            onClick={() => setIndexActif(index)}
            className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 ${
              index === indexActif ? "border-violet-marque" : "border-slate-200"
            }`}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {zoomOuvert && (
        <button
          type="button"
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setZoomOuvert(false)}
        >
          <img src={liste[indexActif]} alt={nomProduit} className="max-h-[90vh] max-w-full object-contain" />
        </button>
      )}
    </div>
  );
}
