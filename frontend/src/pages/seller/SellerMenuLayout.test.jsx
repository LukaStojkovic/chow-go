import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";
import { formatPrice } from "@chowgo/shared/format";

import { useAuthStore } from "@/store/useAuthStore";
import { axiosError, renderWithProviders } from "@/test/utils";
import { getMenuLayout, saveMenuLayout } from "@/services/apiRestaurant";
import { SellerMenuLayout } from "./SellerMenuLayout";

vi.mock("@/services/apiRestaurant", () => ({
  getMenuLayout: vi.fn(),
  saveMenuLayout: vi.fn(),
}));

const dish = (id, name, price = 500) => ({ _id: id, name, price, available: true, imageUrls: [] });

const layout = () => ({
  sections: [
    { _id: "s1", name: "Mains", items: [dish("d1", "Burger"), dish("d2", "Pasta")] },
    { _id: "s2", name: "Drinks", items: [dish("d3", "Cola")] },
  ],
  unsectioned: [dish("d4", "Soup")],
});

const region = (name) => screen.getByRole("region", { name });
const saveButton = () => screen.getByRole("button", { name: t("seller:menuLayout.save") });
const newSectionInput = () => screen.getByPlaceholderText(t("seller:menuLayout.sectionNamePlaceholder"));
const sentPayload = () => saveMenuLayout.mock.calls.at(-1)[0];

async function renderPage() {
  renderWithProviders(<SellerMenuLayout />);
  await screen.findByRole("region", { name: "Mains" });
}

describe("SellerMenuLayout", () => {
  beforeEach(() => {
    getMenuLayout.mockResolvedValue(layout());
    saveMenuLayout.mockImplementation(async () => layout());
    useAuthStore.setState({
      authUser: { role: "seller", restaurant: [{ _id: "r1", currency: "RSD" }] },
    });
  });

  it("shows the saved layout with prices in the restaurant currency and nothing to save", async () => {
    await renderPage();
    const mains = within(region("Mains"));
    expect(mains.getByText("Burger")).toBeInTheDocument();
    const price = formatPrice(500, { currency: "RSD" }).replace(/\s+/g, " ");
    expect(mains.getAllByText(price)).toHaveLength(2);
    expect(within(region(t("seller:menuLayout.unsectioned"))).getByText("Soup")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("adds a section and sends it without an id", async () => {
    await renderPage();
    fireEvent.change(newSectionInput(), {
      target: { value: "  Breakfast " },
    });
    fireEvent.click(screen.getByRole("button", { name: t("seller:menuLayout.addSection") }));

    expect(region("Breakfast")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(t("seller:menuLayout.unsaved"));

    fireEvent.click(saveButton());
    await waitFor(() => expect(saveMenuLayout).toHaveBeenCalled());
    expect(sentPayload()).toEqual({
      sections: [
        { _id: "s1", name: "Mains", itemIds: ["d1", "d2"] },
        { _id: "s2", name: "Drinks", itemIds: ["d3"] },
        { name: "Breakfast", itemIds: [] },
      ],
    });
  });

  it("refuses a duplicate name case-insensitively", async () => {
    await renderPage();
    fireEvent.change(newSectionInput(), {
      target: { value: "mains" },
    });
    expect(screen.getByRole("button", { name: t("seller:menuLayout.addSection") })).toBeDisabled();
    expect(
      screen.getByText(t("errors:menuLayout.duplicateName", { name: "mains" })),
    ).toBeInTheDocument();
  });

  it("renames a section inline", async () => {
    await renderPage();
    const input = within(region("Drinks")).getByLabelText(t("seller:menuLayout.sectionName"));
    fireEvent.change(input, { target: { value: "Cold drinks" } });

    fireEvent.click(saveButton());
    await waitFor(() => expect(saveMenuLayout).toHaveBeenCalled());
    expect(sentPayload().sections[1]).toEqual({ _id: "s2", name: "Cold drinks", itemIds: ["d3"] });
  });

  it("blocks saving a section with no name", async () => {
    await renderPage();
    const input = within(region("Drinks")).getByLabelText(t("seller:menuLayout.sectionName"));
    fireEvent.change(input, { target: { value: "  " } });
    expect(screen.getByRole("alert")).toHaveTextContent(
      t("errors:menuLayout.sectionName", { section: 2, max: 40 }),
    );
    expect(saveButton()).toBeDisabled();
  });

  it("moves a deleted section's dishes to the unsectioned list", async () => {
    await renderPage();
    fireEvent.click(
      within(region("Mains")).getByRole("button", { name: t("seller:menuLayout.deleteSection") }),
    );

    expect(screen.queryByRole("region", { name: "Mains" })).not.toBeInTheDocument();
    const rest = within(region(t("seller:menuLayout.unsectioned")));
    expect(rest.getByText("Burger")).toBeInTheDocument();
    expect(rest.getByText("Pasta")).toBeInTheDocument();

    fireEvent.click(saveButton());
    await waitFor(() => expect(saveMenuLayout).toHaveBeenCalled());
    expect(sentPayload()).toEqual({ sections: [{ _id: "s2", name: "Drinks", itemIds: ["d3"] }] });
  });

  it("reorders sections and dishes", async () => {
    await renderPage();
    fireEvent.click(
      within(region("Drinks")).getByRole("button", { name: t("seller:menuLayout.moveUp") }),
    );
    fireEvent.click(
      within(region("Mains")).getByRole("button", {
        name: `${t("seller:menuLayout.moveDown")} Burger`,
      }),
    );

    fireEvent.click(saveButton());
    await waitFor(() => expect(saveMenuLayout).toHaveBeenCalled());
    expect(sentPayload()).toEqual({
      sections: [
        { _id: "s2", name: "Drinks", itemIds: ["d3"] },
        { _id: "s1", name: "Mains", itemIds: ["d2", "d1"] },
      ],
    });
  });

  it("moves dishes between sections and out of them", async () => {
    await renderPage();
    fireEvent.change(
      screen.getByRole("combobox", { name: `${t("seller:menuLayout.moveTo")} Soup` }),
      { target: { value: "s2" } },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: `${t("seller:menuLayout.moveTo")} Burger` }),
      { target: { value: "" } },
    );

    expect(within(region("Drinks")).getByText("Soup")).toBeInTheDocument();
    expect(within(region(t("seller:menuLayout.unsectioned"))).getByText("Burger")).toBeInTheDocument();

    fireEvent.click(saveButton());
    await waitFor(() => expect(saveMenuLayout).toHaveBeenCalled());
    expect(sentPayload()).toEqual({
      sections: [
        { _id: "s1", name: "Mains", itemIds: ["d2"] },
        { _id: "s2", name: "Drinks", itemIds: ["d3", "d4"] },
      ],
    });
  });

  it("discards the draft", async () => {
    await renderPage();
    fireEvent.click(
      within(region("Mains")).getByRole("button", { name: t("seller:menuLayout.deleteSection") }),
    );
    fireEvent.click(screen.getByRole("button", { name: t("seller:menuLayout.discard") }));
    expect(region("Mains")).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("shows the server's refusal", async () => {
    saveMenuLayout.mockRejectedValue(
      axiosError(400, { code: "MENU_LAYOUT_INVALID", message: "There is already a section called Drinks" }),
    );
    await renderPage();
    fireEvent.change(within(region("Mains")).getByLabelText(t("seller:menuLayout.sectionName")), {
      target: { value: "Food" },
    });
    fireEvent.click(saveButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "There is already a section called Drinks",
    );
  });

  it("falls back to the code's copy when the refusal has no message", async () => {
    saveMenuLayout.mockRejectedValue(axiosError(400, { code: "MENU_LAYOUT_INVALID" }));
    await renderPage();
    fireEvent.change(within(region("Mains")).getByLabelText(t("seller:menuLayout.sectionName")), {
      target: { value: "Food" },
    });
    fireEvent.click(saveButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("errors:byCode.MENU_LAYOUT_INVALID"),
    );
  });

  it("takes the saved layout as the new baseline", async () => {
    saveMenuLayout.mockResolvedValue({
      sections: [...layout().sections, { _id: "s3", name: "Breakfast", items: [] }],
      unsectioned: layout().unsectioned,
    });
    await renderPage();
    fireEvent.change(newSectionInput(), {
      target: { value: "Breakfast" },
    });
    fireEvent.click(screen.getByRole("button", { name: t("seller:menuLayout.addSection") }));
    fireEvent.click(saveButton());

    await waitFor(() => expect(saveButton()).toBeDisabled());
    expect(useAuthStore.getState().authUser.restaurant[0].menuSections).toEqual([
      { _id: "s1", name: "Mains" },
      { _id: "s2", name: "Drinks" },
      { _id: "s3", name: "Breakfast" },
    ]);

    fireEvent.change(within(region("Breakfast")).getByLabelText(t("seller:menuLayout.sectionName")), {
      target: { value: "Brunch" },
    });
    fireEvent.click(saveButton());
    await waitFor(() => expect(saveMenuLayout).toHaveBeenCalledTimes(2));
    expect(sentPayload().sections[2]).toEqual({ _id: "s3", name: "Brunch", itemIds: [] });
  });
});
