import { normalizeOptionGroups, resolveOptionSelection } from "@chowgo/shared/menuOptions";
import { AppError } from "./AppError.js";

export { OPTION_LIMITS, basketLineId } from "@chowgo/shared/menuOptions";

const GROUP_ERRORS = {
  OPTION_GROUPS_INVALID: "invalid",
  OPTION_GROUP_NAME: "groupName",
  OPTION_GROUP_EMPTY: "groupEmpty",
  OPTION_GROUP_RANGE: "groupRange",
  OPTION_NAME: "name",
  OPTION_PRICE: "price",
  OPTION_TOO_MANY_GROUPS: "tooManyGroups",
  OPTION_TOO_MANY_OPTIONS: "tooManyOptions",
};

const SELECTION_ERRORS = {
  OPTION_REQUIRED: "required",
  OPTION_TOO_MANY: "tooMany",
  OPTION_UNAVAILABLE: "unavailable",
  OPTION_UNKNOWN: "unknown",
};

/** Seller input to stored groups; `undefined` means "leave them as they are". */
export function parseOptionGroupsInput(input) {
  if (input === undefined) return undefined;
  const result = normalizeOptionGroups(input);
  if (!result.error) return result.groups;

  const { code, group, max } = result.error;
  throw new AppError(`errors:menuOption.${GROUP_ERRORS[code]}`, 400, "OPTION_GROUPS_INVALID", {
    group: group === undefined ? undefined : group + 1,
    max,
  });
}

/** The options a customer picked, checked and priced, or a 400. */
export function resolveSelectionOrThrow(optionGroups, selectedIds) {
  const result = resolveOptionSelection(optionGroups, selectedIds);
  if (result.ok) return result;

  throw new AppError(`errors:menuOption.${SELECTION_ERRORS[result.code]}`, 400, result.code, {
    group: result.group,
    option: result.option,
    max: result.max,
  });
}
