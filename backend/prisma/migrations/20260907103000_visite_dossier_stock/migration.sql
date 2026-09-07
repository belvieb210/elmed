-- AlterEnum
CREATE TYPE "OrigineCommande" AS ENUM ('SUR_SITE', 'EN_LIGNE');

-- AlterTable
ALTER TABLE "commandes" ADD COLUMN "numero_visite" TEXT;
ALTER TABLE "commandes" ADD COLUMN "numero_dossier" TEXT;
ALTER TABLE "commandes" ADD COLUMN "origine" "OrigineCommande" NOT NULL DEFAULT 'EN_LIGNE';
ALTER TABLE "commandes" ADD COLUMN "stock_debite" BOOLEAN NOT NULL DEFAULT false;

UPDATE "commandes"
SET
  "origine" = CASE WHEN "numero_recu" IS NOT NULL THEN 'SUR_SITE'::"OrigineCommande" ELSE 'EN_LIGNE'::"OrigineCommande" END,
  "numero_visite" = REPLACE("numero_commande", 'CMD-', 'VIS-'),
  "numero_dossier" = REPLACE("numero_commande", 'CMD-', 'DOS-');

CREATE UNIQUE INDEX "commandes_numero_visite_key" ON "commandes"("numero_visite");
CREATE UNIQUE INDEX "commandes_numero_dossier_key" ON "commandes"("numero_dossier");
