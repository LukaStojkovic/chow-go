import { act, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { changeLanguage } from "@chowgo/shared/i18n";

import { renderWithProviders } from "@/test/utils";
import { OrderStatusTimeline } from "./OrderStatusTimeline";

const order = (status, extra) => toOrderView({ _id: "665f1c2e9b1e8a0012abcdef", status, ...extra });

const states = () =>
  within(screen.getByRole("list"))
    .getAllByRole("listitem")
    .map((li) => li.querySelector("p + span").textContent);

describe("OrderStatusTimeline", () => {
  it("announces the status politely", () => {
    renderWithProviders(<OrderStatusTimeline order={order("preparing")} />);
    const heading = screen.getByText(order("preparing").statusLabel);
    expect(heading).toHaveAttribute("aria-live", "polite");
  });

  it("states each step's progress in words, not only colour", () => {
    renderWithProviders(<OrderStatusTimeline order={order("in_transit")} />);
    expect(states()).toEqual(["Done", "Done", "Done", "Done", "Now", "Upcoming"]);
  });

  it("describes only the current step", () => {
    const view = order("ready");
    renderWithProviders(<OrderStatusTimeline order={view} />);
    const current = view.steps.find((s) => s.state === "current");
    expect(screen.getByText(current.description)).toBeInTheDocument();
    expect(screen.getAllByText(/./, { selector: "p.text-body-sm" })).toHaveLength(2);
  });

  it("shows when a step happened", () => {
    renderWithProviders(
      <OrderStatusTimeline order={order("confirmed", { createdAt: "2026-06-15T12:00:00Z", confirmedAt: "2026-06-15T12:03:00Z" })} />,
    );
    expect(screen.getAllByRole("time").map((el) => el.getAttribute("datetime"))).toEqual([
      "2026-06-15T12:00:00.000Z",
      "2026-06-15T12:03:00.000Z",
    ]);
  });

  it("translates the step states", async () => {
    await act(() => changeLanguage("sr"));
    renderWithProviders(<OrderStatusTimeline order={order("in_transit")} />);
    expect(states()).toEqual(["Završeno", "Završeno", "Završeno", "Završeno", "Sada", "Predstoji"]);
  });
});
