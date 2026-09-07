const photosLocales: Record<string, string> = {
  "/avatars/support.jpg":
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
};

export function urlPhotoProfil(url?: string | null) {
  if (!url) return null;
  return photosLocales[url] ?? url;
}
