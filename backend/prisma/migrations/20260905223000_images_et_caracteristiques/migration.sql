-- CreateTable
CREATE TABLE "images_produit" (
    "id" TEXT NOT NULL,
    "produit_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "images_produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caracteristiques_produit" (
    "id" TEXT NOT NULL,
    "produit_id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "caracteristiques_produit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "images_produit" ADD CONSTRAINT "images_produit_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caracteristiques_produit" ADD CONSTRAINT "caracteristiques_produit_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
