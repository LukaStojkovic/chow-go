export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A case-insensitive "contains" match for user-typed search text, or null when
// there is nothing to search for. Raw input in $regex let "(a+)+$" pin the
// database's CPU, and a repeated ?search= arrived as an array and threw.
export function containsRegex(value, maxLength = 64) {
  if (typeof value !== "string") return null;
  const term = value.trim().slice(0, maxLength);
  return term ? new RegExp(escapeRegex(term), "i") : null;
}
