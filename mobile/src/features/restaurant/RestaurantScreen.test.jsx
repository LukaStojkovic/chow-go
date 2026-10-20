import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getRestaurantInfo, getRestaurantMenu } from "@/services/apiRestaurant";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import RestaurantPage from "../../../app/(customer)/restaurant/[restaurantId]";

const mockList = { props: null, scrollToIndex: jest.fn(), offset: 0, layouts: {} };

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  router: { back: jest.fn(), push: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => ({ restaurantId: "r1" }),
}));
jest.mock("@/services/apiRestaurant", () => ({
  __esModule: true,
  getRestaurantInfo: jest.fn(),
  getRestaurantMenu: jest.fn(),
}));
jest.mock("@shopify/flash-list", () => {
  const { forwardRef, useImperativeHandle } = require("react");
  const { ScrollView, View } = require("react-native");
  return {
    FlashList: forwardRef(function FlashList(props, ref) {
      mockList.props = props;
      useImperativeHandle(ref, () => ({
        scrollToIndex: mockList.scrollToIndex,
        getAbsoluteLastScrollOffset: () => mockList.offset,
        getFirstItemOffset: () => 0,
        getLayout: (index) => mockList.layouts[index],
      }));
      const { data, renderItem, keyExtractor, ListHeaderComponent, ListEmptyComponent } = props;
      return (
        <ScrollView>
          {ListHeaderComponent}
          {data.length === 0
            ? ListEmptyComponent
            : data.map((item, index) => <View key={keyExtractor(item, index)}>{renderItem({ item, index })}</View>)}
        </ScrollView>
      );
    }),
  };
});

const restaurant = { _id: "r1", name: "Pekara", isActive: true, isOpenNow: true, currency: "RSD" };
const menu = [
  { category: "Breakfast", items: [{ _id: "m1", name: "Burek", price: 300 }, { _id: "m2", name: "Kifla", price: 80 }] },
  { category: "Drinks", items: [{ _id: "m3", name: "Jogurt", price: 120 }] },
];

async function renderScreen() {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <RestaurantPage />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
  await screen.findByText("Jogurt");
}

const selectedTab = () =>
  screen.getAllByRole("tab").find((tab) => tab.props.accessibilityState?.selected);

beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  mockList.offset = 0;
  mockList.layouts = {};
  getRestaurantInfo.mockResolvedValue(restaurant);
  getRestaurantMenu.mockResolvedValue(menu);
});

it("renders the menu as one flat list of section headers and dishes", async () => {
  await renderScreen();

  expect(mockList.props.data.map((row) => row.type)).toEqual(["header", "dish", "dish", "header", "dish"]);
  expect(mockList.props.getItemType(mockList.props.data[0])).toBe("header");
  expect(screen.getAllByRole("tab")).toHaveLength(2);
  expect(screen.getByText("Burek")).toBeOnTheScreen();
});

it("scrolls to a section's header when its tab is pressed, leaving room for the pinned bar", async () => {
  await renderScreen();

  await fireEvent.press(screen.getAllByRole("tab")[1]);

  expect(mockList.scrollToIndex).toHaveBeenCalledWith(
    expect.objectContaining({ index: 3, viewOffset: expect.any(Number) }),
  );
  expect(mockList.scrollToIndex.mock.calls[0][0].viewOffset).toBeLessThan(0);
  expect(selectedTab()).toHaveTextContent("Drinks");
});

it("moves the active tab to the section under the pinned bar as the menu scrolls", async () => {
  await renderScreen();
  expect(selectedTab()).toHaveTextContent("Breakfast");

  mockList.layouts = { 0: { y: 400 }, 3: { y: 900 } };
  mockList.offset = 900;
  await act(async () => {
    mockList.props.onViewableItemsChanged({ viewableItems: [], changed: [] });
  });
  expect(selectedTab()).toHaveTextContent("Drinks");

  mockList.offset = 300;
  await act(async () => {
    mockList.props.onViewableItemsChanged({ viewableItems: [], changed: [] });
  });
  expect(selectedTab()).toHaveTextContent("Breakfast");
});

it("falls back to the first visible row's section before layouts are known", async () => {
  await renderScreen();
  const drinksRow = mockList.props.data[4];

  await act(async () => {
    mockList.props.onViewableItemsChanged({ viewableItems: [{ item: drinksRow, index: 4 }], changed: [] });
  });

  expect(selectedTab()).toHaveTextContent("Drinks");
});

const allDay = Object.fromEntries(
  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => [
    day,
    { isOpen: true, openingTime: "00:00", closingTime: "00:00" },
  ]),
);

it("offers order ahead on the hero for a closed restaurant that takes pre-orders", async () => {
  getRestaurantInfo.mockResolvedValue({ ...restaurant, isOpenNow: false, schedule: allDay, timezone: "Europe/Belgrade" });
  await renderScreen();

  expect(screen.getByText("Closed now. Order ahead for later.")).toBeOnTheScreen();
  expect(screen.getByText("Order ahead")).toBeOnTheScreen();
});

it("explains why when a closed restaurant takes no pre-orders", async () => {
  getRestaurantInfo.mockResolvedValue({ ...restaurant, isOpenNow: false });
  await renderScreen();

  expect(screen.queryByText("Closed now. Order ahead for later.")).toBeNull();
  expect(screen.getByText("Closed now")).toBeOnTheScreen();
});
