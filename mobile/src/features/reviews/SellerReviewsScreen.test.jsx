import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { deleteReviewReply, getSellerReviews, saveReviewReply } from "@/services/apiReview";
import { getOwnRestaurant } from "@/services/apiRestaurant";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/store/useToastStore";
import { createTestQueryClient, createWrapper } from "@/test/utils";
import SellerReviews from "../../../app/(seller)/reviews";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), canGoBack: () => true },
}));
jest.mock("@/components/ui/Dialog", () => {
  const { View } = require("react-native");
  const { Text } = require("@/components/ui/Text");
  return {
    Sheet: ({ visible, title, children }) =>
      visible ? (
        <View>
          <Text>{title}</Text>
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
jest.mock("@/services/apiReview", () => ({
  __esModule: true,
  getSellerReviews: jest.fn(),
  saveReviewReply: jest.fn(),
  deleteReviewReply: jest.fn(),
}));
jest.mock("@/services/apiRestaurant", () => ({ __esModule: true, getOwnRestaurant: jest.fn() }));

const R = (key, options) => t(`restaurant:reviews.${key}`, options);

const page = {
  reviews: [
    {
      id: "o1",
      orderNumber: "CG-101",
      rating: 2,
      text: "Cold fries",
      tags: ["arrived_cold"],
      ratedAt: "2026-10-01T12:00:00Z",
      author: "Marko P.",
      reply: null,
    },
    {
      id: "o2",
      orderNumber: "CG-102",
      rating: 5,
      text: null,
      tags: ["tasty"],
      ratedAt: "2026-10-02T12:00:00Z",
      author: "Ana J.",
      reply: { text: "Thank you!", repliedAt: "2026-10-03T12:00:00Z", editedAt: null },
    },
  ],
  pagination: { page: 1, limit: 10, total: 2, hasNext: false },
  summary: {
    average: 3.5,
    count: 2,
    distribution: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 1 },
    topTags: [{ tag: "tasty", count: 1 }],
  },
};

async function renderScreen() {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <SellerReviews />
    </SafeAreaProvider>,
    { wrapper: createWrapper(createTestQueryClient()) },
  );
  await screen.findByText("Cold fries");
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ authUser: { _id: "u1", role: "seller", restaurant: [{ _id: "r1" }] } });
  getOwnRestaurant.mockResolvedValue({ _id: "r1", name: "Burger Bar" });
  getSellerReviews.mockResolvedValue(page);
  saveReviewReply.mockResolvedValue({ ...page.reviews[0] });
  deleteReviewReply.mockResolvedValue({ ...page.reviews[1], reply: null });
});

it("shows reviews with order numbers, the summary and the existing reply", async () => {
  await renderScreen();

  expect(screen.getByText(t("order:detail.numbered", { number: "CG-101" }))).toBeOnTheScreen();
  expect(screen.getByText("Thank you!")).toBeOnTheScreen();
  expect(await screen.findByText(R("replyFrom", { restaurant: "Burger Bar" }))).toBeOnTheScreen();
  expect(screen.getByText(R("basedOn", { count: 2 }))).toBeOnTheScreen();
});

it("replies to a review and refetches the list", async () => {
  await renderScreen();

  await fireEvent.press(screen.getByRole("button", { name: R("reply") }));
  expect(screen.getByText(R("replyHint"))).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByPlaceholderText(R("replyPlaceholder")), "  Sorry, next one is on us ");
  expect(screen.getByText("27/500")).toBeOnTheScreen();

  const calls = getSellerReviews.mock.calls.length;
  await fireEvent.press(screen.getByRole("button", { name: t("common:actions.save") }));

  expect(saveReviewReply.mock.calls[0][0]).toEqual({ orderId: "o1", text: "Sorry, next one is on us" });
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith(R("replySaved")));
  await waitFor(() => expect(getSellerReviews.mock.calls.length).toBeGreaterThan(calls));
  expect(screen.queryByPlaceholderText(R("replyPlaceholder"))).toBeNull();
});

it("deletes a reply only after confirming", async () => {
  await renderScreen();

  await fireEvent.press(screen.getByRole("button", { name: R("deleteReply") }));
  expect(deleteReviewReply).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole("button", { name: t("common:actions.delete") }));

  expect(deleteReviewReply.mock.calls[0][0]).toBe("o2");
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith(R("replyDeleted")));
});

it("filters to unanswered reviews", async () => {
  await renderScreen();

  await fireEvent.press(screen.getByRole("button", { name: R("unanswered") }));

  await waitFor(() =>
    expect(getSellerReviews).toHaveBeenLastCalledWith(expect.objectContaining({ unreplied: "true", page: 1 })),
  );
});
