import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import { useAuthStore } from "@/store/useAuthStore";
import { axiosError, renderWithProviders } from "@/test/utils";
import { getAllMenuItems, getMenuItems, setMenuItemStock } from "@/services/apiRestaurant";
import { SellerMenu } from "./SellerMenu";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/services/apiRestaurant", async (importOriginal) => ({
  ...(await importOriginal()),
  getMenuItems: vi.fn(),
  getAllMenuItems: vi.fn(),
  setMenuItemStock: vi.fn(),
}));

const dish = (id, name, extra = {}) => ({
  _id: id,
  name,
  price: 500,
  category: "Burgers",
  available: true,
  imageUrls: [],
  optionGroups: [],
  ...extra,
});

const burger = dish("d1", "Burger", {
  optionGroups: [
    {
      _id: "g1",
      name: "Extras",
      options: [
        { _id: "o1", name: "Cheese", priceDelta: 50, available: true },
        { _id: "o2", name: "Bacon", priceDelta: 80, available: false, soldOutUntil: null },
      ],
    },
  ],
});
const soup = dish("d2", "Soup", { available: false, soldOutUntil: null });
const pasta = dish("d3", "Pasta");
let store;
const items = () => store;

const card = (id) => within(screen.getByTestId(`menu-item-${id}`));
const stockSwitch = (name) => screen.getByRole("switch", { name: t("seller:stock.switchLabel", { name }) });

async function renderPage() {
  renderWithProviders(<SellerMenu />);
  await screen.findByText("Pasta");
}

describe("SellerMenu stock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    useAuthStore.setState({ authUser: { role: "seller", restaurant: [{ _id: "r1", currency: "RSD" }] } });
    store = structuredClone([burger, soup, pasta]);
    getMenuItems.mockImplementation(async () => ({ menuItems: items(), pagination: { totalPages: 1 } }));
    getAllMenuItems.mockImplementation(async () => ({ menuItems: items() }));
    setMenuItemStock.mockImplementation(async (_r, id, body) => {
      store = store.map((item) => {
        if (item._id !== id) return item;
        if (!body.optionId) return { ...item, available: body.available, soldOutUntil: null };
        return {
          ...item,
          optionGroups: item.optionGroups.map((group) => ({
            ...group,
            options: group.options.map((option) =>
              option._id === body.optionId ? { ...option, available: body.available } : option,
            ),
          })),
        };
      });
      return store.find((item) => item._id === id);
    });
  });

  it("asks how long before marking a dish sold out and sends endOfDay", async () => {
    await renderPage();
    fireEvent.click(stockSwitch("Pasta"));
    expect(setMenuItemStock).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole("button", { name: new RegExp(t("seller:stock.endOfDay")) }));
    await waitFor(() =>
      expect(setMenuItemStock).toHaveBeenCalledWith("r1", "d3", { available: false, until: "endOfDay" }),
    );
    expect(card("d3").getByText(t("seller:stock.soldOut"))).toBeInTheDocument();
  });

  it("sends indefinite when chosen", async () => {
    await renderPage();
    fireEvent.click(stockSwitch("Pasta"));
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(t("seller:stock.indefinite")) }));
    await waitFor(() =>
      expect(setMenuItemStock).toHaveBeenCalledWith("r1", "d3", { available: false, until: "indefinite" }),
    );
  });

  it("puts a dish back in stock in one tap", async () => {
    await renderPage();
    expect(stockSwitch("Soup")).not.toBeChecked();
    fireEvent.click(stockSwitch("Soup"));
    await waitFor(() => expect(setMenuItemStock).toHaveBeenCalledWith("r1", "d2", { available: true }));
    expect(stockSwitch("Soup")).toBeChecked();
  });

  it("rolls back and toasts when the change fails", async () => {
    setMenuItemStock.mockRejectedValue(axiosError(500, {}));
    await renderPage();
    fireEvent.click(stockSwitch("Soup"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(t("seller:stock.failed")));
    expect(stockSwitch("Soup")).not.toBeChecked();
  });

  it("toggles an option with its id from the options sheet", async () => {
    await renderPage();
    fireEvent.click(card("d1").getByRole("button", { name: t("seller:stock.optionsSoldOut", { count: 1 }) }));
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Extras")).toBeInTheDocument();

    fireEvent.click(within(sheet).getByRole("switch", { name: t("seller:stock.switchLabel", { name: "Bacon" }) }));
    await waitFor(() =>
      expect(setMenuItemStock).toHaveBeenCalledWith("r1", "d1", { available: true, optionId: "o2" }),
    );

    fireEvent.click(within(sheet).getByRole("switch", { name: t("seller:stock.switchLabel", { name: "Cheese" }) }));
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(t("seller:stock.endOfDay")) }));
    await waitFor(() =>
      expect(setMenuItemStock).toHaveBeenCalledWith("r1", "d1", {
        available: false,
        until: "endOfDay",
        optionId: "o1",
      }),
    );
  });

  it("filters to sold-out dishes and restocks them all", async () => {
    await renderPage();
    const filter = await screen.findByRole("button", { name: new RegExp(`${t("seller:stock.filter")}\\s*\\(2\\)`) });
    fireEvent.click(filter);
    await waitFor(() => expect(screen.queryByText("Pasta")).not.toBeInTheDocument());
    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("Soup")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("seller:stock.restockAll") }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(t("seller:stock.restocked")));
    expect(setMenuItemStock.mock.calls.map(([, id, body]) => [id, body])).toEqual([
      ["d1", { available: true, optionId: "o2" }],
      ["d2", { available: true }],
    ]);
  });
});
