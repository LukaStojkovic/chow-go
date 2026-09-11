import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applyPreference } from "@/theme/scheme";

export const useThemeStore = create(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => AsyncStorage),
      // The splash is held until this lands, so applying the scheme here rather
      // than in a mount effect means the first frame is already in the right
      // theme instead of flipping one render later.
      onRehydrateStorage: () => (state) => applyPreference(state?.preference ?? "system"),
    },
  ),
);
