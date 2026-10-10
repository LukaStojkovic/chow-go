import { t } from "@chowgo/shared/i18n";
import { toOptionDrafts, validateOptionDrafts } from "./OptionGroupsEditor";

const saved = [
  {
    _id: "g1",
    name: "Size",
    minSelect: 1,
    maxSelect: 1,
    options: [
      { _id: "o1", name: "Small", priceDelta: 0, available: true },
      { _id: "o2", name: "Large", priceDelta: 2.5, available: false },
    ],
  },
];

describe("option drafts", () => {
  it("round-trips saved groups with their ids", () => {
    expect(validateOptionDrafts(toOptionDrafts(saved), t)).toEqual({
      groups: [
        {
          _id: "g1",
          name: "Size",
          minSelect: 1,
          maxSelect: 1,
          options: [
            { _id: "o1", name: "Small", priceDelta: 0, available: true },
            { _id: "o2", name: "Large", priceDelta: 2.5, available: false },
          ],
        },
      ],
    });
  });

  it("reports the failing group, counted from one", () => {
    const drafts = toOptionDrafts([...saved, { name: "", options: [{ name: "Cheese" }] }]);
    expect(validateOptionDrafts(drafts, t)).toEqual({
      error: { group: 1, message: t("errors:menuOption.groupName", { group: 2 }) },
    });
  });

  it("says which numbers clash when \"pick at least\" is above \"pick at most\"", () => {
    const drafts = toOptionDrafts(saved);
    drafts[0].minSelect = "2";
    drafts[0].maxSelect = "1";
    expect(validateOptionDrafts(drafts, t).error.message).toBe(
      t("errors:menuOption.minAboveMax", { group: 1, min: 2, max: 1 }),
    );
  });

  it("accepts \"pick at most\" above the number of options", () => {
    const drafts = toOptionDrafts(saved);
    drafts[0].maxSelect = "9";
    expect(validateOptionDrafts(drafts, t).error).toBeUndefined();
  });

  it("names a pick count that is not a whole number", () => {
    const drafts = toOptionDrafts(saved);
    drafts[0].maxSelect = "1,5";
    expect(validateOptionDrafts(drafts, t).error.message).toBe(t("errors:menuOption.groupRange", { group: 1 }));
  });
});
