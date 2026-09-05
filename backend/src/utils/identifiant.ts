export function identifiantRoute(valeur: string | string[] | undefined) {
  if (Array.isArray(valeur)) {
    return valeur[0] ?? "";
  }
  return valeur ?? "";
}
