ALTER TABLE "utilisateurs" ADD COLUMN "numero_client" TEXT;
ALTER TABLE "utilisateurs" ADD COLUMN "fiche_client" JSONB;
CREATE UNIQUE INDEX "utilisateurs_numero_client_key" ON "utilisateurs"("numero_client");
