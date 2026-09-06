export function homeForRole(role) {
  if (role === "seller") return "/(seller)";
  if (role === "courier") return "/(courier)";
  return "/(customer)";
}
