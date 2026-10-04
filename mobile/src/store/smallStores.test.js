import AsyncStorage from "@react-native-async-storage/async-storage";

import { useDeliveryStore } from "./useDeliveryStore";
import { toast, useToastStore } from "./useToastStore";

describe("toast store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });
  afterEach(() => jest.useRealTimers());

  it("queues toasts with sonner's signature and auto-dismisses them", () => {
    toast.success("Saved");
    toast.error("Failed", { description: "Try again", duration: 8000 });
    expect(useToastStore.getState().toasts.map(({ tone, title }) => [tone, title])).toEqual([
      ["success", "Saved"],
      ["error", "Failed"],
    ]);

    jest.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts.map((t) => t.title)).toEqual(["Failed"]);
    jest.advanceTimersByTime(4000);
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("dismisses one toast by id", () => {
    const id = toast.info("One");
    toast.warning("Two");
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts.map((t) => t.title)).toEqual(["Two"]);
  });
});

describe("delivery store", () => {
  it("persists the location under the web's storage key", async () => {
    useDeliveryStore.getState().setLocation({ address: "Knez Mihailova 1", coordinates: [44.8, 20.4] });
    useDeliveryStore.getState().setSelectedDeliveryAddress({ _id: "a1" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const stored = JSON.parse(await AsyncStorage.getItem("delivery-location")).state;
    expect(stored).toEqual({ address: "Knez Mihailova 1", coordinates: [44.8, 20.4], selectedDeliveryAddress: { _id: "a1" } });

    useDeliveryStore.getState().clearLocation();
    expect(useDeliveryStore.getState()).toMatchObject({ address: null, coordinates: null });
  });
});
