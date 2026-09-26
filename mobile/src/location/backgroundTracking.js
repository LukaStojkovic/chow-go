import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/secureToken";

// Keeps the customer's live map moving while the courier's phone is locked or
// another app (navigation) is in front. The foreground watch in
// useCourierLocationBroadcast stopped the moment the delivery screen lost
// focus. The OS runs this task with no React tree and no socket - iOS suspends
// the socket soon after backgrounding - so it reports over HTTP.
//
// Imported for its side effect from app/_layout.jsx: the task must be defined
// at module load, or a background launch finds nothing to run.

export const COURIER_LOCATION_TASK = "chowgo-courier-location";
const ORDER_KEY = "chowgo:tracking-order";

TaskManager.defineTask(COURIER_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const latest = data?.locations?.at(-1);
  if (!latest) return;

  try {
    const [token, orderId] = await Promise.all([getToken(), AsyncStorage.getItem(ORDER_KEY)]);
    if (!token) {
      await stopBackgroundTracking();
      return;
    }

    const response = await fetch(`${API_URL}/courier/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client": "mobile",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        coordinates: [latest.coords.longitude, latest.coords.latitude],
        orderId: orderId ?? undefined,
      }),
    });

    // Signed out, or the server says there is no active delivery any more.
    if (response.status === 401) {
      await stopBackgroundTracking();
      return;
    }
    const body = await response.json().catch(() => null);
    if (body?.data?.tracking === false) await stopBackgroundTracking();
  } catch {
    // Offline for a moment: the next fix tries again.
  }
});

export async function startBackgroundTracking(orderId) {
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== "granted") return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") return false;

  await AsyncStorage.setItem(ORDER_KEY, String(orderId));
  if (await Location.hasStartedLocationUpdatesAsync(COURIER_LOCATION_TASK)) return true;

  await Location.startLocationUpdatesAsync(COURIER_LOCATION_TASK, {
    // Balanced and 25 m: a delivery lasts tens of minutes, and High accuracy
    // every 10 m drains a courier's battery over a shift.
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 25,
    timeInterval: 10000,
    activityType: Location.ActivityType.OtherNavigation,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Delivery in progress",
      notificationBody: "Sharing your location with the customer until the order is delivered.",
      killServiceOnDestroy: false,
    },
  });
  return true;
}

export async function stopBackgroundTracking() {
  await AsyncStorage.removeItem(ORDER_KEY).catch(() => {});
  try {
    if (await Location.hasStartedLocationUpdatesAsync(COURIER_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(COURIER_LOCATION_TASK);
    }
  } catch {
    // Not started, or the task was already gone.
  }
}
