import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion — MateMedical",
  description: "Accédez à vos commandes, factures et à la messagerie MateMedical.",
};

export default function LayoutConnexion({ children }: { children: ReactNode }) {
  return children;
}
