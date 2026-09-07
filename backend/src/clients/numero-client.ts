import { baseDeDonnees } from "../config/baseDeDonnees";

export async function genererNumeroClient() {
  const maintenant = new Date();
  const prefixe = `${maintenant.getFullYear()}${String(maintenant.getMonth() + 1).padStart(2, "0")}${String(
    maintenant.getDate(),
  ).padStart(2, "0")}`;
  const total = await baseDeDonnees.utilisateur.count({
    where: { role: "CLIENT", numeroClient: { startsWith: prefixe } },
  });
  return `${prefixe}${String(total + 1).padStart(3, "0")}`;
}
