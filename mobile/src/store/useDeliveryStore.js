import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Persisted so a returning user lands straight on their feed instead of the
// location prompt. Same storage key as the web for parity.
export const useDeliveryStore = create(
  persist(
    (set) => ({
      address: null,
      coordinates: null,
      selectedDeliveryAddress: null,

      setLocation: ({ address, coordinates }) => set({ address, coordinates }),
      clearLocation: () => set({ address: null, coordinates: null }),
      setSelectedDeliveryAddress: (selectedDeliveryAddress) => set({ selectedDeliveryAddress }),
    }),
    { name: "delivery-location", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
