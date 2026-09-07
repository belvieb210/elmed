-- Role Admin manquant en production (présent dans Prisma, absent de l’enum PostgreSQL)
ALTER TYPE "RoleUtilisateur" ADD VALUE IF NOT EXISTS 'ADMIN';

-- Paramètres entreprise (logo, nom commercial, RCCM…) utilisés par /entreprise
CREATE TABLE IF NOT EXISTS "parametres_entreprise" (
    "id" TEXT NOT NULL,
    "nom_commercial" TEXT NOT NULL DEFAULT 'MateMedical',
    "raison_sociale" TEXT NOT NULL DEFAULT 'ELMED',
    "activite_1" TEXT NOT NULL DEFAULT 'Vente des Matériels Médicaux',
    "activite_2" TEXT NOT NULL DEFAULT 'Réactifs de Labo & Produits chimiques',
    "rccm" TEXT NOT NULL DEFAULT 'CD/KNG/RCCM/25-A-00642',
    "id_national" TEXT NOT NULL DEFAULT '01-Q8601 -N60892Q',
    "adresse" TEXT NOT NULL DEFAULT 'Av. du commerce N°35 Kinshasa-Gombe',
    "telephone" TEXT NOT NULL DEFAULT '0913553866 - 0813553866',
    "ville" TEXT NOT NULL DEFAULT 'Kin',
    "email_contact" TEXT,
    "site_web" TEXT,
    "message_pied" TEXT NOT NULL DEFAULT 'Merci de nous avoir choisi',
    "logo_url" TEXT,
    "date_maj" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parametres_entreprise_pkey" PRIMARY KEY ("id")
);
