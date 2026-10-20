import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@chowgo/shared/i18n";
import { formatTime } from "@chowgo/shared/format";

import { useSocket } from "@/contexts/SocketContext";
import { useGlobalSocketEvents } from "@/hooks/Sockets/useGlobalSocketEvents";
import { getRestaurantStatus, setRestaurantStatus } from "@/services/apiRestaurantStatus";
import { useAuthStore } from "@/store/useAuthStore";
import { ConfirmOrderDialog } from "@/components/Seller/Orders/ConfirmOrderDialog";
import { createFakeSocket, renderWithProviders } from "@/test/utils";
import { RestaurantStatusBanner } from "./RestaurantStatusBanner";
import { RestaurantStatusControl } from "./RestaurantStatusControl";

vi.mock("@/services/apiRestaurantStatus", () => ({ getRestaurantStatus: vi.fn(), setRestaurantStatus: vi.fn() }));
vi.mock("@/contexts/SocketContext", () => ({ useSocket: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const inMinutes = (m) => new Date(Date.now() + m * 60000).toISOString();
const base = { isActive: true, isOpenNow: true, scheduleOpen: true, closure: null, pause: null, busy: null, timeZone: "Europe/Belgrade" };
const open = base;
const paused = (m = 30) => ({ ...base, isOpenNow: false, pause: { until: inMinutes(m), indefinite: false, reason: "", since: inMinutes(0) } });
const busy = (extraMinutes = 15) => ({ ...base, busy: { extraMinutes, until: inMinutes(60), since: inMinutes(0) } });

const label = () => screen.getByTestId("restaurant-status-label");
const openButton = async () => (await screen.findByTestId("restaurant-status-label")).closest("button");
const pauseSection = () => within(screen.getByRole("region", { name: t("seller:status.pauseSheet.title") }));
const busySection = () => within(screen.getByRole("region", { name: t("seller:status.busySheet.title") }));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ authUser: { _id: "u1", role: "seller", restaurant: [{ _id: "r1" }] } });
  vi.mocked(useSocket).mockReturnValue({ socket: null, isConnected: false, connectionEpoch: 0, register: vi.fn() });
  setRestaurantStatus.mockImplementation(async (body) => {
    if (body.action === "pause") return paused(body.minutes ?? 30);
    if (body.action === "busy") return busy(body.extraMinutes);
    return open;
  });
});

describe("RestaurantStatusControl pill", () => {
  it.each([
    ["open", () => open, () => t("seller:status.open")],
    ["busy", () => busy(15), (s) => t("seller:status.web.pillBusy", { minutes: 15, time: formatTime(s.busy.until) })],
    ["paused", () => paused(30), (s) => t("seller:status.pausedUntil", { time: formatTime(s.pause.until) })],
    ["paused indefinitely", () => ({ ...base, pause: { until: null, indefinite: true, reason: "" } }), () => t("seller:status.pausedIndefinite")],
    ["outside hours", () => ({ ...base, scheduleOpen: false }), () => t("seller:status.closedHours")],
    ["holiday", () => ({ ...base, scheduleOpen: false, closure: { from: "2026-12-24", to: "2026-12-26", reason: "" } }), () => t("seller:status.closedHoliday")],
    ["inactive", () => ({ ...base, isActive: false }), () => t("seller:status.inactive")],
  ])("shows %s", async (_name, make, expected) => {
    const status = make();
    getRestaurantStatus.mockResolvedValue(status);
    renderWithProviders(<RestaurantStatusControl />);
    await waitFor(() => expect(label()).toHaveTextContent(expected(status)));
  });

  it("treats a pause whose time has passed as over", async () => {
    getRestaurantStatus.mockResolvedValue({ ...base, pause: { until: inMinutes(-1), indefinite: false, reason: "" } });
    renderWithProviders(<RestaurantStatusControl />);
    await waitFor(() => expect(label()).toHaveTextContent(t("seller:status.open")));
  });
});

describe("RestaurantStatusControl actions", () => {
  it("pauses for 30 minutes with a reason", async () => {
    const user = userEvent.setup();
    getRestaurantStatus.mockResolvedValue(open);
    renderWithProviders(<RestaurantStatusControl />);
    await user.click(await openButton());

    await user.click(pauseSection().getByRole("button", { name: t("common:units.minutes", { value: 30 }) }));
    await user.type(screen.getByLabelText(t("seller:status.pauseSheet.reason")), "  Oven broke ");
    await user.click(screen.getByRole("button", { name: t("seller:status.pauseSheet.confirm") }));

    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalled());
    expect(setRestaurantStatus.mock.calls[0][0]).toEqual({ action: "pause", minutes: 30, reason: "Oven broke" });
    await screen.findByRole("button", { name: t("seller:status.actions.resume") });
    expect(label().textContent).toMatch(/Paused/);
  });

  it("pauses until resumed without a reason", async () => {
    const user = userEvent.setup();
    getRestaurantStatus.mockResolvedValue(open);
    renderWithProviders(<RestaurantStatusControl />);
    await user.click(await openButton());

    await user.click(screen.getByRole("button", { name: t("seller:status.pauseSheet.indefinite") }));
    await user.click(screen.getByRole("button", { name: t("seller:status.pauseSheet.confirm") }));

    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalledWith({ action: "pause", until: "indefinite" }));
  });

  it("resumes a paused restaurant", async () => {
    const user = userEvent.setup();
    getRestaurantStatus.mockResolvedValue(paused(45));
    renderWithProviders(<RestaurantStatusControl />);
    await user.click(await openButton());

    await user.click(screen.getByRole("button", { name: t("seller:status.actions.resume") }));

    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalledWith({ action: "resume" }));
    await waitFor(() => expect(label()).toHaveTextContent(t("seller:status.open")));
  });

  it("starts busy mode with the chosen extra minutes and duration", async () => {
    const user = userEvent.setup();
    getRestaurantStatus.mockResolvedValue(open);
    renderWithProviders(<RestaurantStatusControl />);
    await user.click(await openButton());

    await user.click(screen.getByRole("button", { name: t("seller:status.busySheet.extraOption", { value: 20 }) }));
    await user.click(busySection().getByRole("button", { name: t("common:units.minutes", { value: 120 }) }));
    await user.click(screen.getByRole("button", { name: t("seller:status.busySheet.confirm") }));

    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalledWith({ action: "busy", extraMinutes: 20, minutes: 120 }));
    await screen.findByRole("button", { name: t("seller:status.actions.normal") });
  });
});

describe("realtime", () => {
  function SellerShell() {
    useGlobalSocketEvents();
    return <RestaurantStatusControl />;
  }

  it("a restaurant:status event from another device updates the pill", async () => {
    const socket = createFakeSocket();
    vi.mocked(useSocket).mockReturnValue({ socket, isConnected: true, connectionEpoch: 1, register: vi.fn() });
    getRestaurantStatus.mockResolvedValue(open);
    renderWithProviders(<SellerShell />);
    await waitFor(() => expect(label()).toHaveTextContent(t("seller:status.open")));

    act(() => socket.emit("restaurant:status", { restaurantId: "r1", status: { ...base, pause: { until: null, indefinite: true, reason: "" } } }));

    await waitFor(() => expect(label()).toHaveTextContent(t("seller:status.pausedIndefinite")));
    expect(getRestaurantStatus).toHaveBeenCalledTimes(1);
  });
});

describe("RestaurantStatusBanner", () => {
  it("offers back to normal while busy", async () => {
    const user = userEvent.setup();
    getRestaurantStatus.mockResolvedValue(busy(20));
    renderWithProviders(<RestaurantStatusBanner />);

    expect(await screen.findByText(t("seller:status.web.bannerBusy", { minutes: 20 }))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t("seller:status.actions.normal") }));
    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalledWith({ action: "normal" }));
  });

  it("renders nothing when open", async () => {
    getRestaurantStatus.mockResolvedValue(open);
    const { container } = renderWithProviders(<RestaurantStatusBanner />);
    await waitFor(() => expect(getRestaurantStatus).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ConfirmOrderDialog", () => {
  it("defaults the prep time to 30 plus the busy minutes", async () => {
    getRestaurantStatus.mockResolvedValue(busy(15));
    renderWithProviders(<ConfirmOrderDialog isOpen onClose={vi.fn()} onConfirm={vi.fn()} isConfirming={false} />);
    await waitFor(() => expect(screen.getByLabelText(t("seller:orders.prepTimeLabel"))).toHaveValue(45));
  });

  it("keeps 30 minutes when not busy", async () => {
    getRestaurantStatus.mockResolvedValue(open);
    renderWithProviders(<ConfirmOrderDialog isOpen onClose={vi.fn()} onConfirm={vi.fn()} isConfirming={false} />);
    await waitFor(() => expect(getRestaurantStatus).toHaveBeenCalled());
    expect(screen.getByLabelText(t("seller:orders.prepTimeLabel"))).toHaveValue(30);
  });
});
