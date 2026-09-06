export function estPersonnel(role?: string | null) {
  return Boolean(role && role !== "CLIENT");
}
