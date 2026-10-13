/**
 * RFC 4180 CSV with a UTF-8 BOM so Excel reads "Ćevapi" correctly. A text cell
 * that starts like a formula is prefixed with an apostrophe: dish names and
 * promo codes are seller- or customer-written and a spreadsheet would run them.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

const BOM = String.fromCharCode(0xfeff);

export function csvCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header, rows) {
  return `${BOM}${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function sendCsv(res, filename, body) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/[^\w.-]/g, "_")}"`);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(body);
}
