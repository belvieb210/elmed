import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte — MateMedical",
  description: "Créez un compte pour suivre vos commandes et échanger avec l’équipe MateMedical.",
};

export default function LayoutInscription({ children }: { children: ReactNode }) {
  return children;
}
