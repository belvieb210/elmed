ALTER TABLE "messages" ADD COLUMN "fichier_nom" TEXT;
ALTER TABLE "messages" ADD COLUMN "fichier_taille" INTEGER;
ALTER TABLE "messages" ADD COLUMN "supprime" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN "reponse_a_id" TEXT;
ALTER TABLE "messages" ADD COLUMN "date_modification" TIMESTAMP(3);

ALTER TABLE "messages" ADD CONSTRAINT "messages_reponse_a_id_fkey" FOREIGN KEY ("reponse_a_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
