"use client";

import { useState } from "react";
import { urlPhotoProfil } from "@/lib/photo";

export function PhotoProfil({
  src,
  alt,
  initials,
  className = "h-8 w-8",
}: {
  src?: string | null;
  alt: string;
  initials: string;
  className?: string;
}) {
  const url = urlPhotoProfil(src);
  const [erreur, setErreur] = useState(false);

  return (
    <span className={`inline-flex shrink-0 overflow-hidden rounded-full bg-violet-marque ${className}`}>
      {url && !erreur ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" onError={() => setErreur(true)} />
      ) : (
        <span className="grid h-full w-full place-items-center text-[10px] font-semibold text-white">
          {initials.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
