import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { t } from "@chowgo/shared/i18n";

import { deleteReviewReply, getSellerReviews, saveReviewReply } from "@/services/apiReview";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosError, renderWithProviders } from "@/test/utils";
import { SellerReviews } from "./SellerReviews";

vi.mock("@/services/apiReview", () => ({
  getSellerReviews: vi.fn(),
  saveReviewReply: vi.fn(),
  deleteReviewReply: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const reply = { text: "Thanks!", repliedAt: "2026-10-01T10:00:00Z", editedAt: null };

function review(overrides = {}) {
  return {
    id: "o1",
    rating: 5,
    text: "Great pizza",
    tags: ["tasty"],
    ratedAt: "2026-09-30T18:00:00Z",
    author: "Marko P.",
    reply: null,
    orderNumber: "ORD-1-ABCD",
    ...overrides,
  };
}

function page(reviews) {
  return {
    reviews,
    pagination: { page: 1, limit: 10, total: reviews.length, hasNext: false },
    summary: {
      average: 4.5,
      count: 2,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
      topTags: [{ tag: "tasty", count: 2 }],
    },
  };
}

const article = (text) => screen.getByText(text).closest("article");

describe("SellerReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      authUser: { role: "seller", restaurant: [{ _id: "r1", name: "Pizza Place" }] },
    });
    getSellerReviews.mockResolvedValue(
      page([review(), review({ id: "o2", text: "Good", rating: 4, reply, orderNumber: "ORD-2-WXYZ" })]),
    );
  });

  it("shows the summary, order numbers and existing replies", async () => {
    renderWithProviders(<SellerReviews />);
    expect(await screen.findByText("Great pizza")).toBeInTheDocument();
    expect(screen.getByText(t("restaurant:reviews.basedOn", { count: 2 }))).toBeInTheDocument();
    expect(screen.getByText("#ABCD")).toBeInTheDocument();
    expect(
      within(article("Good")).getByText(t("restaurant:reviews.replyFrom", { restaurant: "Pizza Place" })),
    ).toBeInTheDocument();
  });

  it("publishes a reply and refetches the list", async () => {
    const user = userEvent.setup();
    saveReviewReply.mockResolvedValue(review({ reply }));
    renderWithProviders(<SellerReviews />);
    await screen.findByText("Great pizza");
    const card = within(article("Great pizza"));

    await user.click(card.getByRole("button", { name: t("restaurant:reviews.reply") }));
    await user.type(card.getByPlaceholderText(t("restaurant:reviews.replyPlaceholder")), "  Thank you!  ");
    expect(card.getByText(`14/500`)).toBeInTheDocument();
    const calls = getSellerReviews.mock.calls.length;
    await user.click(card.getByRole("button", { name: t("common:actions.save") }));

    await waitFor(() =>
      expect(saveReviewReply.mock.calls.at(-1)?.[0]).toEqual({ orderId: "o1", text: "Thank you!" }),
    );
    expect(toast.success).toHaveBeenCalledWith(t("restaurant:reviews.replySaved"));
    await waitFor(() => expect(getSellerReviews.mock.calls.length).toBeGreaterThan(calls));
  });

  it("shows the server message when a reply is refused", async () => {
    const user = userEvent.setup();
    saveReviewReply.mockRejectedValue(
      axiosError(400, { code: "REVIEW_REPLY_INVALID", message: "Reply too long" }),
    );
    renderWithProviders(<SellerReviews />);
    await screen.findByText("Great pizza");
    const card = within(article("Great pizza"));

    await user.click(card.getByRole("button", { name: t("restaurant:reviews.reply") }));
    await user.type(card.getByPlaceholderText(t("restaurant:reviews.replyPlaceholder")), "Hi");
    await user.click(card.getByRole("button", { name: t("common:actions.save") }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Reply too long"));
    expect(card.getByPlaceholderText(t("restaurant:reviews.replyPlaceholder"))).toBeInTheDocument();
  });

  it("edits and deletes an existing reply", async () => {
    const user = userEvent.setup();
    saveReviewReply.mockResolvedValue(review({ id: "o2", reply }));
    deleteReviewReply.mockResolvedValue(review({ id: "o2" }));
    renderWithProviders(<SellerReviews />);
    await screen.findByText("Good");
    const card = within(article("Good"));

    await user.click(card.getByRole("button", { name: t("restaurant:reviews.editReply") }));
    const field = card.getByPlaceholderText(t("restaurant:reviews.replyPlaceholder"));
    expect(field).toHaveValue("Thanks!");
    await user.clear(field);
    await user.type(field, "Thanks again");
    await user.click(card.getByRole("button", { name: t("common:actions.save") }));
    await waitFor(() =>
      expect(saveReviewReply.mock.calls.at(-1)?.[0]).toEqual({ orderId: "o2", text: "Thanks again" }),
    );

    await user.click(
      await within(article("Good")).findByRole("button", { name: t("restaurant:reviews.deleteReply") }),
    );
    await waitFor(() => expect(deleteReviewReply.mock.calls[0]?.[0]).toBe("o2"));
    expect(toast.success).toHaveBeenCalledWith(t("restaurant:reviews.replyDeleted"));
  });

  it("asks the server for unanswered reviews when that filter is picked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SellerReviews />);
    await screen.findByText("Great pizza");
    await user.click(screen.getByRole("button", { name: t("restaurant:reviews.unanswered") }));
    await waitFor(() =>
      expect(getSellerReviews).toHaveBeenCalledWith({ page: 1, limit: 10, unreplied: true }),
    );
  });
});
