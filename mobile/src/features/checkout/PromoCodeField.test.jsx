import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { t } from "@chowgo/shared/i18n";

import { getMyVouchers, validatePromoCode } from "@/services/apiPromo";
import { axiosError, createWrapper } from "@/test/utils";
import { PromoCodeField } from "./PromoCodeField";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
jest.mock("@/services/apiPromo");

const promo = { code: "SAVE-10", type: "percentage", value: 10, currency: "EUR" };

async function renderField(props = {}) {
  const onApply = jest.fn();
  const onRemove = jest.fn();
  await render(<PromoCodeField restaurantId="r1" currency="EUR" onApply={onApply} onRemove={onRemove} {...props} />, {
    wrapper: createWrapper(),
  });
  return { onApply, onRemove };
}

const input = () => screen.getByLabelText(t("promo:checkout.label"));
const applyButton = () => screen.getByRole("button", { name: t("promo:checkout.apply") });

beforeEach(() => {
  jest.clearAllMocks();
  getMyVouchers.mockResolvedValue([]);
});

describe("PromoCodeField", () => {
  it("uppercases input and enables Apply once something is typed", async () => {
    await renderField();
    expect(applyButton()).toBeDisabled();
    await fireEvent.changeText(input(), "save-10");
    expect(input().props.value).toBe("SAVE-10");
    expect(applyButton()).toBeEnabled();
  });

  it("validates the normalised code and hands back the result", async () => {
    validatePromoCode.mockResolvedValue({ promo, discount: 1.24 });
    const { onApply } = await renderField();

    await fireEvent.changeText(input(), " save - 10 ");
    await fireEvent.press(applyButton());

    await waitFor(() => expect(onApply).toHaveBeenCalledWith({ code: "SAVE-10", discount: 1.24, promo }));
    expect(validatePromoCode.mock.calls[0][0]).toEqual({ code: "SAVE-10", restaurantId: "r1" });
    expect(input().props.value).toBe("");
  });

  it("shows the server's refusal and clears it on edit", async () => {
    validatePromoCode.mockRejectedValue(axiosError(404, { message: "That code does not exist" }));
    const { onApply } = await renderField();

    await fireEvent.changeText(input(), "NOPE1");
    await fireEvent(input(), "submitEditing");
    expect(await screen.findByText("That code does not exist")).toBeOnTheScreen();
    expect(onApply).not.toHaveBeenCalled();

    await fireEvent.changeText(input(), "NOPE12");
    expect(screen.queryByText("That code does not exist")).not.toBeOnTheScreen();
  });

  it("offers vouchers as one-tap codes", async () => {
    getMyVouchers.mockResolvedValue([{ code: "GIFT-ABC", type: "fixed", value: 5, currency: "EUR" }]);
    validatePromoCode.mockResolvedValue({ promo: { code: "GIFT-ABC" }, discount: 5 });
    const { onApply } = await renderField();

    await fireEvent.press(await screen.findByText(/€5\.00/));
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ code: "GIFT-ABC" })));
  });

  it("shows an applied code with its saving and removes it", async () => {
    const { onRemove } = await renderField({ applied: { code: "SAVE-10", discount: 1.24, promo } });
    expect(screen.queryByLabelText(t("promo:checkout.label"))).not.toBeOnTheScreen();
    expect(screen.getByText(/€1\.24/)).toBeOnTheScreen();
    expect(getMyVouchers).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: t("promo:checkout.remove") }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
