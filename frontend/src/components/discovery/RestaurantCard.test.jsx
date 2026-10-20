import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { toRestaurantView } from "@chowgo/shared/adapters/restaurant";
import { renderWithProviders } from "@/test/utils";
import { RestaurantCard } from "./RestaurantCard";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const roundTheClock = Object.fromEntries(
  DAYS.map((day) => [day, { isOpen: true, openingTime: "00:00", closingTime: "00:00" }]),
);

const raw = (extra = {}) => ({
  _id: "r1",
  name: "Night Kitchen",
  isActive: true,
  isOpenNow: true,
  currency: "RSD",
  timezone: "Europe/Belgrade",
  estimatedDeliveryTime: "30-45 min",
  ...extra,
});

function renderCard(extra) {
  const view = toRestaurantView(raw(extra));
  renderWithProviders(<RestaurantCard restaurant={view} animate={false} />);
  return view;
}

describe("RestaurantCard availability", () => {
  it("shows Order ahead for a closed restaurant that takes pre-orders", () => {
    const view = renderCard({ isOpenNow: false, schedule: roundTheClock });
    expect(view.orderAhead).not.toBeNull();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Order ahead")).toBeInTheDocument();
  });

  it("shows only the closed state when no pre-order slot exists", () => {
    const view = renderCard({ isOpenNow: false });
    expect(view.orderAhead).toBeNull();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.queryByText("Order ahead")).not.toBeInTheDocument();
  });

  it("shows the pause message for a paused restaurant", () => {
    renderCard({ isOpenNow: false, pause: { indefinite: true } });
    expect(screen.getByText("Not taking orders right now.")).toBeInTheDocument();
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();
  });

  it("marks a busy kitchen next to the adjusted estimate", () => {
    renderCard({ busy: { extraMinutes: 15, until: new Date(Date.now() + 3600000).toISOString() } });
    expect(screen.getByText("45-60 min")).toBeInTheDocument();
    expect(screen.getByText("Busy")).toBeInTheDocument();
    expect(
      screen.getByText("Busy right now. The estimate includes about 15 extra minutes."),
    ).toBeInTheDocument();
  });

  it("shows no badges for an open, quiet restaurant", () => {
    renderCard();
    expect(screen.queryByText("Busy")).not.toBeInTheDocument();
    expect(screen.queryByText("Order ahead")).not.toBeInTheDocument();
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();
  });
});
