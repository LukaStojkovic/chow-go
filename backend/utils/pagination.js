// Mongo treats limit(0) as "no limit" and a negative skip as an error, so an
// unclamped ?limit=0 returns the whole collection and ?page=0 is a 500.
export function parsePagination(query = {}, { defaultLimit = 20, max = 50 } = {}) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, max) : defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}
