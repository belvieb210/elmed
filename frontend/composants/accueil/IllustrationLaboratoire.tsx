"use client";

import { useEffect, useState } from "react";
import { appelerApi } from "@/lib/api";

const IMAGES_DEFAUT = [
  "/medias/logo-microscope.png",
  "/medias/hero-accueil-produits.png",
  "/medias/logo-microscope.png",
];

export function IllustrationLaboratoire({
  images,
}: {
  images?: string[] | null;
}) {
  const [liste, setListe] = useState<string[]>(images?.length ? images : IMAGES_DEFAUT);

  useEffect(() => {
    if (images?.length) {
      setListe(images);
      return;
    }
    function charger() {
      appelerApi<{
        entreprise: { imagesAccueil?: string[] | null; imageAccueilUrl?: string | null };
      }>("/entreprise")
        .then((donnees) => {
          const multi = donnees.entreprise.imagesAccueil?.filter(Boolean) ?? [];
          if (multi.length > 0) {
            setListe(multi);
            return;
          }
          if (donnees.entreprise.imageAccueilUrl) {
            setListe([donnees.entreprise.imageAccueilUrl]);
            return;
          }
          setListe(IMAGES_DEFAUT);
        })
        .catch(() => setListe(IMAGES_DEFAUT));
    }
    charger();
    window.addEventListener("mm-entreprise-maj", charger);
    return () => window.removeEventListener("mm-entreprise-maj", charger);
  }, [images]);

  const affichees = liste.slice(0, 6);

  if (affichees.length === 1) {
    return (
      <img
        src={affichees[0]}
        alt=""
        className="h-36 w-auto max-w-[min(100%,280px)] object-contain drop-shadow-[0_12px_24px_rgba(15,23,42,0.25)] sm:h-44 md:h-48"
      />
    );
  }

  return (
    <div className="relative flex h-36 w-[min(100%,300px)] items-end justify-center sm:h-44 md:h-48">
      {affichees.map((src, index) => {
        const total = affichees.length;
        const decalage = (index - (total - 1) / 2) * 28;
        const rotation = (index - (total - 1) / 2) * 4;
        const z = 10 + index;
        return (
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            style={{
              transform: `translateX(${decalage}px) rotate(${rotation}deg)`,
              zIndex: z,
            }}
            className="absolute bottom-0 h-[78%] w-auto max-w-[42%] object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.28)]"
          />
        );
      })}
    </div>
  );
}
