import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { useAuthStore } from "@/store/useAuthStore";
import { renderWithProviders } from "@/test/utils";
import { SellerSettings } from "./SellerSettings";

vi.mock("@/components/Location/LocationMapSelector", () => ({
  LocationMapSelector: ({ initialPosition, onLocationChange }) => (
    <button type="button" data-initial={JSON.stringify(initialPosition)} onClick={() => onLocationChange(44.8125, 20.4612)}>
      drop pin
    </button>
  ),
}));

describe("SellerSettings location", () => {
  let apiUpdateRestaurant;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiUpdateRestaurant = vi.fn();
    useAuthStore.setState({
      authUser: {
        role: "seller",
        restaurant: [
          {
            _id: "r1",
            name: "R",
            address: { street: "Old 1", city: "Beograd", zipCode: "11000", country: "Serbia" },
            location: { type: "Point", coordinates: [20.45, 44.8] },
          },
        ],
      },
      apiUpdateRestaurant,
      isUpdatingProfile: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const lastSave = () => Object.fromEntries(apiUpdateRestaurant.mock.calls.at(-1)[0].entries());

  it("starts the map at the stored pin", async () => {
    renderWithProviders(<SellerSettings />);
    const map = await screen.findByRole("button", { name: "drop pin" });
    expect(JSON.parse(map.dataset.initial)).toEqual({ lat: 44.8, lng: 20.45 });
  });

  it("asks the seller to check the pin after an address edit, and saves no pin with it", async () => {
    renderWithProviders(<SellerSettings />);
    fireEvent.change(screen.getByLabelText(t("seller:settings.location.address")), { target: { value: "New 2" } });

    expect(screen.getByRole("status")).toHaveTextContent(t("seller:settings.location.checkPin"));
    await act(() => vi.advanceTimersByTimeAsync(1100));
    expect(lastSave()["address[street]"]).toBe("New 2");
    expect(lastSave()).not.toHaveProperty("location[lat]");
  });

  it("sends a dropped pin and clears the notice", async () => {
    renderWithProviders(<SellerSettings />);
    fireEvent.change(screen.getByLabelText(t("seller:settings.location.address")), { target: { value: "New 2" } });
    fireEvent.click(await screen.findByRole("button", { name: "drop pin" }));

    expect(screen.queryByText(t("seller:settings.location.checkPin"))).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1100));
    expect(lastSave()).toMatchObject({ "location[lat]": "44.8125", "location[lng]": "20.4612" });
  });
});
