"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PageFacturationClient } from "@/composants/admin/PageFacturationClient";

export default function PageFactureClientAdmin() {
  const params = useParams<{ id: string }>();
  const recherche = useSearchParams();
  const commandeId = recherche.get("commande");
  return (
    <PageFacturationClient
      key={`${params.id}-${commandeId ?? "nouvelle"}`}
      clientId={params.id}
      commandeId={commandeId}
    />
  );
}
