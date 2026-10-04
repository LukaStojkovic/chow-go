import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyVouchers, validatePromoCode } from "@/services/apiPromo";
import { axiosError, renderWithProviders } from "@/test/utils";
import { PromoCodeField } from "./PromoCodeField";

vi.mock("@/services/apiPromo", () => ({
  getMyVouchers: vi.fn(),
  validatePromoCode: vi.fn(),
}));

const promo = { code: "SAVE-10", type: "percentage", value: 10, currency: "EUR" };

function renderField(props = {}) {
  const onApply = vi.fn();
  const onRemove = vi.fn();
  renderWithProviders(
    <PromoCodeField restaurantId="r1" currency="EUR" onApply={onApply} onRemove={onRemove} {...props} />,
  );
  return { onApply, onRemove, user: userEvent.setup() };
}

beforeEach(() => {
  vi.clearAllMocks();
  getMyVouchers.mockResolvedValue([]);
});

describe("PromoCodeField", () => {
  it("keeps Apply disabled until something is typed, and uppercases input", async () => {
    const { user } = renderField();
    const apply = screen.getByRole("button", { name: /apply/i });
    expect(apply).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "save-10");
    expect(screen.getByRole("textbox")).toHaveValue("SAVE-10");
    expect(apply).toBeEnabled();
  });

  it("validates the normalised code and reports the result", async () => {
    validatePromoCode.mockResolvedValue({ promo, discount: 1.24 });
    const { user, onApply } = renderField();

    await user.type(screen.getByRole("textbox"), " save - 10 {Enter}");

    await waitFor(() => expect(onApply).toHaveBeenCalledWith({ code: "SAVE-10", discount: 1.24, promo }));
    expect(validatePromoCode.mock.calls[0][0]).toEqual({ code: "SAVE-10", restaurantId: "r1" });
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("shows the server's refusal and clears it when the customer edits", async () => {
    validatePromoCode.mockRejectedValue(axiosError(404, { message: "That code does not exist" }));
    const { user, onApply } = renderField();

    await user.type(screen.getByRole("textbox"), "NOPE1{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("That code does not exist");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(onApply).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox"), "2");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("offers the customer's vouchers as one-tap codes", async () => {
    getMyVouchers.mockResolvedValue([{ code: "GIFT-ABC", type: "fixed", value: 5, currency: "EUR" }]);
    validatePromoCode.mockResolvedValue({ promo: { code: "GIFT-ABC" }, discount: 5 });
    const { user, onApply } = renderField();

    await user.click(await screen.findByRole("button", { name: /GIFT-ABC/ }));
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ code: "GIFT-ABC" })));
  });

  it("does nothing without a restaurant", async () => {
    const { user } = renderField({ restaurantId: undefined });
    await user.type(screen.getByRole("textbox"), "SAVE-10{Enter}");
    expect(validatePromoCode).not.toHaveBeenCalled();
  });

  it("shows an applied code with its saving and can remove it", async () => {
    const { user, onRemove } = renderField({ applied: { code: "SAVE-10", discount: 1.24, promo } });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText(/SAVE-10/)).toBeInTheDocument();
    expect(screen.getByText(/€1\.24/)).toBeInTheDocument();
    expect(getMyVouchers).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
