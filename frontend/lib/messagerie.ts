export type PieceJointeBrouillon = {
  id: string;
  nom: string;
  taille: number;
  typeMime: string;
  dataUrl: string;
};

const MAX_FICHIERS = 10;
const MAX_TAILLE = 10 * 1024 * 1024;

export async function lirePiecesJointes(liste: FileList | File[]): Promise<PieceJointeBrouillon[]> {
  const fichiers = Array.from(liste).slice(0, MAX_FICHIERS);
  const pieces: PieceJointeBrouillon[] = [];
  for (const fichier of fichiers) {
    if (fichier.size > MAX_TAILLE) {
      throw new Error(`${fichier.name} dépasse 10 Mo.`);
    }
    const dataUrl = await new Promise<string>((resoudre, rejeter) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resoudre(typeof lecteur.result === "string" ? lecteur.result : "");
      lecteur.onerror = () => rejeter(new Error("Lecture du fichier impossible."));
      lecteur.readAsDataURL(fichier);
    });
    pieces.push({
      id: `${fichier.name}-${fichier.size}-${fichier.lastModified}`,
      nom: fichier.name,
      taille: fichier.size,
      typeMime: fichier.type || "application/octet-stream",
      dataUrl,
    });
  }
  return pieces;
}

export function estImage(type: string) {
  return type.startsWith("image/") || type === "IMAGE";
}

export function ficheDepuisContenu(contenu?: string | null) {
  if (!contenu?.trim().startsWith("{")) return null;
  try {
    const fiche = JSON.parse(contenu) as { produitId?: string; nom?: string; prix?: number; image?: string | null; sku?: string };
    if (!fiche.nom) return null;
    return {
      produitId: fiche.produitId ?? "",
      nom: fiche.nom,
      prix: Number(fiche.prix ?? 0),
      image: fiche.image ?? null,
      sku: fiche.sku ?? "",
    };
  } catch {
    return null;
  }
}

export function resumeMessage(message: {
  contenu?: string | null;
  fichierNom?: string | null;
  typeMessage?: string;
  ficheProduit?: { nom: string; prix: number; image?: string | null; sku?: string } | null;
}) {
  const fiche = message.ficheProduit ?? ficheDepuisContenu(message.contenu);
  if (fiche) return fiche.nom;
  if (message.fichierNom) return message.fichierNom;
  const texte = (message.contenu ?? "").trim();
  if (!texte || texte.startsWith("{")) return "Message";
  return texte.length > 80 ? `${texte.slice(0, 79)}…` : texte;
}

export function apercuReponse(message: {
  id: string;
  contenu?: string | null;
  fichierNom?: string | null;
  nomAuteur: string;
  ficheProduit?: { produitId: string; nom: string; prix: number; image: string | null; sku: string } | null;
}) {
  const fiche = message.ficheProduit ?? ficheDepuisContenu(message.contenu);
  return {
    id: message.id,
    contenu: resumeMessage(message),
    nomAuteur: message.nomAuteur,
    ficheProduit: fiche ?? undefined,
    fichierNom: message.fichierNom ?? undefined,
  };
}
