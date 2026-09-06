export function homeForRole(role) {
  if (role === "seller") return "/(seller)";
  // The courier shell arrives after the seller one.
  if (role === "courier") return "/dev";
  return "/(customer)";
}
