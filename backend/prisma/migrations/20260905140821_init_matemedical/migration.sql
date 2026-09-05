-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('CLIENT', 'SUPER_ADMIN', 'DIRECTEUR', 'COMMERCIAL', 'COMPTABLE', 'MAGASINIER', 'SUPPORT', 'LIVREUR');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('BROUILLON', 'ENVOYEE', 'EN_ATTENTE', 'VALIDEE', 'REFUSEE', 'ANNULEE', 'EN_PREPARATION', 'PRET_RETRAIT', 'EXPEDIEE', 'EN_ROUTE', 'LIVREE', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'PARTIEL', 'PAYE', 'ECHEC', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('MOBILE_MONEY_MPESA', 'MOBILE_MONEY_AIRTEL', 'MOBILE_MONEY_ORANGE', 'MOBILE_MONEY_AFRIMONEY', 'CARTE_BANCAIRE', 'VIREMENT', 'PAIEMENT_RETRAIT', 'PAIEMENT_LIVRAISON');

-- CreateEnum
CREATE TYPE "TypeMessage" AS ENUM ('TEXTE', 'IMAGE', 'PDF', 'AUDIO', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('COMMANDE', 'MESSAGE', 'FACTURE', 'STOCK', 'SYSTEME');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('PROFORMA', 'FACTURE', 'BON_LIVRAISON', 'BON_CAISSE', 'AUTRE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "mot_de_passe" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'CLIENT',
    "photo_profil" TEXT,
    "nom_societe" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_maj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix" DECIMAL(12,2) NOT NULL,
    "image" TEXT,
    "populaire" BOOLEAN NOT NULL DEFAULT false,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "quantite_stock" INTEGER NOT NULL DEFAULT 0,
    "code_qr" TEXT,
    "categorie_id" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots_produits" (
    "id" TEXT NOT NULL,
    "produit_id" TEXT NOT NULL,
    "numero_lot" TEXT NOT NULL,
    "fabricant" TEXT,
    "date_fabrication" TIMESTAMP(3),
    "date_expiration" TIMESTAMP(3) NOT NULL,
    "quantite" INTEGER NOT NULL,

    CONSTRAINT "lots_produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrepots" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "telephone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "heures" TEXT,

    CONSTRAINT "entrepots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "entrepot_id" TEXT NOT NULL,
    "produit_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "reserve" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" TEXT NOT NULL,
    "numero_commande" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "montant_total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "date_commande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_maj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_commande" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "produit_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "lignes_commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_panier" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "produit_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "lignes_panier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "mode_paiement" "ModePaiement" NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "reference" TEXT,
    "date_paiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT,
    "type_document" "TypeDocument" NOT NULL,
    "numero_document" TEXT NOT NULL,
    "url_pdf" TEXT,
    "code_qr" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "commande_id" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_maj" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "type_message" "TypeMessage" NOT NULL DEFAULT 'TEXTE',
    "fichier_url" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "epingle" BOOLEAN NOT NULL DEFAULT false,
    "date_envoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "type_notif" "TypeNotification" NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "lien" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journaux_audit" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "action" TEXT NOT NULL,
    "table_cible" TEXT NOT NULL,
    "details" TEXT,
    "adresse_ip" TEXT,
    "date_action" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journaux_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "produits_sku_key" ON "produits"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_entrepot_id_produit_id_key" ON "stocks"("entrepot_id", "produit_id");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_numero_commande_key" ON "commandes"("numero_commande");

-- CreateIndex
CREATE UNIQUE INDEX "lignes_panier_client_id_produit_id_key" ON "lignes_panier"("client_id", "produit_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_numero_document_key" ON "documents"("numero_document");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_commande_id_key" ON "conversations"("commande_id");

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots_produits" ADD CONSTRAINT "lots_produits_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_entrepot_id_fkey" FOREIGN KEY ("entrepot_id") REFERENCES "entrepots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande" ADD CONSTRAINT "lignes_commande_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_panier" ADD CONSTRAINT "lignes_panier_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_panier" ADD CONSTRAINT "lignes_panier_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journaux_audit" ADD CONSTRAINT "journaux_audit_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
