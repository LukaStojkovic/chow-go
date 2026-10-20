import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";

const READERS = {
  foreground: () => Location.getForegroundPermissionsAsync(),
  background: () => Location.getBackgroundPermissionsAsync(),
};

export function isPermissionBlocked(permission) {
  return Boolean(permission) && permission.status !== "granted" && permission.canAskAgain === false;
}

export function useLocationPermission(kind = "foreground", { enabled = true } = {}) {
  const [permission, setPermission] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const next = await READERS[kind]();
      if (next) setPermission(next);
      return next ?? null;
    } catch {
      return null;
    }
  }, [kind]);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [enabled, refresh]);

  return {
    status: permission?.status ?? null,
    granted: permission?.status === "granted",
    blocked: isPermissionBlocked(permission),
    refresh,
    update: setPermission,
  };
}
