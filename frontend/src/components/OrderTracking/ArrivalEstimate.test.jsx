import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { renderWithProviders } from "@/test/utils";
import { ArrivalEstimate } from "./ArrivalEstimate";

describe("ArrivalEstimate countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T18:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the minutes left and how far along the wait is", () => {
    renderWithProviders(
      <ArrivalEstimate
        order={{ status: "preparing", placedAt: "2026-10-10T18:00:00Z", etaAt: "2026-10-10T19:00:00Z" }}
      />,
    );
    expect(screen.getByText(t("order:eta.minutes", { count: 30 }))).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: t("order:eta.label") })).toHaveAttribute("aria-valuenow", "50");
  });

  it("follows the live route once the food is on its way", () => {
    renderWithProviders(
      <ArrivalEstimate
        order={{ status: "in_transit", placedAt: "2026-10-10T18:00:00Z", etaAt: "2026-10-10T19:00:00Z" }}
        routeSeconds={6 * 60}
      />,
    );
    expect(screen.getByText(t("order:eta.minutes", { count: 6 }))).toBeInTheDocument();
    expect(Number(screen.getByRole("progressbar").getAttribute("aria-valuenow"))).toBeGreaterThan(80);
  });

  it("has no bar when it does not know when the order started", () => {
    renderWithProviders(<ArrivalEstimate order={{ status: "ready", etaAt: "2026-10-10T19:00:00Z" }} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
