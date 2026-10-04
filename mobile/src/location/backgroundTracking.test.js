import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { setToken } from "@/lib/secureToken";
import { COURIER_LOCATION_TASK, startBackgroundTracking, stopBackgroundTracking } from "./backgroundTracking";

const ORDER_KEY = "chowgo:tracking-order";
const runTask = (payload) => TaskManager.__tasks.get(COURIER_LOCATION_TASK)(payload);
const fix = (latitude, longitude) => ({ coords: { latitude, longitude } });
const respond = (status, body) => ({ status, json: async () => body });

beforeEach(() => {
  jest.clearAllMocks();
  Location.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
  global.fetch = jest.fn();
});

describe("startBackgroundTracking", () => {
  it("needs foreground and background permission", async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: "denied" });
    await expect(startBackgroundTracking("o1")).resolves.toBe(false);
    expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();

    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    Location.requestBackgroundPermissionsAsync.mockResolvedValue({ status: "denied" });
    await expect(startBackgroundTracking("o1")).resolves.toBe(false);
    expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it("remembers the order and starts a battery-friendly foreground service", async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    Location.requestBackgroundPermissionsAsync.mockResolvedValue({ status: "granted" });

    await expect(startBackgroundTracking("o1")).resolves.toBe(true);
    await expect(AsyncStorage.getItem(ORDER_KEY)).resolves.toBe("o1");
    expect(Location.startLocationUpdatesAsync).toHaveBeenCalledWith(
      COURIER_LOCATION_TASK,
      expect.objectContaining({
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25,
        foregroundService: expect.objectContaining({ killServiceOnDestroy: false }),
      }),
    );
  });

  it("does not start twice", async () => {
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    Location.requestBackgroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    Location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    await expect(startBackgroundTracking("o2")).resolves.toBe(true);
    expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(ORDER_KEY)).resolves.toBe("o2");
  });
});

describe("stopBackgroundTracking", () => {
  it("forgets the order and stops updates only if running", async () => {
    await AsyncStorage.setItem(ORDER_KEY, "o1");
    await stopBackgroundTracking();
    expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(ORDER_KEY)).resolves.toBeNull();

    Location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    await stopBackgroundTracking();
    expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledWith(COURIER_LOCATION_TASK);
  });

  it("never throws", async () => {
    Location.hasStartedLocationUpdatesAsync.mockRejectedValue(new Error("gone"));
    await expect(stopBackgroundTracking()).resolves.toBeUndefined();
  });
});

describe("background task", () => {
  it("posts the latest fix as GeoJSON with the order and bearer token", async () => {
    await setToken("jwt-1");
    await AsyncStorage.setItem(ORDER_KEY, "o1");
    fetch.mockResolvedValue(respond(200, { data: { tracking: true } }));

    await runTask({ data: { locations: [fix(1, 1), fix(44.81, 20.46)] } });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/courier\/location$/);
    expect(init.headers).toMatchObject({ Authorization: "Bearer jwt-1", "X-Client": "mobile" });
    expect(JSON.parse(init.body)).toEqual({ coordinates: [20.46, 44.81], orderId: "o1" });
    expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it("ignores errors and empty batches", async () => {
    await runTask({ error: new Error("denied") });
    await runTask({ data: { locations: [] } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["signed out", null, null],
    ["a 401", "jwt-1", respond(401, {})],
    ["tracking: false", "jwt-1", respond(200, { data: { tracking: false } })],
  ])("stops itself when %s", async (_label, token, response) => {
    if (token) await setToken(token);
    Location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    if (response) fetch.mockResolvedValue(response);

    await runTask({ data: { locations: [fix(44.8, 20.4)] } });
    expect(Location.stopLocationUpdatesAsync).toHaveBeenCalled();
  });

  it("keeps running through a network failure", async () => {
    await setToken("jwt-1");
    fetch.mockRejectedValue(new Error("offline"));
    await expect(runTask({ data: { locations: [fix(44.8, 20.4)] } })).resolves.toBeUndefined();
    expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});
