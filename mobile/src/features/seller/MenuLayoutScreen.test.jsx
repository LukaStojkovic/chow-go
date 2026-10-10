import { fireEvent, render, screen } from "@testing-library/react-native";
import { formatPrice } from "@chowgo/shared/format";
import { t } from "@chowgo/shared/i18n";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { getMenuLayout, getOwnRestaurant, saveMenuLayout } from "@/services/apiRestaurant";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import MenuLayoutScreen from "../../../app/(seller)/menu-layout";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), canGoBack: () => true },
}));
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
  getMenuLayout: jest.fn(),
  getOwnRestaurant: jest.fn(),
  saveMenuLayout: jest.fn(),
}));

const dish = (id, name) => ({ _id: id, name, price: 300, available: true, imageUrls: [] });

const layout = {
  sections: [
    { _id: "s1", name: "Breakfast", items: [dish("m1", "Burek"), dish("m2", "Kifla")] },
    { _id: "s2", name: "Drinks", items: [dish("m3", "Jogurt")] },
  ],
  unsectioned: [dish("m4", "Pljeskavica")],
};

const L = (key) => t(`seller:menuLayout.${key}`);

async function renderScreen() {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <MenuLayoutScreen />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
  await screen.findByText("Burek");
}

async function save() {
  await fireEvent.press(screen.getByRole("button", { name: L("save") }));
  return saveMenuLayout.mock.calls.at(-1)[0];
}

async function moveTo(dishName, target) {
  const buttons = screen.getAllByRole("button", { name: L("moveTo") });
  const button = buttons.find((entry) => entry.props.accessibilityHint === dishName);
  await fireEvent.press(button);
  await fireEvent.press(screen.getByRole("button", { name: target }));
}

function pressFor(label, hint) {
  const button = screen
    .getAllByRole("button", { name: label })
    .find((entry) => entry.props.accessibilityHint === hint);
  return fireEvent.press(button);
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ authUser: { _id: "u1", role: "seller", restaurant: [{ _id: "r1" }] } });
  getMenuLayout.mockResolvedValue(layout);
  getOwnRestaurant.mockResolvedValue({ _id: "r1", currency: "RSD" });
  saveMenuLayout.mockImplementation(async () => layout);
});

it("starts clean, with save disabled until something changes", async () => {
  await renderScreen();

  expect(screen.getByRole("button", { name: L("save") })).toBeDisabled();
  expect(screen.queryByText(L("unsaved"))).toBeNull();
  expect(screen.getByText(L("unsectioned"))).toBeOnTheScreen();
  expect(screen.getByText("Pljeskavica")).toBeOnTheScreen();
});

it("adds a section and saves it without an id", async () => {
  await renderScreen();

  await fireEvent.changeText(screen.getAllByPlaceholderText(L("sectionNamePlaceholder"))[0], "  Desserts ");
  await fireEvent.press(screen.getByRole("button", { name: L("addSection") }));

  expect(screen.getByText(L("unsaved"))).toBeOnTheScreen();
  expect(await save()).toEqual([
    { _id: "s1", name: "Breakfast", itemIds: ["m1", "m2"] },
    { _id: "s2", name: "Drinks", itemIds: ["m3"] },
    { name: "Desserts", itemIds: [] },
  ]);
  expect(toast.success).toHaveBeenCalledWith(L("saved"));
});

it("renames a section in place, keeping its id", async () => {
  await renderScreen();

  await fireEvent.changeText(screen.getByDisplayValue("Drinks"), "Beverages");
  expect((await save())[1]).toEqual({ _id: "s2", name: "Beverages", itemIds: ["m3"] });
});

it("deleting a section sends its dishes to Not in a section", async () => {
  await renderScreen();

  await pressFor(L("deleteSection"), "Breakfast");
  expect(screen.getByText(L("deleteSectionHint"))).toBeOnTheScreen();
  const confirms = screen.getAllByRole("button", { name: L("deleteSection") });
  await fireEvent.press(confirms.find((entry) => entry.props.accessibilityHint === undefined));

  expect(screen.queryByDisplayValue("Breakfast")).toBeNull();
  expect(screen.getByText("Burek")).toBeOnTheScreen();
  expect(await save()).toEqual([{ _id: "s2", name: "Drinks", itemIds: ["m3"] }]);
});

it("reorders sections and the dishes inside them", async () => {
  await renderScreen();

  await pressFor(L("moveDown"), "Breakfast");
  await pressFor(L("moveUp"), "Kifla");

  expect(await save()).toEqual([
    { _id: "s2", name: "Drinks", itemIds: ["m3"] },
    { _id: "s1", name: "Breakfast", itemIds: ["m2", "m1"] },
  ]);
});

it("cannot move the first entry up", async () => {
  await renderScreen();

  const up = screen
    .getAllByRole("button", { name: L("moveUp") })
    .find((entry) => entry.props.accessibilityHint === "Breakfast");
  expect(up).toBeDisabled();
});

it("moves dishes between sections and out of them", async () => {
  await renderScreen();

  await moveTo("Pljeskavica", "Drinks");
  await moveTo("Burek", L("unsectioned"));

  expect(await save()).toEqual([
    { _id: "s1", name: "Breakfast", itemIds: ["m2"] },
    { _id: "s2", name: "Drinks", itemIds: ["m3", "m4"] },
  ]);
});

it("refuses duplicate names before calling the server", async () => {
  await renderScreen();

  await fireEvent.changeText(screen.getByDisplayValue("Drinks"), " breakfast");
  await fireEvent.press(screen.getByRole("button", { name: L("save") }));
  expect(saveMenuLayout).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalledWith(L("saveFailed"), {
    description: t("errors:menuLayout.duplicateName", { name: "breakfast" }),
  });
});

it("discard puts the saved layout back", async () => {
  await renderScreen();

  await fireEvent.changeText(screen.getByDisplayValue("Drinks"), "Beverages");
  await fireEvent.press(screen.getByRole("button", { name: L("discard") }));

  expect(screen.getByDisplayValue("Drinks")).toBeOnTheScreen();
  expect(screen.queryByText(L("unsaved"))).toBeNull();
});

it("shows the seller's own currency", async () => {
  await renderScreen();
  expect(await screen.findAllByText(formatPrice(300, { currency: "RSD" }))).toHaveLength(4);
});
