export function formatDateAgo(s) {
  const d = new Date(s),
    now = new Date();
  const h = Math.floor((now - d) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
