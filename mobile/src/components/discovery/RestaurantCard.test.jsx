import { render, screen } from "@testing-library/react-native";
import { toRestaurantView } from "@chowgo/shared/adapters/restaurant";

import { createWrapper } from "@/test/utils";
import { RestaurantCard } from "./RestaurantCard";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));

const allDay = Object.fromEntries(
  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => [
    day,
    { isOpen: true, openingTime: "00:00", closingTime: "00:00" },
  ]),
);
const base = { _id: "r1", name: "Pekara", isActive: true, isOpenNow: true, currency: "RSD", estimatedDeliveryTime: "30-45 min" };
const inAnHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

async function renderCard(raw) {
  await render(<RestaurantCard restaurant={toRestaurantView(raw)} onPress={jest.fn()} />, {
    wrapper: createWrapper(),
  });
}

it("shows order ahead instead of closed when a closed restaurant takes pre-orders", async () => {
  await renderCard({ ...base, isOpenNow: false, schedule: allDay, timezone: "Europe/Belgrade" });

  expect(screen.getByText("Order ahead")).toBeOnTheScreen();
  expect(screen.queryByText("Closed now")).toBeNull();
});

it("reads as closed when nothing can be ordered for later", async () => {
  await renderCard({ ...base, isOpenNow: false });

  expect(screen.getByText("Closed now")).toBeOnTheScreen();
  expect(screen.queryByText("Order ahead")).toBeNull();
});

it("gives the pause reason rather than order ahead while the kitchen is paused", async () => {
  await renderCard({
    ...base,
    isOpenNow: false,
    schedule: allDay,
    timezone: "Europe/Belgrade",
    pause: { indefinite: true },
  });

  expect(screen.getByText("Not taking orders right now.")).toBeOnTheScreen();
  expect(screen.queryByText("Order ahead")).toBeNull();
});

it("flags a busy kitchen next to the longer delivery estimate", async () => {
  await renderCard({ ...base, busy: { extraMinutes: 15, until: inAnHour() } });

  expect(screen.getByText(/45-60 min/)).toBeOnTheScreen();
  expect(screen.getByText("Busy")).toBeOnTheScreen();
});

it("shows no busy hint for an ordinary open restaurant", async () => {
  await renderCard(base);

  expect(screen.getByText(/30-45 min/)).toBeOnTheScreen();
  expect(screen.queryByText("Busy")).toBeNull();
});
