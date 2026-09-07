-- Plusieurs images pour le bandeau d’accueil client
ALTER TABLE "parametres_entreprise" ADD COLUMN IF NOT EXISTS "images_accueil" JSONB;
