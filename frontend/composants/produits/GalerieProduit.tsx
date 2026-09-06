"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Expand, Heart, Play } from "lucide-react";
import type { MediaProduit } from "@/types/modeles";

function mediasDepuisImages(images: string[]): MediaProduit[] {
  return images.filter(Boolean).map((url) => ({ type: "IMAGE", url }));
}

function urlVignette(media: MediaProduit) {
  return media.type === "VIDEO" ? media.urlCouverture || media.url : media.url;
}

export function GalerieProduit({
  medias,
  images,
  nomProduit,
}: {
  medias?: MediaProduit[];
  images?: string[];
  nomProduit: string;
}) {
  const liste = useMemo(() => {
    if (medias && medias.length > 0) return medias;
    return mediasDepuisImages(images ?? []);
  }, [medias, images]);

  const [indexActif, setIndexActif] = useState(0);
  const [debutVignettes, setDebutVignettes] = useState(0);
  const [zoomOuvert, setZoomOuvert] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visible = 4;
  const mediaActif = liste[indexActif];
  const estVideo = mediaActif?.type === "VIDEO";
  const vignettes = liste.slice(debutVignettes, debutVignettes + visible);

  useEffect(() => {
    setIndexActif(0);
    setDebutVignettes(0);
    setZoomOuvert(false);
  }, [nomProduit, liste.length]);

  useEffect(() => {
    if (!estVideo) {
      videoRef.current?.pause();
    }
  }, [estVideo, indexActif]);

  function aller(index: number) {
    if (liste.length === 0) return;
    const suivant = (index + liste.length) % liste.length;
    setIndexActif(suivant);
    if (suivant < debutVignettes) setDebutVignettes(suivant);
    if (suivant >= debutVignettes + visible) setDebutVignettes(suivant - visible + 1);
  }

  function Vignette({ media, index, classe }: { media: MediaProduit; index: number; classe: string }) {
    return (
      <button
        type="button"
        onClick={() => setIndexActif(index)}
        className={`${classe} relative overflow-hidden rounded-xl border-2 ${
          index === indexActif ? "border-violet-marque" : "border-slate-200"
        }`}
      >
        <img src={urlVignette(media)} alt="" className="h-full w-full object-cover" />
        {media.type === "VIDEO" && (
          <span className="absolute inset-0 grid place-items-center bg-black/25">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-800 shadow-sm">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
          </span>
        )}
      </button>
    );
  }

  if (!mediaActif) {
    return <div className="min-h-[280px] rounded-2xl bg-slate-50" />;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="hidden flex-col items-center gap-2 sm:flex">
        {vignettes.map((media, index) => {
          const indexReel = debutVignettes + index;
          return (
            <Vignette
              key={`${media.type}-${media.url}-${indexReel}`}
              media={media}
              index={indexReel}
              classe="h-16 w-16"
            />
          );
        })}
        {liste.length > visible && (
          <button
            type="button"
            onClick={() => setDebutVignettes((actuel) => Math.min(actuel + 1, Math.max(0, liste.length - visible)))}
            className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white"
            aria-label="Voir plus de médias"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl bg-slate-50 sm:min-h-[280px]">
        {estVideo ? (
          <video
            key={mediaActif.url}
            ref={videoRef}
            src={mediaActif.url}
            poster={mediaActif.urlCouverture}
            controls
            playsInline
            muted
            autoPlay
            className="h-full max-h-[320px] w-full bg-black object-contain sm:max-h-[460px]"
          >
            Votre navigateur ne peut pas lire cette vidéo.
          </video>
        ) : (
          <img
            src={mediaActif.url}
            alt={nomProduit}
            className="h-full max-h-[320px] w-full object-contain sm:max-h-[460px]"
          />
        )}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm"
            aria-label="Favoris"
          >
            <Heart className="h-4 w-4" />
          </button>
          {!estVideo && (
            <button
              type="button"
              onClick={() => setZoomOuvert(true)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm"
              aria-label="Agrandir"
            >
              <Expand className="h-4 w-4" />
            </button>
          )}
        </div>
        {liste.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => aller(indexActif - 1)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm"
              aria-label="Média précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => aller(indexActif + 1)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-sm"
              aria-label="Média suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto sm:hidden">
        {liste.map((media, index) => (
          <Vignette
            key={`${media.type}-${media.url}-m-${index}`}
            media={media}
            index={index}
            classe="h-14 w-14 shrink-0"
          />
        ))}
      </div>

      {zoomOuvert && !estVideo && (
        <button
          type="button"
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setZoomOuvert(false)}
        >
          <img src={mediaActif.url} alt={nomProduit} className="max-h-[90vh] max-w-full object-contain" />
        </button>
      )}
    </div>
  );
}
