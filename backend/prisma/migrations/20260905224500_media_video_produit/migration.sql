-- CreateEnum
CREATE TYPE "TypeMediaProduit" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "images_produit" ADD COLUMN "url_couverture" TEXT;
ALTER TABLE "images_produit" ADD COLUMN "type_media" "TypeMediaProduit" NOT NULL DEFAULT 'IMAGE';
