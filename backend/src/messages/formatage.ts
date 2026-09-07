import { TypeMessage } from "@prisma/client";
import { emettreTempsReelPlusieurs } from "../temps-reel/diffuseur";
import { baseDeDonnees } from "../config/baseDeDonnees";

export type FicheProduitMessage = {
  produitId: string;
  nom: string;
  prix: number;
  image: string | null;
  sku: string;
};

const libellesRole: Record<string, string> = {
  SUPER_ADMIN: "Direction",
  DIRECTEUR: "Directeur",
  COMMERCIAL: "Commercial",
  COMPTABLE: "Comptable",
  MAGASINIER: "Magasinier",
  SUPPORT: "Support",
  LIVREUR: "Livreur",
  CLIENT: "Client",
};

export function libelleRolePersonnel(role: string) {
  return libellesRole[role] ?? role;
}

const photosLocales: Record<string, string> = {
  "/avatars/support.jpg":
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
};

export function resoudrePhotoProfil(url?: string | null) {
  if (!url) return null;
  return photosLocales[url] ?? url;
}

export function extraireFicheProduit(contenu: string, typeMessage: TypeMessage): FicheProduitMessage | undefined {
  if (typeMessage !== TypeMessage.PRODUIT) return undefined;
  try {
    const fiche = JSON.parse(contenu) as FicheProduitMessage;
    if (!fiche?.produitId || !fiche.nom) return undefined;
    return fiche;
  } catch {
    return undefined;
  }
}

export function typeDepuisMime(typeMime: string): TypeMessage {
  if (typeMime.startsWith("image/")) return TypeMessage.IMAGE;
  if (typeMime === "application/pdf") return TypeMessage.PDF;
  if (typeMime.startsWith("audio/")) return TypeMessage.AUDIO;
  if (typeMime.startsWith("video/")) return TypeMessage.VIDEO;
  return TypeMessage.DOCUMENT;
}

export function formaterMessageChat(
  message: {
    id: string;
    contenu: string;
    typeMessage: TypeMessage;
    fichierUrl: string | null;
    fichierNom?: string | null;
    fichierTaille?: number | null;
    lu: boolean;
    epingle: boolean;
    supprime: boolean;
    reponseAId?: string | null;
    dateEnvoi: Date;
    dateModification?: Date | null;
    auteurId: string;
    auteur: { prenom: string; nom: string; role: string; photoProfil?: string | null; estInvite?: boolean };
    reponseA?: {
      id: string;
      contenu: string;
      typeMessage: TypeMessage;
      auteur: { prenom: string; nom: string };
    } | null;
  },
  utilisateurId: string,
  options?: { staffEstMoi?: boolean },
) {
  const estMoi = options?.staffEstMoi
    ? message.auteur.role !== "CLIENT"
    : message.auteurId === utilisateurId;
  return {
    id: message.id,
    contenu: message.supprime ? "" : message.contenu,
    typeMessage: message.supprime ? "TEXTE" : message.typeMessage,
    fichierUrl: message.supprime ? null : message.fichierUrl,
    fichierNom: message.supprime ? null : message.fichierNom,
    fichierTaille: message.supprime ? null : message.fichierTaille,
    lu: message.lu,
    epingle: message.epingle,
    supprime: message.supprime,
    reponseAId: message.reponseAId ?? null,
    reponseA: message.reponseA
      ? {
          id: message.reponseA.id,
          contenu:
            message.reponseA.typeMessage === "PRODUIT" ? "Fiche produit" : message.reponseA.contenu.slice(0, 120),
          nomAuteur: `${message.reponseA.auteur.prenom} ${message.reponseA.auteur.nom}`.trim(),
        }
      : null,
    dateEnvoi: message.dateEnvoi,
    dateModification: message.dateModification ?? null,
    estMoi,
    nomAuteur: `${message.auteur.prenom} ${message.auteur.nom}`.trim(),
    roleAuteur: libelleRolePersonnel(message.auteur.role),
    initialsAuteur: `${message.auteur.prenom.charAt(0)}${message.auteur.nom.charAt(0)}`.toUpperCase(),
    photoProfilAuteur:
      message.auteur.role === "CLIENT" && message.auteur.estInvite
        ? null
        : resoudrePhotoProfil(message.auteur.photoProfil),
    ficheProduit: message.supprime ? undefined : extraireFicheProduit(message.contenu, message.typeMessage),
  };
}

export function extraireFichiersConversation(
  messages: Array<{
    id: string;
    typeMessage: TypeMessage;
    fichierUrl: string | null;
    fichierNom: string | null;
    fichierTaille: number | null;
    epingle: boolean;
    supprime: boolean;
    dateEnvoi: Date;
  }>,
) {
  return messages
    .filter(
      (message) =>
        !message.supprime &&
        message.fichierUrl &&
        ["IMAGE", "PDF", "DOCUMENT", "AUDIO", "VIDEO"].includes(message.typeMessage),
    )
    .map((message) => ({
      id: message.id,
      url: message.fichierUrl,
      nom: message.fichierNom || (message.typeMessage === "IMAGE" ? "Image" : "Fichier"),
      taille: message.fichierTaille ?? 0,
      typeMessage: message.typeMessage,
      epingle: message.epingle,
      dateEnvoi: message.dateEnvoi,
    }))
    .reverse();
}

export async function notifierConversation(conversationId: string, clientId: string) {
  const equipe = await baseDeDonnees.utilisateur.findMany({
    where: { role: { not: "CLIENT" } },
    select: { id: true },
  });
  emettreTempsReelPlusieurs([clientId, ...equipe.map((membre) => membre.id)], "message", {
    conversationId,
    clientId,
  });
}
