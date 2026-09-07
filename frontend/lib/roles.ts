export function estPersonnel(role?: string | null) {
  return Boolean(role && role !== "CLIENT");
}

export function estSuperAdmin(role?: string | null) {
  return role === "SUPER_ADMIN";
}
