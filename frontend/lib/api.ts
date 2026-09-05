const URL_API =
  process.env.NEXT_PUBLIC_URL_API ??
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4000/api");

export async function appelerApi<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const enTetes = new Headers(options.headers);
  if (!enTetes.has("Content-Type") && options.body) {
    enTetes.set("Content-Type", "application/json");
  }

  const reponse = await fetch(`${URL_API}${chemin}`, {
    ...options,
    headers: enTetes,
    credentials: "include",
  });

  const donnees = await reponse.json().catch(() => ({
    succes: false,
    message: "Réponse invalide du serveur.",
  }));

  if (!reponse.ok) {
    throw new Error(donnees.message ?? "Erreur API");
  }

  return donnees as T;
}
