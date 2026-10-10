import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatTime } from "@chowgo/shared/format";
import useCartStore from "@/store/useCartStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { axiosError, renderWithProviders } from "@/test/utils";
import CheckoutPage from "./CheckoutPage";

const createOrder = vi.fn();

vi.mock("@/hooks/Orders/useCreateOrder", () => ({
  useCreateOrder: () => ({ createOrder, isCreatingOrder: false }),
}));
vi.mock("@/features/checkout/AddressStep", () => ({ AddressStep: () => null }));
vi.mock("@/features/checkout/PromoCodeField", () => ({ PromoCodeField: () => null }));
vi.mock("@/components/basket/UpsellRail", () => ({ UpsellRail: () => null }));

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const roundTheClock = Object.fromEntries(
  DAYS.map((day) => [day, { isOpen: true, openingTime: "00:00", closingTime: "00:00" }]),
);

const NOW = new Date(2026, 9, 9, 10, 0);
const FIRST_SLOT = new Date(2026, 9, 9, 10, 45);

function setup({ isOpenNow = true, schedule = roundTheClock } = {}) {
  useCartStore.setState({
    items: [{ _id: "l1", lineId: "d1", menuItem: { _id: "d1", name: "Burger" }, quantity: 1, price: 900 }],
    totalPrice: 900,
    isLoading: false,
    fetchCart: vi.fn(),
    restaurant: {
      _id: "r1",
      name: "Night Kitchen",
      currency: "RSD",
      isActive: true,
      isOpenNow,
      timezone: "Europe/Belgrade",
      schedule,
    },
  });
  useDeliveryStore.setState({ selectedDeliveryAddress: { _id: "a1" } });
  renderWithProviders(<CheckoutPage />);
  return userEvent.setup();
}

const placeOrder = () => screen.getAllByRole("button", { name: /place order/i })[0];
const timing = () => screen.getByRole("group", { name: "Delivery time" });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubGlobal("scrollTo", vi.fn());
  createOrder.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CheckoutPage delivery time", () => {
  it("orders for now by default and keeps priority available", async () => {
    const user = setup();
    expect(within(timing()).getByRole("radio", { name: /as soon as possible/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /priority/i })).toBeEnabled();

    await user.click(placeOrder());
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createOrder.mock.calls[0][0]).not.toHaveProperty("scheduledFor");
  });

  it("groups slots by day and sends the chosen one with standard delivery", async () => {
    const user = setup();
    await user.click(screen.getByRole("radio", { name: /priority/i }));
    await user.click(within(timing()).getByRole("radio", { name: /schedule for later/i }));

    const day = screen.getByRole("combobox", { name: "Day" });
    const dayLabels = within(day).getAllByRole("option").map((option) => option.textContent);
    expect(dayLabels.slice(0, 2)).toEqual(["Today", "Tomorrow"]);
    expect(dayLabels[2]).toMatch(/Sunday/);

    const time = screen.getByRole("combobox", { name: "Time" });
    expect(time).toHaveDisplayValue(formatTime(FIRST_SLOT));

    const priority = screen.getByRole("radio", { name: /priority/i });
    expect(priority).toBeDisabled();
    expect(priority).not.toBeChecked();
    expect(screen.getByText("Priority delivery is only for orders sent now.")).toBeInTheDocument();

    await user.selectOptions(day, within(day).getByRole("option", { name: "Tomorrow" }));
    expect(time).toHaveDisplayValue(formatTime(new Date(2026, 9, 10, 0, 0)));

    await user.click(placeOrder());
    expect(createOrder.mock.calls[0][0]).toMatchObject({
      deliveryType: "standard",
      scheduledFor: new Date(2026, 9, 10, 0, 0).toISOString(),
    });
  });

  it("requires a time when the restaurant is closed now", async () => {
    const user = setup({ isOpenNow: false });

    expect(within(timing()).getByRole("radio", { name: /as soon as possible/i })).toBeDisabled();
    expect(within(timing()).getByRole("radio", { name: /schedule for later/i })).toBeChecked();
    expect(screen.getAllByText(/choose a delivery time/i).length).toBeGreaterThan(0);
    expect(placeOrder()).toBeDisabled();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Time" }),
      FIRST_SLOT.toISOString(),
    );
    expect(placeOrder()).toBeEnabled();
    await user.click(placeOrder());
    expect(createOrder.mock.calls[0][0].scheduledFor).toBe(FIRST_SLOT.toISOString());
  });

  it("says when there are no delivery times", () => {
    setup({ isOpenNow: false, schedule: {} });
    expect(screen.getAllByText("There are no delivery times in the next 3 days.").length).toBeGreaterThan(0);
    expect(placeOrder()).toBeDisabled();
  });

  it("shows a schedule refusal and clears the chosen time", async () => {
    createOrder.mockImplementation((_body, { onError }) =>
      onError(axiosError(400, { code: "SCHEDULE_CLOSED", message: "The kitchen is closed then." })),
    );
    const user = setup();
    await user.click(within(timing()).getByRole("radio", { name: /schedule for later/i }));
    await user.click(placeOrder());

    expect(await screen.findByRole("alert")).toHaveTextContent("The kitchen is closed then.");
    expect(screen.getByRole("combobox", { name: "Time" })).toHaveValue("");
    expect(useCartStore.getState().fetchCart).toHaveBeenCalledTimes(2);
  });
});
