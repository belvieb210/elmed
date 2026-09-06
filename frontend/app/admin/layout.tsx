import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration — MateMedical",
  description: "Espace gestionnaire MateMedical : commandes, clients et messagerie.",
};

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return children;
}
