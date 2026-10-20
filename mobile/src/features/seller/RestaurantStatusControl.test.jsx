import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { t } from "@chowgo/shared/i18n";
import { formatTime } from "@chowgo/shared/format";

import { useSocket } from "@/realtime/SocketProvider";
import { useGlobalSocketEvents } from "@/realtime/useGlobalSocketEvents";
import { getRestaurantStatus, setRestaurantStatus } from "@/services/apiRestaurantStatus";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { createFakeSocket, createTestQueryClient, createWrapper } from "@/test/utils";
import { RestaurantStatusCard, RestaurantStatusChip } from "./RestaurantStatusControl";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("@/components/ui/Dialog", () => {
  const { View } = require("react-native");
  const { Text } = require("@/components/ui/Text");
  return {
    Sheet: ({ visible, title, children }) =>
      visible ? (
        <View>
          <Text>{title}</Text>
          {children}
        </View>
      ) : null,
    SheetActions: ({ children }) => <View>{children}</View>,
  };
});
jest.mock("@/store/useToastStore", () => ({
  __esModule: true,
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}));
jest.mock("@/services/apiRestaurantStatus", () => ({
  __esModule: true,
  getRestaurantStatus: jest.fn(),
  setRestaurantStatus: jest.fn(),
}));
jest.mock("@/realtime/SocketProvider", () => ({ useSocket: jest.fn() }));
jest.mock("@/location/backgroundTracking", () => ({ stopBackgroundTracking: jest.fn() }));

const S = (key, options) => t(`seller:status.${key}`, options);
const inMinutes = (minutes) => new Date(Date.now() + minutes * 60000).toISOString();

const base = {
  isActive: true,
  isOpenNow: true,
  scheduleOpen: true,
  closure: null,
  pause: null,
  busy: null,
  timeZone: "Europe/Belgrade",
};
const paused = (until) => ({
  ...base,
  isOpenNow: false,
  pause: { until, indefinite: false, reason: "", since: new Date().toISOString() },
});
const busy = (extraMinutes, until) => ({ ...base, busy: { extraMinutes, until, since: null } });

let queryClient;
let socket;

function Harness({ children }) {
  useGlobalSocketEvents();
  return children;
}

async function renderCard(element = <RestaurantStatusCard />) {
  const Wrapper = createWrapper(queryClient);
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Wrapper>
        <Harness>{element}</Harness>
      </Wrapper>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = createTestQueryClient();
  socket = createFakeSocket();
  useSocket.mockReturnValue({ socket, isConnected: true, connectionEpoch: 1, register: jest.fn() });
  useAuthStore.setState({
    authUser: { _id: "u1", role: "seller", restaurant: [{ _id: "r1" }] },
    checkAuth: jest.fn(),
  });
});

describe("RestaurantStatusCard", () => {
  it("shows an open restaurant with pause and busy actions", async () => {
    getRestaurantStatus.mockResolvedValue(base);
    await renderCard();
    expect(await screen.findByText(S("open"))).toBeTruthy();
    expect(screen.getByText(S("actions.pause"))).toBeTruthy();
    expect(screen.getByText(S("actions.busy"))).toBeTruthy();
  });

  it("shows when a pause ends and offers to resume", async () => {
    const until = inMinutes(45);
    getRestaurantStatus.mockResolvedValue(paused(until));
    await renderCard();
    expect(await screen.findByText(S("pausedUntil", { time: formatTime(until) }))).toBeTruthy();
    expect(screen.getByText(S("actions.resume"))).toBeTruthy();
    expect(screen.queryByText(S("actions.pause"))).toBeNull();
  });

  it("shows an indefinite pause", async () => {
    getRestaurantStatus.mockResolvedValue({ ...base, pause: { until: null, indefinite: true, reason: "Broken oven" } });
    await renderCard();
    expect(await screen.findByText(S("pausedIndefinite"))).toBeTruthy();
    expect(screen.getByText("Broken oven")).toBeTruthy();
  });

  it("shows busy mode with its extra minutes", async () => {
    const until = inMinutes(60);
    getRestaurantStatus.mockResolvedValue(busy(20, until));
    await renderCard();
    expect(await screen.findByText(S("busy", { minutes: 20 }))).toBeTruthy();
    expect(screen.getByText(S("busyUntil", { time: formatTime(until) }))).toBeTruthy();
    expect(screen.getByText(S("actions.normal"))).toBeTruthy();
  });

  it("treats a pause that has already ended as open", async () => {
    getRestaurantStatus.mockResolvedValue(paused(inMinutes(-1)));
    await renderCard();
    expect(await screen.findByText(S("open"))).toBeTruthy();
  });

  it("pauses for 30 minutes", async () => {
    getRestaurantStatus.mockResolvedValue(base);
    setRestaurantStatus.mockResolvedValue(paused(inMinutes(30)));
    await renderCard();
    await fireEvent.press(await screen.findByText(S("actions.pause")));
    expect(screen.getByText(S("pauseSheet.title"))).toBeTruthy();
    await fireEvent.press(screen.getByText(t("common:units.minutes", { value: 30 })));
    await fireEvent.press(screen.getAllByText(S("pauseSheet.confirm")).at(-1));
    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalled());
    expect(setRestaurantStatus.mock.calls[0][0]).toEqual({ action: "pause", minutes: 30 });
    expect(toast.success).toHaveBeenCalledWith(S("toast.paused"));
    expect(await screen.findByText(S("actions.resume"))).toBeTruthy();
  });

  it("pauses until resumed with a reason", async () => {
    getRestaurantStatus.mockResolvedValue(base);
    setRestaurantStatus.mockResolvedValue({ ...base, pause: { until: null, indefinite: true, reason: "Short staffed" } });
    await renderCard();
    await fireEvent.press(await screen.findByText(S("actions.pause")));
    await fireEvent.press(screen.getByText(S("pauseSheet.indefinite")));
    await fireEvent.changeText(screen.getByPlaceholderText(S("pauseSheet.reasonPlaceholder")), "  Short staffed ");
    await fireEvent.press(screen.getAllByText(S("pauseSheet.confirm")).at(-1));
    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalled());
    expect(setRestaurantStatus.mock.calls[0][0]).toEqual({
      action: "pause",
      until: "indefinite",
      reason: "Short staffed",
    });
  });

  it("resumes a paused restaurant", async () => {
    getRestaurantStatus.mockResolvedValue(paused(inMinutes(30)));
    setRestaurantStatus.mockResolvedValue(base);
    await renderCard();
    await fireEvent.press(await screen.findByText(S("actions.resume")));
    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalled());
    expect(setRestaurantStatus.mock.calls[0][0]).toEqual({ action: "resume" });
    expect(await screen.findByText(S("open"))).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith(S("toast.resumed"));
  });

  it("starts busy mode with extra minutes and a duration", async () => {
    getRestaurantStatus.mockResolvedValue(base);
    setRestaurantStatus.mockResolvedValue(busy(20, inMinutes(120)));
    await renderCard();
    await fireEvent.press(await screen.findByText(S("actions.busy")));
    await fireEvent.press(screen.getByText(S("busySheet.extraOption", { value: 20 })));
    await fireEvent.press(screen.getByText(S("hours", { count: 2 })));
    await fireEvent.press(screen.getByText(S("busySheet.confirm")));
    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalled());
    expect(setRestaurantStatus.mock.calls[0][0]).toEqual({ action: "busy", extraMinutes: 20, minutes: 120 });
    expect(await screen.findByText(S("busy", { minutes: 20 }))).toBeTruthy();
  });

  it("goes back to normal from busy", async () => {
    getRestaurantStatus.mockResolvedValue(busy(15, inMinutes(30)));
    setRestaurantStatus.mockResolvedValue(base);
    await renderCard();
    await fireEvent.press(await screen.findByText(S("actions.normal")));
    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalled());
    expect(setRestaurantStatus.mock.calls[0][0]).toEqual({ action: "normal" });
  });

  it("toasts a failed update", async () => {
    getRestaurantStatus.mockResolvedValue(paused(inMinutes(30)));
    setRestaurantStatus.mockRejectedValue(new Error("boom"));
    await renderCard();
    await fireEvent.press(await screen.findByText(S("actions.resume")));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error.mock.calls[0][0]).toBe(S("toast.failed"));
  });

  it("updates from a restaurant:status event sent by another device", async () => {
    getRestaurantStatus.mockResolvedValue(base);
    await renderCard();
    expect(await screen.findByText(S("open"))).toBeTruthy();
    await act(() => socket.emit("restaurant:status", { restaurantId: "r1", status: busy(30, inMinutes(60)) }));
    expect(await screen.findByText(S("busy", { minutes: 30 }))).toBeTruthy();
    expect(getRestaurantStatus).toHaveBeenCalledTimes(1);
  });
});

describe("RestaurantStatusChip", () => {
  it("opens the status sheet with the same actions", async () => {
    getRestaurantStatus.mockResolvedValue(paused(inMinutes(30)));
    setRestaurantStatus.mockResolvedValue(base);
    await renderCard(<RestaurantStatusChip />);
    await fireEvent.press(await screen.findByText(S("chip.paused")));
    await fireEvent.press(screen.getByText(S("actions.resume")));
    await waitFor(() => expect(setRestaurantStatus).toHaveBeenCalled());
    expect(setRestaurantStatus.mock.calls[0][0]).toEqual({ action: "resume" });
  });
});
