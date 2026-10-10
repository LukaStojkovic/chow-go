import { render, screen } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";

import { createTestQueryClient, createWrapper } from "@/test/utils";
import { ArrivalEstimate } from "./ArrivalEstimate";

const wrapper = () => ({ wrapper: createWrapper(createTestQueryClient()) });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-10T18:30:00Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

it("shows the minutes left and how far along the wait is", async () => {
  await render(
    <ArrivalEstimate order={{ status: "preparing", placedAt: "2026-10-10T18:00:00Z", etaAt: "2026-10-10T19:00:00Z" }} />,
    wrapper(),
  );
  expect(screen.getByText(t("order:eta.minutes", { count: 30 }))).toBeOnTheScreen();
  expect(screen.getByRole("progressbar").props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
});

it("has no bar when it does not know when the order started", async () => {
  await render(<ArrivalEstimate order={{ status: "ready", etaAt: "2026-10-10T19:00:00Z" }} />, wrapper());
  expect(screen.queryByRole("progressbar")).toBeNull();
});
