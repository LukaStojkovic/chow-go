import { render, screen } from "@testing-library/react-native";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { changeLanguage, t } from "@chowgo/shared/i18n";

import { createWrapper } from "@/test/utils";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { STATUS_BADGE_TONE, shortStatus } from "./orderStatus";

const view = (status) => toOrderView({ _id: "665f1c2e9b1e8a0012abcdef", status });

describe("shortStatus", () => {
  it("uses the short catalog form for each status", () => {
    expect(shortStatus(view("in_transit"))).toBe(t("order:short.in_transit"));
    expect(shortStatus(view("in_transit"))).not.toBe(view("in_transit").statusLabel);
  });

  it("falls back to the full label, or nothing", () => {
    expect(shortStatus({ statusLabel: "Something" })).toBe("Something");
    expect(shortStatus(null)).toBe("");
    expect(shortStatus({ status: "brand_new_status", statusLabel: "Fallback" })).toBe("Fallback");
  });

  it("follows a language switch", async () => {
    const english = shortStatus(view("delivered"));
    await changeLanguage("sr");
    expect(shortStatus(view("delivered"))).not.toBe(english);
  });

  it("maps every adapter tone onto a badge tone", () => {
    const tones = new Set(["pending", "confirmed", "in_transit", "delivered", "cancelled"].map((s) => view(s).statusTone));
    for (const tone of tones) expect(STATUS_BADGE_TONE[tone]).toBeDefined();
  });
});

describe("OrderStatusTimeline", () => {
  it("renders nothing without steps", async () => {
    await render(<OrderStatusTimeline steps={[]} />, { wrapper: createWrapper() });
    expect(screen.toJSON()).toBeNull();
  });

  it("labels all six steps with their short forms", async () => {
    const { steps } = view("in_transit");
    await render(<OrderStatusTimeline steps={steps} />, { wrapper: createWrapper() });
    for (const step of steps) {
      expect(screen.getByText(t(`order:timeline.${step.id}`, { defaultValue: step.label }))).toBeOnTheScreen();
    }
  });
});
