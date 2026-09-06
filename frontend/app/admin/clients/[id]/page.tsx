"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PageFacturationClient } from "@/composants/admin/PageFacturationClient";

export default function PageFactureClientAdmin() {
  const params = useParams<{ id: string }>();
  const recherche = useSearchParams();
  return <PageFacturationClient clientId={params.id} commandeId={recherche.get("commande")} />;
}
