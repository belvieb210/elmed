"use client";

import { io, type Socket } from "socket.io-client";
import { URL_API } from "@/lib/api";
import type { TypeEvenementTempsReel } from "@/lib/temps-reel";

function origineSocket() {
  if (URL_API.startsWith("http")) {
    return URL_API.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

let socket: Socket | null = null;

export function obtenirSocket(): Socket {
  if (!socket) {
    socket = io(origineSocket(), {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 20,
    });
  }
  return socket;
}

export function connecterSocketTempsReel(
  surEvenement: (type: TypeEvenementTempsReel, extra?: Record<string, unknown>) => void,
) {
  const flux = obtenirSocket();
  const types: TypeEvenementTempsReel[] = ["panier", "message", "notification", "commande", "client"];

  for (const type of types) {
    flux.off(type);
    flux.on(type, (donnees?: Record<string, unknown>) => surEvenement(type, donnees));
  }

  if (!flux.connected) flux.connect();

  return () => {
    for (const type of types) flux.off(type);
    flux.disconnect();
  };
}
