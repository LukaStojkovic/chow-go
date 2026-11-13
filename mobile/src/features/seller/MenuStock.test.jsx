import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { t } from "@chowgo/shared/i18n";
import * as Haptics from "expo-haptics";

import { useSocket } from "@/realtime/SocketProvider";
import { useGlobalSocketEvents } from "@/realtime/useGlobalSocketEvents";
import { getMenuItems, setMenuItemStock } from "@/services/apiRestaurant";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { axiosError, createFakeSocket, createTestQueryClient, createWrapper } from "@/test/utils";
import SellerMenu from "../../../app/(seller)/(tabs)/menu";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("@shopify/flash-list", () => {
  const { View } = require("react-native");
  return {
    FlashList: ({ data, renderItem, keyExtractor, ListEmptyComponent }) => (
      <View>
        {data?.length
          ? data.map((item, index) => <View key={keyExtractor(item)}>{renderItem({ item, index })}</View>)
          : ListEmptyComponent}
      </View>
    ),
  };
});
jest.mock("@/components/ui/Dialog", () => {
  const { View } = require("react-native");
  const { Text } = require("@/components/ui/Text");
  return {
    Sheet: ({ visible, title, description, children }) =>
      visible ? (
        <View>
          <Text>{title}</Text>
          {description ? <Text>{description}</Text> : null}
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
jest.mock("@/services/apiRestaurant", () => ({
  __esModule: true,
  getMenuItems: jest.fn(),
  setMenuItemStock: jest.fn(),
}));
jest.mock("@/realtime/SocketProvider", () => ({ useSocket: jest.fn() }));
jest.mock("@/location/backgroundTracking", () => ({ stopBackgroundTracking: jest.fn() }));

const S = (key, options) => t(`seller:stock.${key}`, options);

const burger = {
  _id: "m1",
  name: "Burger",
  category: "Burgers",
  price: 900,
  available: true,
  imageUrls: [],
  optionGroups: [
    {
      _id: "g1",
      name: "Extras",
      options: [
        { _id: "o1", name: "Bacon", priceDelta: 100, available: true },
        { _id: "o2", name: "Cheese", priceDelta: 80, available: false, soldOutUntil: null },
      ],
    },
  ],
};
const soup = {
  _id: "m2",
  name: "Soup",
  category: "Soups",
  price: 400,
  available: false,
  soldOutUntil: new Date(Date.now() + 3600000).toISOString(),
  imageUrls: [],
};

let menu;
let queryClient;
let socket;

const page = (menuItems) => ({
  menuItems,
  pagination: { currentPage: 1, totalItems: menuItems.length, hasNext: false },
});

function Harness({ children }) {
  useGlobalSocketEvents();
  return children;
}

async function renderMenu() {
  const Wrapper = createWrapper(queryClient);
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Wrapper>
        <Harness>
          <SellerMenu />
        </Harness>
      </Wrapper>
    </SafeAreaProvider>,
  );
  await screen.findByText("Burger");
}

const switchFor = (name) => screen.getByLabelText(S("switchLabel", { name }));

beforeEach(() => {
  jest.clearAllMocks();
  menu = [burger, soup];
  queryClient = createTestQueryClient();
  socket = createFakeSocket();
  useSocket.mockReturnValue({ socket, isConnected: true, connectionEpoch: 1, register: jest.fn() });
  useAuthStore.setState({
    authUser: { _id: "u1", role: "seller", restaurant: [{ _id: "r1" }] },
    checkAuth: jest.fn(),
  });
  getMenuItems.mockImplementation(async (_restaurantId, filters = {}) => {
    if (filters.available === "false") return page(menu.filter((item) => item.available === false));
    if (filters.available === "true") return page(menu.filter((item) => item.available !== false));
    return page(menu);
  });
});

describe("seller menu stock", () => {
  it("shows a timed sell-out as sold out until tomorrow, with its options count", async () => {
    await renderMenu();
    expect(screen.getByText(`${S("soldOut")} · ${S("backTomorrow")}`)).toBeTruthy();
    expect(switchFor("Soup").props.value).toBe(false);
    expect(switchFor("Burger").props.value).toBe(true);
    expect(screen.getByText(S("optionsSoldOut", { count: 1 }))).toBeTruthy();
  });

  it("asks how long when switched off, then marks it sold out for today", async () => {
    setMenuItemStock.mockResolvedValue({ ...burger, available: false });
    await renderMenu();
    await fireEvent(switchFor("Burger"), "valueChange", false);
    expect(screen.getByText(S("durationTitle"))).toBeTruthy();
    expect(setMenuItemStock).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText(S("markSoldOut")));
    await waitFor(() => expect(setMenuItemStock).toHaveBeenCalled());
    expect(setMenuItemStock).toHaveBeenCalledWith("r1", "m1", { available: false, until: "endOfDay" });
    await waitFor(() => expect(Haptics.selectionAsync).toHaveBeenCalled());
  });

  it("sends indefinite when chosen", async () => {
    setMenuItemStock.mockResolvedValue({ ...burger, available: false });
    await renderMenu();
    await fireEvent(switchFor("Burger"), "valueChange", false);
    await fireEvent.press(screen.getByText(S("indefinite")));
    await fireEvent.press(screen.getByText(S("markSoldOut")));
    await waitFor(() =>
      expect(setMenuItemStock).toHaveBeenCalledWith("r1", "m1", { available: false, until: "indefinite" }),
    );
  });

  it("switches a dish back on in one tap", async () => {
    setMenuItemStock.mockResolvedValue({ ...soup, available: true, soldOutUntil: null });
    await renderMenu();
    await fireEvent(switchFor("Soup"), "valueChange", true);
    await waitFor(() => expect(setMenuItemStock).toHaveBeenCalledWith("r1", "m2", { available: true }));
    expect(screen.queryByText(S("durationTitle"))).toBeNull();
  });

  it("shows the change at once and rolls it back with a toast when it fails", async () => {
    let reject;
    setMenuItemStock.mockImplementation(() => new Promise((_resolve, fail) => (reject = fail)));
    await renderMenu();
    getMenuItems.mockImplementation(() => new Promise(() => {}));
    await fireEvent(switchFor("Soup"), "valueChange", true);
    await waitFor(() => expect(switchFor("Soup").props.value).toBe(true));
    expect(switchFor("Soup").props.disabled).toBe(true);
    await act(async () => reject(axiosError(500, { message: "boom" })));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error.mock.calls[0][0]).toBe(S("failed"));
    expect(switchFor("Soup").props.value).toBe(false);
  });

  it("switches an option off with a duration and back on, sending its optionId", async () => {
    setMenuItemStock.mockResolvedValue(burger);
    await renderMenu();
    await fireEvent.press(screen.getByLabelText(S("optionsTitle", { name: "Burger" })));
    expect(screen.getByText("Extras")).toBeTruthy();

    await fireEvent(switchFor("Bacon"), "valueChange", false);
    expect(screen.getByText(S("durationTitle"))).toBeTruthy();
    await fireEvent.press(screen.getByText(S("markSoldOut")));
    await waitFor(() =>
      expect(setMenuItemStock).toHaveBeenCalledWith("r1", "m1", {
        available: false,
        until: "endOfDay",
        optionId: "o1",
      }),
    );

    expect(await screen.findByText("Extras")).toBeTruthy();
    await fireEvent(switchFor("Cheese"), "valueChange", true);
    await waitFor(() =>
      expect(setMenuItemStock).toHaveBeenCalledWith("r1", "m1", { available: true, optionId: "o2" }),
    );
  });

  it("filters to sold-out dishes and restocks them all in turn", async () => {
    const pasta = { _id: "m3", name: "Lasagne", category: "Pasta", price: 700, available: false, imageUrls: [] };
    menu = [burger, soup, pasta];
    setMenuItemStock.mockImplementation(async (_restaurantId, menuItemId, body) => {
      menu = menu.map((item) => (item._id === menuItemId ? { ...item, ...body, soldOutUntil: null } : item));
      return menu.find((item) => item._id === menuItemId);
    });
    await renderMenu();

    await fireEvent.press(await screen.findByText(`${S("filter")} (2)`));
    expect(await screen.findByText("Soup")).toBeTruthy();
    expect(screen.queryByText("Burger")).toBeNull();
    expect(screen.getByText("Lasagne")).toBeTruthy();

    await fireEvent.press(screen.getByText(S("restockAll")));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(S("restocked")));
    expect(setMenuItemStock.mock.calls.map((call) => [call[1], call[2]])).toEqual([
      ["m2", { available: true }],
      ["m3", { available: true }],
    ]);
  });

  it("refetches the menu on a menu:stock event from another device", async () => {
    await renderMenu();
    menu = [{ ...burger, available: false }, soup];
    const calls = getMenuItems.mock.calls.length;
    await act(() => socket.emit("menu:stock", { restaurantId: "r1", menuItemId: "m1", optionId: null }));
    await waitFor(() => expect(getMenuItems.mock.calls.length).toBeGreaterThan(calls));
    await waitFor(() => expect(switchFor("Burger").props.value).toBe(false));
  });
});
