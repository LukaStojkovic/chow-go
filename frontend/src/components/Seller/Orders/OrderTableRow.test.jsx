import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { formatTime } from "@chowgo/shared/format";
import { renderWithProviders } from "@/test/utils";
import { OrderTableRow } from "./OrderTableRow";

const SLOT = new Date(2026, 9, 12, 19, 30);

function renderRow(status) {
  const handlers = {
    onConfirm: vi.fn(),
    onReject: vi.fn(),
    onCancel: vi.fn(),
    onMarkPreparing: vi.fn(),
    onMarkReady: vi.fn(),
  };
  renderWithProviders(
    <table>
      <tbody>
        <OrderTableRow
          order={{
            _id: "o1",
            orderNumber: "1042",
            status,
            scheduledFor: SLOT.toISOString(),
            createdAt: new Date(2026, 9, 9, 10, 0).toISOString(),
            customer: { name: "Ana" },
            items: [{ name: "Burger", quantity: 1 }],
            total: 1300,
            currency: "RSD",
          }}
          {...handlers}
        />
      </tbody>
    </table>,
  );
  return { handlers, user: userEvent.setup() };
}

describe("OrderTableRow for a scheduled order", () => {
  it("shows the booked time and offers only Decline", async () => {
    const { handlers, user } = renderRow("scheduled");

    expect(screen.getByText("SCHEDULED")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Scheduled for .*${formatTime(SLOT)}`))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Decline"]);

    await user.click(items[0]);
    expect(handlers.onReject).toHaveBeenCalledWith("o1");
    expect(handlers.onConfirm).not.toHaveBeenCalled();
  });

  it("still offers Accept once the order is released as pending", async () => {
    const { user } = renderRow("pending");
    expect(screen.queryByText(/Scheduled for/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(await screen.findByRole("menuitem", { name: "Accept" })).toBeInTheDocument();
  });
});
