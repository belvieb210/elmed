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
