/**
 * Dish options: sizes, extras, "no onions". A dish carries option groups, each
 * with a pick range; a basket line carries the options the customer chose.
 *
 * The backend validates and prices with these functions, and the clients use
 * them for the live total and the Add button, so the two cannot disagree about
 * what a selection costs or whether it is complete.
 */
import { t } from "./i18n/index.js";
import { sumMoney, toMoney } from "./money.js";

export const OPTION_LIMITS = {
  groups: 10,
  optionsPerGroup: 20,
  nameLength: 60,
  maxPriceDelta: 100000,
};

const idOf = (value) => (value?._id ?? value?.id ?? value) != null ? String(value?._id ?? value?.id ?? value) : "";

const toInt = (value, fallback) => {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Number.isInteger(n) ? n : fallback;
};

const fail = (code, details = {}) => ({ error: { code, ...details } });

/**
 * Clean seller input. Accepts an array or the JSON string a multipart form
 * sends. Ids are kept when given, so baskets holding an option keep matching
 * it after the dish is edited.
 *
 * @param {unknown} input
 * @returns {{ groups: Array<Object> } | { error: { code: string, group?: number, option?: number } }}
 */
export function normalizeOptionGroups(input) {
  if (input === undefined || input === null || input === "") return { groups: [] };

  let raw = input;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return fail("OPTION_GROUPS_INVALID");
    }
  }
  if (!Array.isArray(raw)) return fail("OPTION_GROUPS_INVALID");
  if (raw.length > OPTION_LIMITS.groups) return fail("OPTION_TOO_MANY_GROUPS", { max: OPTION_LIMITS.groups });

  const groups = [];
  for (const [g, group] of raw.entries()) {
    if (!group || typeof group !== "object") return fail("OPTION_GROUPS_INVALID", { group: g });

    const name = String(group.name ?? "").trim();
    if (!name || name.length > OPTION_LIMITS.nameLength) return fail("OPTION_GROUP_NAME", { group: g });

    const rawOptions = Array.isArray(group.options) ? group.options : [];
    if (rawOptions.length === 0) return fail("OPTION_GROUP_EMPTY", { group: g });
    if (rawOptions.length > OPTION_LIMITS.optionsPerGroup) {
      return fail("OPTION_TOO_MANY_OPTIONS", { group: g, max: OPTION_LIMITS.optionsPerGroup });
    }

    const options = [];
    for (const [o, option] of rawOptions.entries()) {
      const optionName = String(option?.name ?? "").trim();
      if (!optionName || optionName.length > OPTION_LIMITS.nameLength) {
        return fail("OPTION_NAME", { group: g, option: o });
      }
      const delta = option?.priceDelta === undefined || option?.priceDelta === "" ? 0 : Number(option.priceDelta);
      if (!Number.isFinite(delta) || delta < 0 || delta > OPTION_LIMITS.maxPriceDelta) {
        return fail("OPTION_PRICE", { group: g, option: o });
      }
      const id = idOf(option?._id ?? option?.id ?? null);
      options.push({
        ...(id ? { _id: id } : {}),
        name: optionName,
        priceDelta: toMoney(delta),
        available: option?.available !== false && option?.available !== "false",
      });
    }

    const minSelect = toInt(group.minSelect, 0);
    const maxSelect = toInt(group.maxSelect, 1);
    if (minSelect < 0 || maxSelect < 1 || minSelect > maxSelect || maxSelect > options.length) {
      return fail("OPTION_GROUP_RANGE", { group: g });
    }

    const id = idOf(group._id ?? group.id ?? null);
    groups.push({ ...(id ? { _id: id } : {}), name, minSelect, maxSelect, options });
  }

  return { groups };
}

/** True when the dish needs a choice before it can go in the basket. */
export function hasRequiredOptions(groups) {
  return Array.isArray(groups) && groups.some((group) => Number(group?.minSelect) > 0);
}

/**
 * Check a customer's picks against a dish's groups and price them.
 *
 * @param {Array<Object>} groups The dish's option groups.
 * @param {unknown} selectedIds Option ids the customer picked.
 * @returns {{ ok: true, selections: Array<{ groupId: string, groupName: string, optionId: string, name: string, priceDelta: number }>, priceDelta: number }
 *   | { ok: false, code: string, group?: string, option?: string, max?: number, min?: number }}
 */
export function resolveOptionSelection(groups, selectedIds) {
  const list = Array.isArray(groups) ? groups : [];
  const picked = new Set((Array.isArray(selectedIds) ? selectedIds : []).map(String));

  const known = new Set();
  const selections = [];

  for (const group of list) {
    const groupId = idOf(group);
    let count = 0;
    for (const option of group.options ?? []) {
      const optionId = idOf(option);
      known.add(optionId);
      if (!picked.has(optionId)) continue;
      if (option.available === false) return { ok: false, code: "OPTION_UNAVAILABLE", group: group.name, option: option.name };
      count += 1;
      selections.push({
        groupId,
        groupName: group.name,
        optionId,
        name: option.name,
        priceDelta: toMoney(Number(option.priceDelta) || 0),
      });
    }
    const min = Number(group.minSelect) || 0;
    const max = Number(group.maxSelect) || 1;
    if (count < min) return { ok: false, code: "OPTION_REQUIRED", group: group.name, min };
    if (count > max) return { ok: false, code: "OPTION_TOO_MANY", group: group.name, max };
  }

  for (const id of picked) {
    if (!known.has(id)) return { ok: false, code: "OPTION_UNKNOWN" };
  }

  return { ok: true, selections, priceDelta: sumMoney(...selections.map((s) => s.priceDelta)) };
}

/**
 * The id of a basket line. A dish without options keeps its own id, so baskets
 * and clients from before options existed work unchanged.
 *
 * @param {string} menuItemId
 * @param {string[]} [optionIds]
 */
export function basketLineId(menuItemId, optionIds = []) {
  const ids = [...new Set((optionIds ?? []).map(String))].sort();
  return ids.length ? `${menuItemId}~${ids.join("-")}` : String(menuItemId);
}

/** "Large, Extra cheese" for a basket or order line. */
export function optionsSummary(options) {
  return (Array.isArray(options) ? options : [])
    .map((option) => option?.name)
    .filter(Boolean)
    .join(", ");
}

/**
 * How many to pick, in words: "Choose 1", "Choose 2-3", "Optional, up to 3".
 *
 * @param {{ minSelect?: number, maxSelect?: number }} group
 */
export function optionRuleLabel(group) {
  const min = Number(group?.minSelect) || 0;
  const max = Number(group?.maxSelect) || 1;
  if (min === 0) return t("restaurant:options.rule.optional", { count: max });
  if (min === max) return t("restaurant:options.rule.exactly", { count: min });
  return t("restaurant:options.rule.range", { min, max });
}
