import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";

import { getAdminPayouts, markAdminPayoutPaid, voidAdminPayout } from "@/services/apiAdmin";
import { renderWithProviders } from "@/test/utils";
import { ReasonDialog } from "./AdminParts";
import { PayoutsTab } from "./PayoutsTab";
import { useState } from "react";

vi.mock("@/services/apiAdmin", () => ({
  getAdminPayouts: vi.fn(),
  markAdminPayoutPaid: vi.fn(),
  voidAdminPayout: vi.fn(),
}));

const due = {
  restaurant: { id: "r1", name: "Burger Bar" },
  weekStart: "2026-10-05",
  weekEnd: "2026-10-11",
  orders: 9,
  gross: 9000,
  discounts: 0,
  net: 9000,
  currency: "RSD",
};

const paid = {
  id: "p1",
  restaurant: { id: "r1", name: "Burger Bar" },
  weekStart: "2026-09-28",
  weekEnd: "2026-10-04",
  orders: 5,
  net: 5000,
  currency: "RSD",
  reference: "TX-42",
  note: "",
  paidAt: "2026-10-06T10:00:00Z",
};

function Harness() {
  const [request, setRequest] = useState(null);
  return (
    <>
      <PayoutsTab ask={setRequest} />
      <ReasonDialog request={request} onClose={() => setRequest(null)} />
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getAdminPayouts.mockImplementation(async (params) =>
    params.status === "paid"
      ? { payouts: [paid], pagination: { page: 1, limit: 20, total: 1, hasNext: false } }
      : { due: [due], weeks: 12 },
  );
  markAdminPayoutPaid.mockResolvedValue({ id: "p2" });
  voidAdminPayout.mockResolvedValue({ id: "p1" });
});

describe("PayoutsTab", () => {
  it("records a payout with a required reference", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(await screen.findByRole("button", { name: t("admin:payouts.markPaid") }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: t("admin:payouts.confirm") });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText(t("admin:payouts.reference")), " TX-99 ");
    await user.type(within(dialog).getByLabelText(t("admin:payouts.note")), "Bank transfer");
    await user.click(confirm);

    await waitFor(() => expect(markAdminPayoutPaid).toHaveBeenCalled());
    expect(markAdminPayoutPaid.mock.calls[0][0]).toEqual({
      restaurantId: "r1",
      weekStart: "2026-10-05",
      reference: "TX-99",
      note: "Bank transfer",
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("voids a recorded payout only with a reason", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(await screen.findByRole("button", { name: t("admin:payouts.paid") }));
    await user.click(await screen.findByRole("button", { name: t("admin:payouts.void") }));

    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: t("admin:reason.confirm") });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(t("admin:reason.label")), "Bounced");
    await user.click(confirm);

    await waitFor(() => expect(voidAdminPayout).toHaveBeenCalled());
    expect(voidAdminPayout.mock.calls[0][0]).toEqual({ id: "p1", reason: "Bounced" });
  });
});
