import type { Metadata, Viewport } from "next";
import { FournisseurClient } from "@/store/contexteClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "MateMedical",
  description: "Catalogue, commande et paiement de produits médicaux. Compte facultatif pour le suivi et la messagerie.",
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
