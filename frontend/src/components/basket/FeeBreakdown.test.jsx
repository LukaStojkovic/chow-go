import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { formatPrice } from "@chowgo/shared/format";
import { t } from "@chowgo/shared/i18n";

import { renderWithProviders } from "@/test/utils";
import { FeeBreakdown } from "./FeeBreakdown";

const rows = () =>
  Object.fromEntries(
    screen.getAllByRole("term").map((dt) => [dt.textContent.trim(), dt.nextElementSibling.textContent.trim()]),
  );

describe("FeeBreakdown", () => {
  it("lists subtotal, both fees and the total in the restaurant's currency", () => {
    const pricing = buildPriceBreakdown({ subtotal: 12.4, currency: "EUR" });
    renderWithProviders(<FeeBreakdown pricing={pricing} />);

    expect(rows()).toEqual({
      [t("basket:summary.subtotal")]: "€12.40",
      [t("basket:summary.deliveryFee")]: "€2.50",
      [t("basket:summary.serviceFee")]: "€1.50",
      [t("basket:summary.total")]: "€16.40",
    });
  });

  it("adds priority, tip and a labelled discount only when present", () => {
    const pricing = {
      ...buildPriceBreakdown({ subtotal: 1000, deliveryType: "priority", tip: 100, discount: 300, currency: "RSD" }),
      promoCode: "SAVE-300",
    };
    renderWithProviders(<FeeBreakdown pricing={pricing} totalLabel="To pay" />);

    const shown = rows();
    expect(shown[t("basket:summary.priorityFee")]).toBe(formatPrice(200, { currency: "RSD" }));
    expect(shown[t("basket:summary.tip")]).toBe(formatPrice(100, { currency: "RSD" }));
    expect(shown[`${t("basket:summary.discount")} (SAVE-300)`]).toBe(`-${formatPrice(300, { currency: "RSD" })}`);
    expect(shown["To pay"]).toBe(formatPrice(1400, { currency: "RSD" }));
  });

  it("reads a zero fee as free and can hide the total", () => {
    const pricing = { ...buildPriceBreakdown({ subtotal: 10, currency: "EUR" }), deliveryFee: 0 };
    renderWithProviders(<FeeBreakdown pricing={pricing} showTotal={false} />);
    expect(rows()[t("basket:summary.deliveryFee")]).toBe("Free");
    expect(rows()[t("basket:summary.total")]).toBeUndefined();
  });

  it("explains each fee to assistive technology", () => {
    renderWithProviders(<FeeBreakdown pricing={buildPriceBreakdown({ subtotal: 10, currency: "EUR" })} />);
    const delivery = screen.getAllByRole("term")[1];
    expect(within(delivery).getByRole("button")).toHaveAccessibleName(
      t("basket:summary.hintLabel", { label: t("basket:summary.deliveryFee"), hint: t("basket:summary.deliveryFeeHint") }),
    );
  });
});
