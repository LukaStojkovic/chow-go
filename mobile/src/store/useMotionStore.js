import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccessibilityInfo } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Mirrors the web's three-state model. Default is "full" there deliberately -
// the OS flag is honoured only when the user has not chosen for themselves.
export const useMotionStore = create(
  persist(
    (set, get) => ({
      preference: "system",
      systemReduced: false,
      isReduced: false,

      setPreference: (preference) =>
        set({ preference, isReduced: resolve(preference, get().systemReduced) }),

      syncSystem: (systemReduced) =>
        set({ systemReduced, isReduced: resolve(get().preference, systemReduced) }),
    }),
    {
      name: "motion",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ preference: state.preference }),
    },
  ),
);

function resolve(preference, systemReduced) {
  if (preference === "reduced") return true;
  if (preference === "full") return false;
  return systemReduced;
}

export function watchReduceMotion() {
  AccessibilityInfo.isReduceMotionEnabled().then((enabled) =>
    useMotionStore.getState().syncSystem(enabled),
  );
  return AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) =>
    useMotionStore.getState().syncSystem(enabled),
  );
}
