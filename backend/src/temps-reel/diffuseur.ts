import type { Server as ServeurHttp } from "node:http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { baseDeDonnees } from "../config/baseDeDonnees";
import { environnement } from "../config/environnement";

export type TypeEvenementTempsReel = "panier" | "message" | "notification" | "commande" | "client";

const MAX_SOCKETS_PAR_UTILISATEUR = 5;
const socketsParUtilisateur = new Map<string, number>();

let io: Server | null = null;

function extraireCookie(enTete: string | undefined, nom: string) {
  if (!enTete) return undefined;
  for (const partie of enTete.split(";")) {
    const [cle, ...reste] = partie.trim().split("=");
    if (cle === nom) return decodeURIComponent(reste.join("="));
  }
  return undefined;
}

async function authentifierSocket(socket: Socket, suivant: (erreur?: Error) => void) {
  try {
    const jeton = extraireCookie(socket.handshake.headers.cookie, "mm_jeton");
    if (!jeton) {
      suivant(new Error("Authentification requise."));
      return;
    }

    const charge = jwt.verify(jeton, environnement.jwtSecret) as {
      utilisateurId: string;
    };
    const utilisateur = await baseDeDonnees.utilisateur.findUnique({
      where: { id: charge.utilisateurId },
      select: { id: true, actif: true, role: true },
    });

    if (!utilisateur?.actif) {
      suivant(new Error("Compte introuvable ou inactif."));
      return;
    }

    const actuel = socketsParUtilisateur.get(utilisateur.id) ?? 0;
    if (actuel >= MAX_SOCKETS_PAR_UTILISATEUR) {
      suivant(new Error("Trop de connexions simultanées."));
      return;
    }

    socket.data.utilisateurId = utilisateur.id;
    socket.data.role = utilisateur.role;
    suivant();
  } catch {
    suivant(new Error("Jeton invalide ou expiré."));
  }
}

export function attacherSocketIo(serveurHttp: ServeurHttp) {
  io = new Server(serveurHttp, {
    path: "/socket.io",
    cors: {
      origin: environnement.urlFrontend,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: false,
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e5,
  });

  io.use(authentifierSocket);

  io.on("connection", (socket) => {
    const utilisateurId = socket.data.utilisateurId as string;
    socketsParUtilisateur.set(utilisateurId, (socketsParUtilisateur.get(utilisateurId) ?? 0) + 1);
    socket.join(`utilisateur:${utilisateurId}`);
    if (socket.data.role && socket.data.role !== "CLIENT") {
      socket.join("equipe");
    }

    socket.on("join", () => {
      /* un client ne choisit pas sa salle */
    });

    socket.on("disconnect", () => {
      const reste = (socketsParUtilisateur.get(utilisateurId) ?? 1) - 1;
      if (reste <= 0) socketsParUtilisateur.delete(utilisateurId);
      else socketsParUtilisateur.set(utilisateurId, reste);
    });
  });

  return io;
}

export function emettreTempsReel(
  utilisateurId: string | null | undefined,
  type: TypeEvenementTempsReel,
  extra: Record<string, unknown> = {},
) {
  if (!utilisateurId || !io) return;
  io.to(`utilisateur:${utilisateurId}`).emit(type, {
    type,
    ...extra,
    date: new Date().toISOString(),
  });
}

export function emettreTempsReelPlusieurs(
  ids: Array<string | null | undefined>,
  type: TypeEvenementTempsReel,
  extra: Record<string, unknown> = {},
) {
  const uniques = new Set(ids.filter((id): id is string => Boolean(id)));
  for (const id of uniques) {
    emettreTempsReel(id, type, extra);
  }
}

export function emettreTempsReelEquipe(
  type: TypeEvenementTempsReel,
  extra: Record<string, unknown> = {},
) {
  if (!io) return;
  io.to("equipe").emit(type, {
    type,
    ...extra,
    date: new Date().toISOString(),
  });
}
