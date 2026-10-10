import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { useAuthStore } from "@/store/useAuthStore";
import { renderWithProviders } from "@/test/utils";
import { getMenuLayout, updateMenuItem } from "@/services/apiRestaurant";
import { AddMenuItemForm } from "./AddMenuItemForm";
import { EditMenuItemForm } from "./EditMenuItemForm";

vi.mock("@/services/apiRestaurant", () => ({
  getMenuLayout: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
}));

const sections = [
  { _id: "s1", name: "Mains", items: [] },
  { _id: "s2", name: "Drinks", items: [] },
];

const menuItem = (sectionId) => ({
  _id: "d1",
  name: "Burger",
  category: "burgers",
  price: 500,
  available: true,
  description: "Beef",
  imageUrls: ["https://res.cloudinary.com/demo/image/upload/burger.jpg"],
  sectionId,
});

const sectionSelect = () => screen.getByLabelText(t("seller:menuLayout.section"));
const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: t("seller:settings.updateMenuItem") }));
const sentData = () => updateMenuItem.mock.calls.at(-1)[2];

describe("menu item section select", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    getMenuLayout.mockResolvedValue({ sections, unsectioned: [] });
    updateMenuItem.mockResolvedValue({});
    useAuthStore.setState({
      authUser: { role: "seller", restaurant: [{ _id: "r1", currency: "RSD", menuSections: [] }] },
    });
  });

  it("preselects the dish's section and sends a new one", async () => {
    renderWithProviders(<EditMenuItemForm menuItem={menuItem("s1")} onClose={() => {}} />);
    await waitFor(() => expect(sectionSelect()).toHaveValue("s1"));

    fireEvent.change(sectionSelect(), { target: { value: "s2" } });
    submit();

    await waitFor(() => expect(updateMenuItem).toHaveBeenCalled());
    expect(sentData().sectionId).toBe("s2");
  });

  it("sends an empty sectionId to take the dish out of its section", async () => {
    renderWithProviders(<EditMenuItemForm menuItem={menuItem("s1")} onClose={() => {}} />);
    await waitFor(() => expect(sectionSelect()).toHaveValue("s1"));

    fireEvent.change(sectionSelect(), {
      target: { value: "" },
    });
    expect(sectionSelect()).toHaveDisplayValue(t("seller:menuLayout.noSection"));
    submit();

    await waitFor(() => expect(updateMenuItem).toHaveBeenCalled());
    expect(sentData().sectionId).toBe("");
  });

  it("leaves an unchanged section out so the dish keeps its place", async () => {
    renderWithProviders(<EditMenuItemForm menuItem={menuItem("s1")} onClose={() => {}} />);
    await waitFor(() => expect(sectionSelect()).toHaveValue("s1"));
    submit();

    await waitFor(() => expect(updateMenuItem).toHaveBeenCalled());
    expect(sentData().sectionId).toBeUndefined();
  });

  it("hides the select when the restaurant has no sections", async () => {
    getMenuLayout.mockResolvedValue({ sections: [], unsectioned: [] });
    renderWithProviders(<AddMenuItemForm onClose={() => {}} />);
    await waitFor(() => expect(getMenuLayout).toHaveBeenCalled());
    expect(screen.queryByLabelText(t("seller:menuLayout.section"))).not.toBeInTheDocument();
  });

  it("offers the sections on create", async () => {
    renderWithProviders(<AddMenuItemForm onClose={() => {}} />);
    await waitFor(() => expect(sectionSelect()).toHaveValue(""));
    expect(screen.getByRole("option", { name: "Drinks" })).toBeInTheDocument();
  });
});
