import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { renderWithProviders } from "@/test/utils";
import { MenuItemOptionGroupsEditor } from "./MenuItemOptionGroupsEditor";
import { optionGroupsToEditorState, validateOptionGroups } from "./optionGroupsForm";

let latest;

function Harness({ initial = [] }) {
  const [value, setValue] = useState(initial);
  const onChange = (next) => {
    latest = next;
    setValue(next);
  };
  return <MenuItemOptionGroupsEditor value={value} onChange={onChange} />;
}

describe("MenuItemOptionGroupsEditor", () => {
  it("adds and removes groups and options", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    expect(screen.getByText(t("seller:menuOptions.empty"))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t("seller:menuOptions.addGroup") }));
    await user.type(screen.getByRole("textbox", { name: /group name 1/i }), "Size");
    await user.type(screen.getByRole("textbox", { name: /^option 1/i }), "Large");
    await user.click(screen.getByRole("button", { name: t("seller:menuOptions.addOption") }));
    await user.type(screen.getByRole("textbox", { name: /^option 2/i }), "Small");

    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ name: "Size" });
    expect(latest[0].options.map((option) => option.name)).toEqual(["Large", "Small"]);

    await user.click(screen.getByRole("button", { name: `${t("seller:menuOptions.removeOption")} 1` }));
    expect(latest[0].options.map((option) => option.name)).toEqual(["Small"]);

    await user.click(screen.getByRole("button", { name: t("seller:menuOptions.removeGroup") }));
    expect(latest).toEqual([]);
  });

  it("reorders groups", async () => {
    const user = userEvent.setup();
    const initial = optionGroupsToEditorState([
      { _id: "g1", name: "Size", minSelect: 1, maxSelect: 1, options: [{ _id: "o1", name: "Large" }] },
      { _id: "g2", name: "Extras", minSelect: 0, maxSelect: 2, options: [{ _id: "o2", name: "Cheese" }] },
    ]);
    renderWithProviders(<Harness initial={initial} />);

    await user.click(screen.getAllByRole("button", { name: t("seller:menuOptions.moveDown") })[0]);
    expect(latest.map((group) => group._id)).toEqual(["g2", "g1"]);
  });
});

describe("validateOptionGroups", () => {
  it("keeps existing ids", () => {
    const state = optionGroupsToEditorState([
      { _id: "g1", name: "Size", minSelect: 1, maxSelect: 1, options: [{ _id: "o1", name: "Large", priceDelta: 2 }] },
    ]);
    expect(validateOptionGroups(state, t)).toEqual({
      groups: [
        {
          _id: "g1",
          name: "Size",
          minSelect: 1,
          maxSelect: 1,
          options: [{ _id: "o1", name: "Large", priceDelta: 2, available: true }],
        },
      ],
    });
  });

  it("translates the first problem with a 1-based group number", () => {
    const state = optionGroupsToEditorState([
      { name: "Size", minSelect: 1, maxSelect: 1, options: [{ name: "Large" }] },
      { name: "Extras", minSelect: 0, maxSelect: 3, options: [{ name: "Cheese" }] },
    ]);
    expect(validateOptionGroups(state, t)).toEqual({
      error: t("errors:menuOption.groupRange", { group: 2 }),
    });
  });
});
