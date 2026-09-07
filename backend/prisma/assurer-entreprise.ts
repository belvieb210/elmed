import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.parametreEntreprise.count();
  if (!count) {
    await prisma.parametreEntreprise.create({ data: {} });
    console.log("Paramètres entreprise créés.");
  } else {
    console.log("Paramètres entreprise déjà présents:", count);
  }
}

main()
  .finally(() => prisma.$disconnect());
