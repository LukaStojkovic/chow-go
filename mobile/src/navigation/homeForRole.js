// Seller and courier shells arrive in later phases; both fall back to the
// customer stack for now rather than routing into a group that does not exist.
export function homeForRole(role) {
  if (role === "seller" || role === "courier") return "/dev";
  return "/(customer)";
}
