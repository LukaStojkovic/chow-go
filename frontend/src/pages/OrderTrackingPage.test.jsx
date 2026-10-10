import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatTime } from "@chowgo/shared/format";
import { useGetOrderById } from "@/hooks/Orders/useGetOrderById";
import { renderWithProviders } from "@/test/utils";
import OrderTrackingPage from "./OrderTrackingPage";

vi.mock("@/hooks/Orders/useGetOrderById", () => ({ useGetOrderById: vi.fn() }));
vi.mock("@/hooks/Orders/useCancelOrder", () => ({
  useCancelOrder: () => ({ cancelOrder: vi.fn(), isCancelling: false }),
}));
vi.mock("@/hooks/Orders/useReorder", () => ({
  useReorder: () => ({ reorder: vi.fn(), isReordering: false, conflict: null }),
}));
vi.mock("@/contexts/SocketContext", () => ({ useSocket: () => ({ socket: null, isConnected: false }) }));
vi.mock("@/components/OrderTracking/OrderTrackingLiveMap", () => ({ OrderTrackingLiveMap: () => null }));

const NOW = new Date(2026, 9, 9, 10, 0);
const SLOT = new Date(2026, 9, 10, 19, 30);

function renderOrder(overrides) {
  useGetOrderById.mockReturnValue({
    order: {
      _id: "o1",
      orderNumber: "1042",
      status: "scheduled",
      createdAt: NOW.toISOString(),
      scheduledFor: SLOT.toISOString(),
      estimatedDeliveryTime: SLOT.toISOString(),
      releaseAt: new Date(SLOT.getTime() - 50 * 60000).toISOString(),
      items: [],
      currency: "RSD",
      ...overrides,
    },
    isLoadingOrder: false,
    error: null,
    refetch: vi.fn(),
  });
  renderWithProviders(<OrderTrackingPage />);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OrderTrackingPage for a scheduled order", () => {
  it("shows the booked time instead of an arrival estimate, and offers cancel", () => {
    renderOrder();

    expect(screen.getByText("Scheduled for")).toBeInTheDocument();
    expect(screen.getByText(`Tomorrow, ${formatTime(SLOT)}`)).toBeInTheDocument();
    expect(screen.getByText(/about 50 minutes before/)).toBeInTheDocument();
    expect(screen.queryByText("Estimated arrival")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeInTheDocument();
  });

  it("goes back to the arrival estimate once released to the kitchen", () => {
    renderOrder({ status: "pending" });
    expect(screen.queryByText("Scheduled for")).not.toBeInTheDocument();
    expect(screen.getByText("Estimated arrival")).toBeInTheDocument();
  });
});
