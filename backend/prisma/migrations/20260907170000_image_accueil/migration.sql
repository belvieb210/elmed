-- Image d’accueil (hero client) configurable depuis /admin/parametres
ALTER TABLE "parametres_entreprise" ADD COLUMN IF NOT EXISTS "image_accueil_url" TEXT;
