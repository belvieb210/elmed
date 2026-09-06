-- Les montants étaient saisis en francs congolais.
-- Conversion vers USD au taux 2 800 FC = 1 $, uniquement si le catalogue est encore en FC.
DO $$
BEGIN
  IF (SELECT COALESCE(MAX(prix), 0) FROM produits) > 1000 THEN
    UPDATE produits
    SET prix = ROUND(prix / 2800.0, 2);

    UPDATE lignes_commande
    SET prix_unitaire = ROUND(prix_unitaire / 2800.0, 2);

    UPDATE commandes
    SET montant_total = ROUND(montant_total / 2800.0, 2);

    UPDATE paiements
    SET montant = ROUND(montant / 2800.0, 2);
  END IF;
END $$;
