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
      className="flex w-full min-w-[240px] max-w-[440px] items-end justify-center gap-2 sm:gap-3"
      aria-hidden
    >
      {affichees.map((src, index) => {
        const total = affichees.length;
        const estMilieu = total >= 3 && index === Math.floor((total - 1) / 2);
        return (
          <div
            key={`${index}-${src.slice(0, 48)}`}
            className={`flex flex-1 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.22)] sm:p-2.5 ${
              estMilieu ? "min-h-[9.5rem] sm:min-h-[11rem]" : "min-h-[8rem] sm:min-h-[9.5rem]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              width={160}
              height={160}
              className={`w-full object-contain ${
                estMilieu ? "h-32 sm:h-40" : "h-28 sm:h-36"
              }`}
              onError={(evenement) => {
                const cible = evenement.currentTarget;
                if (cible.dataset.fallback === "1") {
                  cible.style.visibility = "hidden";
                  return;
                }
                cible.dataset.fallback = "1";
                cible.src = IMAGES_DEFAUT[index % IMAGES_DEFAUT.length];
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
