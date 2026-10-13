import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { downloadPayoutCsv, getPayouts } from "@/services/apiSellerReports";
import { useAuthStore } from "@/store/useAuthStore";
import { renderWithProviders } from "@/test/utils";
import { SellerPayouts } from "./SellerPayouts";

vi.mock("@/services/apiSellerReports", () => ({ getPayouts: vi.fn(), downloadPayoutCsv: vi.fn() }));

const week = (weekStart, weekEnd, status, extra = {}) => ({
  weekStart,
  weekEnd,
  orders: 4,
  gross: 4000,
  discounts: 200,
  net: 3800,
  currency: "RSD",
  status,
  payout: null,
  adjusted: false,
  ...extra,
});

const pageOne = {
  currency: "RSD",
  timeZone: "Europe/Belgrade",
  weeks: [
    week("2026-10-12", "2026-10-18", "open"),
    week("2026-10-05", "2026-10-11", "due"),
    week("2026-09-28", "2026-10-04", "paid", {
      payout: { id: "p1", paidAt: "2026-10-06T10:00:00Z", reference: "TX-42", note: "", amount: 3500 },
      adjusted: true,
    }),
    week("2026-09-21", "2026-09-27", "nothing", { orders: 0, gross: 0, discounts: 0, net: 0 }),
  ],
  summary: { dueTotal: 3800, dueWeeks: 1, openWeek: 3800, lastPaid: { weekStart: "2026-09-28", paidAt: "2026-10-06T10:00:00Z", reference: "TX-42", amount: 3500 } },
  pagination: { page: 1, hasNext: true },
};

const pageTwo = {
  ...pageOne,
  weeks: [week("2026-07-13", "2026-07-19", "paid", { payout: { id: "p0", paidAt: "2026-07-21T10:00:00Z", reference: "TX-1", amount: 3800 } })],
  pagination: { page: 2, hasNext: false },
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ authUser: { role: "seller", restaurant: [{ _id: "r1", currency: "RSD" }] } });
  getPayouts.mockImplementation(async (page) => (page === 2 ? pageTwo : pageOne));
});

describe("SellerPayouts", () => {
  it("shows each week's status and flags an adjusted payout", async () => {
    renderWithProviders(<SellerPayouts />);

    const due = await screen.findByTestId("payout-week-2026-10-05");
    expect(within(due).getByText(t("seller:payouts.status.due"))).toBeInTheDocument();
    expect(within(screen.getByTestId("payout-week-2026-10-12")).getByText(t("seller:payouts.status.open"))).toBeInTheDocument();
    expect(within(screen.getByTestId("payout-week-2026-09-21")).getByText(t("seller:payouts.status.nothing"))).toBeInTheDocument();

    const paid = screen.getByTestId("payout-week-2026-09-28");
    expect(within(paid).getByText(t("seller:payouts.status.paid"))).toBeInTheDocument();
    expect(within(paid).getByText(t("seller:payouts.reference", { reference: "TX-42" }))).toBeInTheDocument();
    expect(within(paid).getByText(/the week changed/i)).toBeInTheDocument();
    expect(screen.getByText(t("seller:payouts.summary.weeks", { count: 1 }))).toBeInTheDocument();
  });

  it("loads older weeks and stops when there are none", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellerPayouts />);
    await screen.findByTestId("payout-week-2026-10-05");

    await user.click(screen.getByRole("button", { name: t("seller:payouts.loadOlder") }));

    expect(await screen.findByTestId("payout-week-2026-07-13")).toBeInTheDocument();
    expect(getPayouts).toHaveBeenLastCalledWith(2);
    await waitFor(() => expect(screen.queryByRole("button", { name: t("seller:payouts.loadOlder") })).not.toBeInTheDocument());
  });

  it("downloads one week's orders", async () => {
    const user = userEvent.setup();
    downloadPayoutCsv.mockResolvedValue("payout.csv");
    renderWithProviders(<SellerPayouts />);
    const due = await screen.findByTestId("payout-week-2026-10-05");

    await user.click(within(due).getByRole("button", { name: /2026|Oct/ }));
    await waitFor(() => expect(downloadPayoutCsv).toHaveBeenCalled());
    expect(downloadPayoutCsv.mock.calls[0][0]).toBe("2026-10-05");
  });
});
