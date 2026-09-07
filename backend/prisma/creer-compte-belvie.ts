/**
 * Crée ou met à jour le Super Admin Belvie sans vider la base.
 * Usage: npx tsx prisma/creer-compte-belvie.ts
 */
import path from "path";
import dotenv from "dotenv";
import { PrismaClient, RoleUtilisateur } from "@prisma/client";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  const email = "belvie@gmail.com";
  const motDePasse = await bcrypt.hash("Belvie210@!!", 12);
  const existant = await prisma.utilisateur.findUnique({ where: { email } });

  if (existant) {
    await prisma.utilisateur.update({
      where: { email },
      data: {
        prenom: "Belvie",
        nom: "Admin",
        motDePasse,
        role: RoleUtilisateur.SUPER_ADMIN,
        actif: true,
        estInvite: false,
      },
    });
    console.log("Compte belvie@gmail.com mis à jour (SUPER_ADMIN).");
  } else {
    await prisma.utilisateur.create({
      data: {
        prenom: "Belvie",
        nom: "Admin",
        email,
        telephone: "+243 890 000 300",
        motDePasse,
        role: RoleUtilisateur.SUPER_ADMIN,
        actif: true,
      },
    });
    console.log("Compte belvie@gmail.com créé (SUPER_ADMIN).");
  }
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
