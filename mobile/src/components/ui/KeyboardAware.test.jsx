import { render, screen, within } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { t } from "@chowgo/shared/i18n";

import { createTestQueryClient, createWrapper } from "@/test/utils";
import RateOrder from "../../../app/(customer)/order/[orderId]/rate";
import { DOCK_CLEARANCE } from "./KeyboardAware";

jest.mock("react-native-keyboard-controller", () => {
  const { forwardRef } = require("react");
  const { ScrollView, View } = require("react-native");
  const actual = require("react-native-keyboard-controller/jest");
  return {
    ...actual,
    KeyboardAwareScrollView: forwardRef(function KeyboardAwareScrollView(props, ref) {
      return <ScrollView ref={ref} testID="keyboard-aware-scroll" {...props} />;
    }),
    KeyboardStickyView: (props) => <View testID="keyboard-sticky" {...props} />,
  };
});
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ orderId: "o1" }),
}));
jest.mock("@/services/apiOrder", () => ({ __esModule: true, rateOrder: jest.fn() }));
jest.mock("@/hooks/Orders/useOrders", () => ({
  __esModule: true,
  useOrder: () => ({
    data: {
      _id: "o1",
      status: "delivered",
      restaurant: { _id: "r1", name: "Burger Bar" },
      courier: { _id: "c1", userId: { name: "Pera Peric" } },
      items: [],
    },
  }),
}));

it("keeps the rating form in a keyboard-aware scroll with the submit bar above the keys", async () => {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 34 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <RateOrder />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );

  const scroll = screen.getByTestId("keyboard-aware-scroll");
  expect(scroll.props.bottomOffset).toBe(DOCK_CLEARANCE);
  expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
  expect(within(scroll).getAllByPlaceholderText(/.+/).length).toBeGreaterThan(0);

  const sticky = screen.getByTestId("keyboard-sticky");
  expect(sticky.props.offset).toEqual({ closed: 0, opened: 18 });
  expect(within(sticky).getByText(t("validation:order.ratingRequired"))).toBeOnTheScreen();
});
