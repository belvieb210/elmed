import type { Metadata, Viewport } from "next";
import { FournisseurClient } from "@/store/contexteClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "MateMedical — Espace client",
  description: "Plateforme professionnelle de vente et gestion de produits médicaux.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <FournisseurClient>{children}</FournisseurClient>
      </body>
    </html>
  );
}
