"use client";

import { useEffect, useState } from "react";
import { appelerApi } from "@/lib/api";

const IMAGES_DEFAUT = [
  "/medias/logo-microscope.png",
  "/medias/hero-accueil-produits.png",
  "/medias/logo-microscope.png",
];

function normaliserListe(images?: string[] | null, unique?: string | null) {
  const multi = (images ?? []).filter((item) => typeof item === "string" && item.trim().length > 0);
  if (multi.length > 0) return multi.slice(0, 6);
  if (unique?.trim()) return [unique.trim()];
  return [...IMAGES_DEFAUT];
}

export function IllustrationLaboratoire({
  images,
}: {
  images?: string[] | null;
}) {
  const [liste, setListe] = useState<string[]>(() => normaliserListe(images));

  useEffect(() => {
    if (images?.length) {
      setListe(normaliserListe(images));
      return;
    }

    let ignore = false;
    function charger() {
      appelerApi<{
        entreprise: { imagesAccueil?: string[] | null; imageAccueilUrl?: string | null };
      }>("/entreprise")
        .then((donnees) => {
          if (ignore) return;
          setListe(
            normaliserListe(donnees.entreprise.imagesAccueil, donnees.entreprise.imageAccueilUrl),
          );
        })
        .catch(() => {
          if (!ignore) setListe([...IMAGES_DEFAUT]);
        });
    }

    charger();
    window.addEventListener("mm-entreprise-maj", charger);
    return () => {
      ignore = true;
      window.removeEventListener("mm-entreprise-maj", charger);
    };
  }, [images]);

  const affichees = liste.slice(0, 6);

  return (
    <div
      className="flex min-h-[8.5rem] w-full max-w-[320px] items-end justify-center gap-2 rounded-2xl bg-white/10 px-2 py-2 backdrop-blur-[1px] sm:min-h-[10.5rem] sm:max-w-[380px] sm:gap-3 sm:px-3 md:max-w-[420px]"
      aria-hidden
    >
      {affichees.map((src, index) => (
        <div
          key={`${index}-${src.slice(0, 48)}`}
          className="flex h-28 flex-1 items-end justify-center sm:h-36 md:h-40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(15,23,42,0.28)]"
            onError={(evenement) => {
              const cible = evenement.currentTarget;
              if (cible.dataset.fallback === "1") {
                cible.style.display = "none";
                return;
              }
              cible.dataset.fallback = "1";
              cible.src = IMAGES_DEFAUT[index % IMAGES_DEFAUT.length];
            }}
          />
        </div>
      ))}
    </div>
  );
}
