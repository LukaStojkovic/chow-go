/**
 * Checkout.
 *
 * A single column of numbered steps with a sticky summary beside it on
 * desktop. Nothing about the price is revealed late: the full breakdown is
 * visible from the moment the page loads and updates as options change.
 *
 * Note on promo codes: the brief calls for one, and `Order.discount` exists on
 * the schema, but `POST /orders/create` accepts no code and no promotion model
 * exists. A field that silently discards its input is worse than no field, so
 * the step is left out until there is something behind it.
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatDeliveryEstimate, formatPrice } from "@chowgo/shared/format";
import { MAX_ORDER_NOTES, useDeliveryTypes, usePaymentMethods } from "@/lib/constants";
import { toBasketLines } from "@chowgo/shared/adapters/menu";
import { PRICING, buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import useCartStore from "@/store/useCartStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { useCreateOrder } from "@/hooks/Orders/useCreateOrder";

import { ContentShell, PageContainer, StickyActionBar, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/StateViews";
import { CheckoutSection, OptionRow } from "@/features/checkout/CheckoutSection";
import { AddressStep } from "@/features/checkout/AddressStep";
import { OrderSummaryCard } from "@/features/checkout/OrderSummaryCard";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["basket", "common"]);
  const deliveryTypes = useDeliveryTypes();
  const paymentMethods = usePaymentMethods();
  const { items, totalPrice, restaurant, isLoading, fetchCart } = useCartStore();
  const { selectedDeliveryAddress } = useDeliveryStore();
  const { createOrder, isCreatingOrder } = useCreateOrder();

  const [deliveryType, setDeliveryType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const lines = useMemo(() => toBasketLines(items), [items]);
  const pricing = useMemo(
    () => buildPriceBreakdown({ subtotal: totalPrice, deliveryType, tip: tipAmount }),
    [totalPrice, deliveryType, tipAmount],
  );

  const blockers = [];
  if (!selectedDeliveryAddress) blockers.push(t("checkout.blockers.address"));
  if (!paymentMethod) blockers.push(t("checkout.blockers.payment"));
  if (!restaurant?._id) blockers.push(t("checkout.blockers.restaurant"));

  const handlePlaceOrder = () => {
    if (blockers.length > 0) return;

    createOrder({
      restaurantId: restaurant._id,
      deliveryAddressId: selectedDeliveryAddress._id,
      paymentMethod,
      customerNotes: customerNotes.trim(),
      tip: tipAmount,
      deliveryType,
    });
  };

  if (isLoading && lines.length === 0) {
    return (
      <PageContainer width="reading" withBottomNav={false} className="py-6">
        <span className="sr-only" role="status">
          {t("checkout.loading")}
        </span>
        <ContentShell
          main={
            <Stack gap="xl">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </Stack>
          }
          aside={<Skeleton className="h-96 w-full rounded-md" />}
        />
      </PageContainer>
    );
  }

  // An empty basket means there is nothing to check out. Redirecting silently
  // would be disorienting, so this explains itself.
  if (!isLoading && lines.length === 0) {
    return (
      <PageContainer width="narrow" withBottomNav={false} className="py-10">
        <EmptyState
          icon={ShoppingBag}
          title={t("checkout.empty.title")}
          description={t("checkout.empty.description")}
          action={
            <Button onClick={() => navigate("/discovery")}>
              {t("checkout.empty.action")}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!restaurant && !isLoading) return <Navigate to="/discovery" replace />;

  return (
    <>
      <PageContainer
        width="reading"
        withBottomNav={false}
        // Room for the mobile sticky action bar.
        className="py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10"
      >
        <ContentShell
          main={
            <Stack gap="2xl">
              <AddressStep step={1} />

              <CheckoutSection
                step={2}
                title={t("checkout.speed.title")}
                isComplete
                description={t("checkout.speed.description", {
                  estimate: formatDeliveryEstimate(restaurant?.estimatedDeliveryTime),
                })}
              >
                <fieldset className="space-y-2">
                  <legend className="sr-only">{t("checkout.speed.legend")}</legend>
                  {deliveryTypes.map((option) => (
                    <OptionRow
                      key={option.value}
                      id={`delivery-${option.value}`}
                      name="delivery-type"
                      checked={deliveryType === option.value}
                      onSelect={() => setDeliveryType(option.value)}
                      label={option.label}
                      description={option.description}
                      meta={
                        option.value === "priority"
                          ? `+${formatPrice(PRICING.priorityFee)}`
                          : t("checkout.speed.included")
                      }
                    />
                  ))}
                </fieldset>
              </CheckoutSection>

              <CheckoutSection
                step={3}
                title={t("checkout.payment.title")}
                isComplete={Boolean(paymentMethod)}
                description={t("checkout.payment.description")}
              >
                <fieldset className="space-y-2">
                  <legend className="sr-only">{t("checkout.payment.legend")}</legend>
                  {paymentMethods.map((option) => (
                    <OptionRow
                      key={option.value}
                      id={`payment-${option.value}`}
                      name="payment-method"
                      checked={paymentMethod === option.value}
                      onSelect={() => setPaymentMethod(option.value)}
                      label={option.label}
                      description={option.description}
                    />
                  ))}
                </fieldset>
              </CheckoutSection>

              <CheckoutSection
                step={4}
                title={t("checkout.tip.title")}
                description={t("checkout.tip.description")}
                isComplete
              >
                <div className="flex flex-wrap items-center gap-2">
                  {PRICING.tipPresets.map((amount) => {
                    const isActive = tipAmount === amount && customTip === "";
                    return (
                      <Button
                        key={amount}
                        type="button"
                        variant={isActive ? "primary" : "outline"}
                        size="sm"
                        aria-pressed={isActive}
                        onClick={() => {
                          setTipAmount(amount);
                          setCustomTip("");
                        }}
                      >
                        {amount === 0 ? t("checkout.tip.none") : formatPrice(amount)}
                      </Button>
                    );
                  })}

                  <div className="flex items-center gap-2">
                    <Label htmlFor="custom-tip" className="sr-only">
                      {t("checkout.tip.customLabel")}
                    </Label>
                    <Input
                      id="custom-tip"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="0.50"
                      placeholder={t("checkout.tip.customPlaceholder")}
                      value={customTip}
                      onChange={(event) => {
                        const raw = event.target.value;
                        setCustomTip(raw);
                        const parsed = Number.parseFloat(raw);
                        setTipAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
                      }}
                      className="h-9 w-24"
                    />
                  </div>
                </div>
              </CheckoutSection>

              <CheckoutSection
                step={5}
                title={t("checkout.notes.title")}
                description={t("checkout.notes.description")}
                isComplete
              >
                <div className="space-y-2">
                  <Label htmlFor="order-notes" className="sr-only">
                    {t("checkout.notes.label")}
                  </Label>
                  <Textarea
                    id="order-notes"
                    rows={3}
                    value={customerNotes}
                    maxLength={MAX_ORDER_NOTES}
                    placeholder={t("checkout.notes.placeholder")}
                    onChange={(event) => setCustomerNotes(event.target.value)}
                    aria-describedby="order-notes-count"
                  />
                  <p id="order-notes-count" className="text-caption text-muted-foreground">
                    {t("checkout.notes.count", {
                      used: customerNotes.length,
                      max: MAX_ORDER_NOTES,
                    })}
                  </p>
                </div>
              </CheckoutSection>
            </Stack>
          }
          aside={
            <OrderSummaryCard
              lines={lines}
              restaurant={restaurant}
              pricing={pricing}
              blockers={blockers}
              isPlacing={isCreatingOrder}
              onPlaceOrder={handlePlaceOrder}
            />
          }
        />

        <p className="text-caption text-muted-foreground mt-6 text-center">
          {t("checkout.terms")}
        </p>
      </PageContainer>

      {/* On mobile the total travels with the button, so the amount being
          committed to is never scrolled off-screen. */}
      <StickyActionBar className="lg:hidden">
        <Button
          size="lg"
          block
          disabled={blockers.length > 0}
          isLoading={isCreatingOrder}
          loadingLabel={t("checkout.placing")}
          onClick={handlePlaceOrder}
        >
          <span>{t("checkout.placeOrder")}</span>
          <span className="tabular ml-auto">{formatPrice(pricing.total)}</span>
        </Button>
        {blockers.length > 0 && (
          <p aria-live="polite" className="text-caption text-muted-foreground mt-2 text-center">
            {blockers[0]}
          </p>
        )}
      </StickyActionBar>
    </>
  );
}
