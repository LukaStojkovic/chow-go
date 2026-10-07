import { normalizeOptionGroups } from "@chowgo/shared/menuOptions";

let nextKey = 0;
const newKey = () => `k${(nextKey += 1)}`;

export const newOption = () => ({ key: newKey(), name: "", priceDelta: "", available: true });

export const newGroup = () => ({
  key: newKey(),
  name: "",
  minSelect: "0",
  maxSelect: "1",
  options: [newOption()],
});

const ERROR_KEYS = {
  OPTION_GROUPS_INVALID: "invalid",
  OPTION_GROUP_NAME: "groupName",
  OPTION_GROUP_EMPTY: "groupEmpty",
  OPTION_GROUP_RANGE: "groupRange",
  OPTION_NAME: "name",
  OPTION_PRICE: "price",
  OPTION_TOO_MANY_GROUPS: "tooManyGroups",
  OPTION_TOO_MANY_OPTIONS: "tooManyOptions",
};

/** Editor state from a raw menu item's `optionGroups`, keeping their ids. */
export function optionGroupsToEditorState(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.map((group) => ({
    key: newKey(),
    _id: group._id ? String(group._id) : undefined,
    name: group.name || "",
    minSelect: String(group.minSelect ?? 0),
    maxSelect: String(group.maxSelect ?? 1),
    options: (group.options || []).map((option) => ({
      key: newKey(),
      _id: option._id ? String(option._id) : undefined,
      name: option.name || "",
      priceDelta: option.priceDelta ? String(option.priceDelta) : "",
      available: option.available !== false,
    })),
  }));
}

/**
 * Validate the editor state the way the backend will.
 *
 * @returns {{ groups: Array<Object> } | { error: string }} `error` is translated.
 */
export function validateOptionGroups(state, t) {
  const payload = state.map((group) => ({
    _id: group._id,
    name: group.name,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    options: group.options.map((option) => ({
      _id: option._id,
      name: option.name,
      priceDelta: option.priceDelta,
      available: option.available,
    })),
  }));
  const result = normalizeOptionGroups(payload);
  if (!result.error) return { groups: result.groups };
  const { code, group, max } = result.error;
  return {
    error: t(`errors:menuOption.${ERROR_KEYS[code] ?? "invalid"}`, {
      group: typeof group === "number" ? group + 1 : "",
      max,
      defaultValue: t("errors:menuOption.invalid"),
    }),
  };
}
