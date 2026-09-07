"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { appelerApi } from "@/lib/api";

/** Secours unique (composition produits sur fond transparent / bleu). */
const IMAGE_SECOURS = "/medias/hero-accueil-produits.png";

function normaliserListe(images?: string[] | null, unique?: string | null) {
  const multi = (images ?? []).filter((item) => typeof item === "string" && item.trim().length > 0);
  if (multi.length > 0) return multi.slice(0, 6);
  if (unique?.trim()) return [unique.trim()];
  return [IMAGE_SECOURS];
}

/** Positions en éventail, comme la maquette (produits posés sur le bleu). */
function styleProduit(index: number, total: number): CSSProperties {
  if (total === 1) {
    return {
      position: "relative",
      width: "100%",
      maxWidth: 340,
      height: "100%",
      objectFit: "contain",
    };
  }

  const milieu = (total - 1) / 2;
  const decalage = index - milieu;
  const translateX = decalage * (total <= 3 ? 18 : 14);
  const rotate = decalage * (total <= 3 ? 5 : 3.5);
  const scale = index === Math.round(milieu) ? 1.08 : 0.92 - Math.abs(decalage) * 0.02;

  return {
    position: "absolute",
    bottom: `${4 + Math.abs(decalage) * 2}%`,
    left: "50%",
    height: `${72 + (index === Math.round(milieu) ? 14 : 0)}%`,
    width: "auto",
    maxWidth: `${42 - Math.abs(decalage) * 2}%`,
    objectFit: "contain",
    transform: `translateX(calc(-50% + ${translateX}%)) rotate(${rotate}deg) scale(${scale})`,
    zIndex: 10 + index,
  };
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
          if (!ignore) setListe([IMAGE_SECOURS]);
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
  const uneSeule = affichees.length === 1;

  return (
    <div
      className={`relative flex w-full max-w-[380px] items-end justify-center md:max-w-[420px] ${
        uneSeule ? "min-h-[9.5rem] sm:min-h-[11.5rem]" : "h-40 sm:h-48"
      }`}
      aria-hidden
    >
      {affichees.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${index}-${src.slice(0, 48)}`}
          src={src}
          alt=""
          style={styleProduit(index, affichees.length)}
          className="pointer-events-none select-none drop-shadow-[0_14px_24px_rgba(15,23,42,0.28)]"
          onError={(evenement) => {
            const cible = evenement.currentTarget;
            if (cible.dataset.fallback === "1") {
              cible.style.visibility = "hidden";
              return;
            }
            cible.dataset.fallback = "1";
            cible.src = IMAGE_SECOURS;
          }}
        />
      ))}
    </div>
  );
}
