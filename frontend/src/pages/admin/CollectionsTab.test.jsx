import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAdminCollection,
  getAdminCollections,
  reorderAdminCollections,
  setAdminCollectionStatus,
} from "@/services/apiAdmin";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { renderWithProviders } from "@/test/utils";
import { CollectionsTab } from "./CollectionsTab";

vi.mock("@/services/apiAdmin", () => ({
  getAdminCollections: vi.fn(),
  createAdminCollection: vi.fn(),
  updateAdminCollection: vi.fn(),
  setAdminCollectionStatus: vi.fn(),
  reorderAdminCollections: vi.fn(),
  previewAdminCollection: vi.fn(),
  searchCollectionPins: vi.fn(),
}));

const collection = (id, title, extra = {}) => ({
  id,
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  kind: "restaurants",
  title: { en: title },
  subtitle: {},
  coverImage: null,
  status: "draft",
  position: 0,
  manualOnly: false,
  pins: [],
  maxItems: 12,
  startsAt: null,
  endsAt: null,
  rules: { cuisines: [], categories: [], minRating: null, maxPrice: null, currency: null, onlyDeals: false, openNow: false, newWithinDays: null, sort: "rating" },
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  useDeliveryStore.setState({ address: null, coordinates: null });
  getAdminCollections.mockResolvedValue({
    collections: [
      collection("a1", "Best burgers", { status: "published", rules: { ...collection("x", "x").rules, cuisines: ["burgers"], minRating: 4.5 } }),
      collection("b2", "Late night"),
    ],
  });
});

describe("CollectionsTab", () => {
  it("lists collections with their status and rules", async () => {
    renderWithProviders(<CollectionsTab />);

    const row = (await screen.findByText("Best burgers")).closest("tr");
    expect(within(row).getByText("Published")).toBeInTheDocument();
    expect(within(row).getByText(/Burgers · Rated 4.5\+ · Sorted: Best rated/)).toBeInTheDocument();
    expect(getAdminCollections).toHaveBeenCalledWith(undefined);
  });

  it("publishes a draft", async () => {
    setAdminCollectionStatus.mockResolvedValue({});
    renderWithProviders(<CollectionsTab />);

    const row = (await screen.findByText("Late night")).closest("tr");
    await userEvent.click(within(row).getByRole("button", { name: "Publish" }));

    await waitFor(() =>
      expect(setAdminCollectionStatus).toHaveBeenCalledWith(
        { id: "b2", action: "publish" },
        expect.anything(),
      ),
    );
  });

  it("saves a new order when a collection is moved", async () => {
    reorderAdminCollections.mockResolvedValue({ collections: [] });
    renderWithProviders(<CollectionsTab />);

    await userEvent.click(await screen.findByRole("button", { name: "Move Late night up" }));

    await waitFor(() => expect(reorderAdminCollections).toHaveBeenCalledWith(["b2", "a1"], expect.anything()));
  });

  it("validates, then creates a collection with the chosen rules", async () => {
    createAdminCollection.mockResolvedValue(collection("c3", "Pasta night"));
    renderWithProviders(<CollectionsTab />);

    await userEvent.click(await screen.findByRole("button", { name: "New collection" }));
    const dialog = await screen.findByRole("dialog");

    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText(/Give the collection a title/)).toBeInTheDocument();
    expect(createAdminCollection).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText("Title (EN)"), "Pasta night");
    expect(within(dialog).getByLabelText("Link name")).toHaveValue("pasta-night");

    const cuisines = within(dialog).getByRole("group", { name: "Cuisines" });
    await userEvent.click(within(cuisines).getByRole("button", { name: "Italian" }));
    await userEvent.type(within(dialog).getByLabelText("Minimum rating"), "4");
    await userEvent.click(within(dialog).getByRole("switch", { name: "Only restaurants open now" }));

    expect(within(dialog).getByText(/Set a delivery address/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(createAdminCollection).toHaveBeenCalledTimes(1));
    expect(createAdminCollection.mock.calls[0][0]).toEqual({
      kind: "restaurants",
      slug: "pasta-night",
      title: { en: "Pasta night", sr: "" },
      subtitle: { en: "", sr: "" },
      coverImage: null,
      manualOnly: false,
      pins: [],
      maxItems: 12,
      startsAt: null,
      endsAt: null,
      rules: {
        cuisines: ["italian"],
        categories: [],
        minRating: 4,
        maxPrice: null,
        currency: null,
        onlyDeals: false,
        openNow: true,
        newWithinDays: null,
        sort: "rating",
      },
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
