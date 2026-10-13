import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { getRestaurantAnalytics } from "@/services/apiRestaurant";
import { downloadOrdersCsv } from "@/services/apiSellerReports";
import { useAuthStore } from "@/store/useAuthStore";
import { renderWithProviders } from "@/test/utils";
import { SellerAnalytics } from "./SellerAnalytics";

vi.mock("@/services/apiRestaurant", () => ({ getRestaurantAnalytics: vi.fn() }));
vi.mock("@/services/apiSellerReports", () => ({ downloadOrdersCsv: vi.fn(), downloadPayoutCsv: vi.fn() }));

const summary = (extra = {}) => ({
  revenue: 1200,
  orders: 12,
  avgOrderValue: 100,
  placed: 14,
  cancelled: 1,
  rejected: 1,
  discounts: 50,
  ...extra,
});

const analytics = (range, previous) => ({
  status: "success",
  data: {
    currency: "RSD",
    timeZone: "Europe/Belgrade",
    range,
    summary: { ...summary(), previous: { range, ...previous } },
    series: [{ key: range.from, revenue: 1200, orders: 12 }],
    kpis: { todayRevenue: 0, todayOrders: 0, avgOrderValue: 0, monthlyRevenue: 0, averageRating: 4.5, totalReviews: 2 },
    peakHours: Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 })),
    dailyRevenue: [],
    orderStatusBreakdown: [],
    paymentMethodSplit: [],
    topItems: [],
    recentRatings: [],
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-13T10:00:00Z"));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  useAuthStore.setState({
    authUser: { role: "seller", restaurant: [{ _id: "r1", currency: "RSD", timezone: "Europe/Belgrade" }] },
  });
  getRestaurantAnalytics.mockImplementation(async (_id, params) => {
    const range = params.from
      ? { from: params.from, to: params.to, days: 30, granularity: "day" }
      : { from: "2026-09-14", to: "2026-10-13", days: 30, granularity: "day" };
    return analytics(range, summary({ revenue: 1000, orders: 0, avgOrderValue: 100, cancelled: 2, rejected: 0 }));
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SellerAnalytics", () => {
  it("defaults to the last 30 days and compares with the previous period", async () => {
    renderWithProviders(<SellerAnalytics />, { route: "/seller/analytics" });

    expect(await screen.findByText(t("seller:reports.summary.vsPrevious", { change: "+20%" }))).toBeInTheDocument();
    expect(getRestaurantAnalytics).toHaveBeenCalledWith("r1", { preset: "last30" });
    expect(screen.getByText(t("seller:reports.summary.newVsPrevious"))).toBeInTheDocument();
    expect(screen.getAllByText(t("seller:reports.summary.unchanged")).length).toBeGreaterThan(0);
  });

  it("sends a custom from/to range", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellerAnalytics />, { route: "/seller/analytics" });
    await screen.findByText(t("seller:reports.summary.revenue"));

    await user.click(screen.getByRole("button", { name: t("seller:reports.range.presets.custom") }));
    fireEvent.change(screen.getByLabelText(t("seller:reports.range.from")), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText(t("seller:reports.range.to")), { target: { value: "2026-09-30" } });
    await user.click(screen.getByRole("button", { name: t("seller:reports.range.apply") }));

    await waitFor(() =>
      expect(getRestaurantAnalytics).toHaveBeenLastCalledWith("r1", { from: "2026-09-01", to: "2026-09-30" }),
    );
  });

  it("refuses a range that ends before it starts", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellerAnalytics />, { route: "/seller/analytics" });
    await screen.findByText(t("seller:reports.summary.revenue"));

    await user.click(screen.getByRole("button", { name: t("seller:reports.range.presets.custom") }));
    fireEvent.change(screen.getByLabelText(t("seller:reports.range.from")), { target: { value: "2026-10-05" } });
    fireEvent.change(screen.getByLabelText(t("seller:reports.range.to")), { target: { value: "2026-10-01" } });
    await user.click(screen.getByRole("button", { name: t("seller:reports.range.apply") }));

    expect(screen.getByRole("alert")).toHaveTextContent(t("errors:report.rangeInvalid"));
    expect(getRestaurantAnalytics).toHaveBeenCalledTimes(1);
  });

  it("reads a preset from the URL and exports that range", async () => {
    const user = userEvent.setup();
    downloadOrdersCsv.mockResolvedValue("orders.csv");
    renderWithProviders(<SellerAnalytics />, { route: "/seller/analytics?preset=last7" });
    await screen.findByText(t("seller:reports.summary.revenue"));

    expect(getRestaurantAnalytics).toHaveBeenCalledWith("r1", { preset: "last7" });
    expect(screen.getByRole("button", { name: t("seller:reports.range.presets.last7") })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: t("seller:reports.export.button") }));
    await waitFor(() => expect(downloadOrdersCsv).toHaveBeenCalled());
    expect(downloadOrdersCsv.mock.calls[0][0]).toEqual({ from: "2026-10-07", to: "2026-10-13" });
  });
});
