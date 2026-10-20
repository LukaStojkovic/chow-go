import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import { AppState, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { t } from "@chowgo/shared/i18n";

import { startBackgroundTracking } from "@/location/backgroundTracking";
import { useCourierLocationBroadcast } from "@/location/useCourierLocationBroadcast";
import { reverseGeocode } from "@/services/apiLocation";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import { LocationGate } from "@/features/discover/LocationGate";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock("@/services/apiLocation", () => ({
  __esModule: true,
  reverseGeocode: jest.fn(),
  getLocationPredictions: jest.fn(async () => []),
}));
jest.mock("@/realtime/SocketProvider", () => ({
  __esModule: true,
  useSocket: () => ({ socket: null, isRegistered: false }),
}));
jest.mock("@/location/backgroundTracking", () => ({
  __esModule: true,
  startBackgroundTracking: jest.fn(async () => false),
}));

const BLOCKED = { status: "denied", canAskAgain: false };
const GRANTED = { status: "granted", canAskAgain: true };

let foreground;
function captureAppState() {
  foreground = [];
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, handler) => {
    foreground.push(handler);
    return { remove: jest.fn() };
  });
}
const returnToApp = () => act(async () => foreground.forEach((handler) => handler("active")));

async function renderGate() {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <LocationGate />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  captureAppState();
  useDeliveryStore.setState({ address: null, coordinates: null });
});

describe("location permission blocked", () => {
  it("explains and opens Settings when location can no longer be asked for", async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue(BLOCKED);
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();

    await renderGate();

    expect(await screen.findByText(t("common:locationAccess.blockedTitle"))).toBeOnTheScreen();
    await fireEvent.press(screen.getByText(t("common:locationAccess.openSettings")));
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it("shows the notice after a refused request without prompting again", async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: "undetermined", canAskAgain: true });
    Location.requestForegroundPermissionsAsync.mockResolvedValue(BLOCKED);

    await renderGate();
    expect(screen.queryByText(t("common:locationAccess.blockedTitle"))).toBeNull();

    await fireEvent.press(screen.getByText(t("profile:delivery.useCurrent")));
    expect(await screen.findByText(t("common:locationAccess.blockedTitle"))).toBeOnTheScreen();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("recovers when the app comes back with permission granted", async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue(BLOCKED);
    Location.requestForegroundPermissionsAsync.mockResolvedValue(GRANTED);
    Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 44.8, longitude: 20.46 } });
    reverseGeocode.mockResolvedValue({ address: "Knez Mihailova 1" });

    await renderGate();
    expect(await screen.findByText(t("common:locationAccess.blockedTitle"))).toBeOnTheScreen();

    Location.getForegroundPermissionsAsync.mockResolvedValue(GRANTED);
    await returnToApp();

    await waitFor(() => expect(screen.queryByText(t("common:locationAccess.blockedTitle"))).toBeNull());
    await waitFor(() =>
      expect(useDeliveryStore.getState().coordinates).toEqual({ lat: 44.8, lon: 20.46 }),
    );
  });
});

describe("courier tracking permission", () => {
  it("reports a blocked foreground permission and retries on return", async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue(BLOCKED);
    const { result } = await renderHook(() => useCourierLocationBroadcast("o1"));

    await waitFor(() => expect(result.current.isBlocked).toBe(true));
    expect(result.current.isDenied).toBe(true);

    Location.requestForegroundPermissionsAsync.mockResolvedValue(GRANTED);
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: "granted", canAskAgain: true });
    startBackgroundTracking.mockResolvedValue(true);
    await returnToApp();

    await waitFor(() => expect(result.current.isDenied).toBe(false));
    expect(result.current.isBackgroundDenied).toBe(false);
    expect(Location.watchPositionAsync).toHaveBeenCalled();
  });

  it("flags a missing \"Allow all the time\" and starts tracking once it is granted", async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValue(GRANTED);
    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: "denied", canAskAgain: false });
    startBackgroundTracking.mockResolvedValue(false);
    const { result } = await renderHook(() => useCourierLocationBroadcast("o1"));

    await waitFor(() => expect(result.current.isBackgroundDenied).toBe(true));

    await returnToApp();
    expect(startBackgroundTracking).toHaveBeenCalledTimes(1);

    Location.getBackgroundPermissionsAsync.mockResolvedValue({ status: "granted", canAskAgain: true });
    startBackgroundTracking.mockResolvedValue(true);
    await returnToApp();

    await waitFor(() => expect(result.current.isBackgroundDenied).toBe(false));
    expect(startBackgroundTracking).toHaveBeenLastCalledWith("o1");
  });
});
