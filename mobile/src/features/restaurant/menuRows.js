export function buildMenuRows(sections) {
  const rows = [];
  for (const section of sections) {
    rows.push({ type: "header", id: `h:${section.key}`, sectionKey: section.key, title: section.title, count: section.data.length });
    for (const dish of section.data) rows.push({ type: "dish", id: `d:${section.key}:${dish.id}`, sectionKey: section.key, dish });
  }
  return rows;
}

export function headerIndexOf(rows, key) {
  return rows.findIndex((row) => row.type === "header" && row.sectionKey === key);
}

export function activeSectionAt(headers, line) {
  let active = headers[0]?.key ?? null;
  for (const header of headers) {
    if (header.y == null) continue;
    if (header.y <= line + 1) active = header.key;
    else break;
  }
  return active;
}
